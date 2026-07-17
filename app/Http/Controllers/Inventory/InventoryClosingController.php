<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;

use App\Models\Inventory\InventoryClosing;
use App\Models\Inventory\InventoryClosingItem;
use App\Models\Inventory\ProductStock;
use App\Models\Inventory\Warehouse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class InventoryClosingController extends Controller
{
    /**
     * Lista todos os fechamentos de inventário da empresa.
     */
    public function index(Request $request)
    {
        $companyId = Auth::user()->company_id;

        $query = InventoryClosing::where('company_id', $companyId)
            ->with(['warehouse:id,name', 'creator:id,name'])
            ->withCount('items');

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('warehouse_id')) {
            $query->where('warehouse_id', $request->warehouse_id);
        }

        $closings = $query->orderBy('reference_date', 'desc')
            ->paginate(15)
            ->withQueryString()
            ->through(function ($closing) {
                return [
                    'id'               => $closing->id,
                    'reference_date'   => $closing->reference_date,
                    'status'           => $closing->status,
                    'warehouse'        => $closing->warehouse?->name ?? 'Todos os Armazéns',
                    'creator'          => $closing->creator?->name ?? '—',
                    'items_count'      => $closing->items_count,
                    'blocks_movements' => $closing->blocks_movements,
                    'completed_at'     => $closing->completed_at,
                    'notes'            => $closing->notes,
                    'created_at'       => $closing->created_at,
                ];
            });

        $stats = [
            'total'     => InventoryClosing::where('company_id', $companyId)->count(),
            'drafts'    => InventoryClosing::where('company_id', $companyId)->where('status', 'draft')->count(),
            'completed' => InventoryClosing::where('company_id', $companyId)->where('status', 'completed')->count(),
        ];

        $warehouses = Warehouse::where('company_id', $companyId)
            ->where('is_active', true)
            ->get(['id', 'name']);

        return Inertia::render('inventory/closings/index', [
            'closings'   => $closings,
            'stats'      => $stats,
            'warehouses' => $warehouses,
            'filters'    => $request->only(['status', 'warehouse_id']),
        ]);
    }

    /**
     * Formulário para criar novo fechamento com snapshot automático do stock atual.
     */
    public function create(Request $request)
    {
        $companyId = Auth::user()->company_id;

        $warehouses = Warehouse::where('company_id', $companyId)
            ->where('is_active', true)
            ->get(['id', 'name']);

        // Preview do stock atual para pré-visualização
        $warehouseId = $request->warehouse_id;
        $stockQuery  = ProductStock::where('company_id', $companyId)
            ->with(['product:id,name,sku,unit_id', 'product.unit:id,short_name', 'warehouse:id,name'])
            ->where('quantity', '>', 0);

        if ($warehouseId) {
            $stockQuery->where('warehouse_id', $warehouseId);
        }

        $stockPreview = $stockQuery->get()->map(fn($s) => [
            'product_id'       => $s->product_id,
            'product_name'     => $s->product?->name ?? '—',
            'product_sku'      => $s->product?->sku ?? '—',
            'unit'             => $s->product?->unit?->short_name ?? '—',
            'warehouse_id'     => $s->warehouse_id,
            'warehouse_name'   => $s->warehouse?->name ?? '—',
            'quantity_current' => (float) $s->quantity,
        ]);

        return Inertia::render('inventory/closings/create', [
            'warehouses'   => $warehouses,
            'stockPreview' => $stockPreview,
            'today'        => now()->toDateString(),
        ]);
    }

    /**
     * Persiste o fechamento e gera o snapshot de stock (quantity_expected).
     */
    public function store(Request $request)
    {
        $companyId = Auth::user()->company_id;

        $validated = $request->validate([
            'reference_date'   => 'required|date|before_or_equal:today',
            'warehouse_id'     => 'nullable|exists:warehouses,id',
            'notes'            => 'nullable|string|max:1000',
            'blocks_movements' => 'boolean',
        ]);

        DB::beginTransaction();
        try {
            $closing = InventoryClosing::create([
                'company_id'       => $companyId,
                'warehouse_id'     => $validated['warehouse_id'] ?? null,
                'created_by'       => Auth::id(),
                'reference_date'   => $validated['reference_date'],
                'status'           => 'draft',
                'notes'            => $validated['notes'] ?? null,
                'blocks_movements' => $validated['blocks_movements'] ?? false,
            ]);

            // Gerar snapshot do stock actual
            $stockQuery = ProductStock::where('company_id', $companyId);
            if (!empty($validated['warehouse_id'])) {
                $stockQuery->where('warehouse_id', $validated['warehouse_id']);
            }

            $stocks = $stockQuery->get();
            $items  = [];
            foreach ($stocks as $stock) {
                $items[] = [
                    'closing_id'        => $closing->id,
                    'product_id'        => $stock->product_id,
                    'warehouse_id'      => $stock->warehouse_id,
                    'quantity_expected' => $stock->quantity,
                    'quantity_counted'  => null,
                    'created_at'        => now(),
                    'updated_at'        => now(),
                ];
            }

            if (!empty($items)) {
                InventoryClosingItem::insert($items);
            }

            DB::commit();

            return redirect()
                ->route('inventory.closings.show', $closing->id)
                ->with('success', 'Fechamento de inventário iniciado! Preencha as quantidades contadas.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Detalhe do fechamento com comparação esperado vs. contado.
     */
    public function show(InventoryClosing $closing)
    {
        $this->authorizeClosing($closing);

        $closing->load([
            'warehouse:id,name',
            'creator:id,name',
            'items.product:id,name,sku',
            'items.product.unit:id,short_name',
            'items.warehouse:id,name',
        ]);

        $items = $closing->items->map(function ($item) {
            $variance = $item->variance_value;
            return [
                'id'                => $item->id,
                'product_id'        => $item->product_id,
                'product_name'      => $item->product?->name ?? '—',
                'product_sku'       => $item->product?->sku ?? '—',
                'unit'              => $item->product?->unit?->short_name ?? '—',
                'warehouse_name'    => $item->warehouse?->name ?? '—',
                'quantity_expected' => (float) $item->quantity_expected,
                'quantity_counted'  => $item->quantity_counted !== null ? (float) $item->quantity_counted : null,
                'variance'          => $variance,
                'variance_class'    => $variance > 0 ? 'positive' : ($variance < 0 ? 'negative' : 'zero'),
            ];
        });

        $summary = [
            'total_items'       => $items->count(),
            'items_counted'     => $items->where('quantity_counted', '!==', null)->count(),
            'items_with_excess' => $items->where('variance', '>', 0)->count(),
            'items_with_deficit'=> $items->where('variance', '<', 0)->count(),
            'items_ok'          => $items->where('variance', '===', 0)->count(),
        ];

        return Inertia::render('inventory/closings/show', [
            'closing' => [
                'id'               => $closing->id,
                'reference_date'   => $closing->reference_date,
                'status'           => $closing->status,
                'warehouse'        => $closing->warehouse?->name ?? 'Todos os Armazéns',
                'creator'          => $closing->creator?->name ?? '—',
                'blocks_movements' => $closing->blocks_movements,
                'completed_at'     => $closing->completed_at,
                'notes'            => $closing->notes,
            ],
            'items'   => $items,
            'summary' => $summary,
        ]);
    }

    /**
     * Atualiza as quantidades contadas (só em rascunhos).
     */
    public function updateItems(Request $request, InventoryClosing $closing)
    {
        $this->authorizeClosing($closing);

        if ($closing->isCompleted()) {
            return back()->withErrors(['error' => 'Não é possível editar um fechamento já concluído.']);
        }

        $validated = $request->validate([
            'items'                    => 'required|array',
            'items.*.id'               => 'required|exists:inventory_closing_items,id',
            'items.*.quantity_counted' => 'nullable|numeric|min:0',
        ]);

        DB::beginTransaction();
        try {
            foreach ($validated['items'] as $item) {
                InventoryClosingItem::where('id', $item['id'])
                    ->where('closing_id', $closing->id)
                    ->update(['quantity_counted' => $item['quantity_counted']]);
            }
            DB::commit();
            return back()->with('success', 'Quantidades atualizadas com sucesso!');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Conclui o fechamento (torna-o imutável).
     */
    public function complete(Request $request, InventoryClosing $closing)
    {
        $this->authorizeClosing($closing);

        if ($closing->isCompleted()) {
            return back()->withErrors(['error' => 'Este fechamento já foi concluído.']);
        }

        $closing->update([
            'status'       => 'completed',
            'completed_at' => now(),
        ]);

        return redirect()
            ->route('inventory.closings.show', $closing->id)
            ->with('success', 'Fechamento de inventário concluído e bloqueado para edição.');
    }

    /**
     * Garante que o fechamento pertence à empresa do utilizador.
     */
    private function authorizeClosing(InventoryClosing $closing): void
    {
        if ($closing->company_id !== Auth::user()->company_id) {
            abort(403);
        }
    }
}
