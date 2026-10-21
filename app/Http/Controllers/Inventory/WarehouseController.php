<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Catalog\Product;
use App\Models\Inventory\ProductStock;
use App\Models\Inventory\StockAdjustment;
use App\Models\Inventory\StockMovement;
use App\Models\Inventory\StockTransfer;
use App\Models\Inventory\Warehouse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class WarehouseController extends Controller
{
    public function index()
    {
        return Inertia::render('inventory/warehouses/index', [
            'warehouses' => Warehouse::withCount('stocks as products_count')
                ->withSum('stocks as total_quantity', 'quantity')
                ->latest()
                ->get()
                ->map(function ($w) {
                    $w->total_quantity = (float) ($w->total_quantity ?? 0);

                    return $w;
                }),
        ]);
    }

    public function show(Request $request, Warehouse $warehouse)
    {
        $search = trim((string) $request->query('search', ''));

        // Linhas de produtos que existem (as de produtos apagados ficam de fora)
        $lines = fn () => ProductStock::query()
            ->where('warehouse_id', $warehouse->id)
            ->whereHas('product', fn ($q) => $q->when($search !== '', fn ($q) => $q->search($search)));

        // Os totais são de todo o armazém (ou da pesquisa), não só da página que se vê
        $totals = $lines()
            ->selectRaw('COUNT(*) as products, COALESCE(SUM(quantity), 0) as quantity')
            ->first();

        $stocks = $lines()
            ->with(['product.category', 'product.brand', 'product.unit'])
            ->orderBy(Product::select('name')->whereColumn('products.id', 'product_stocks.product_id'))
            ->orderBy('product_stocks.id')
            ->paginate(15)
            ->withQueryString();

        $movements = StockMovement::with(['product' => fn ($q) => $q->withTrashed(), 'user'])
            ->where('warehouse_id', $warehouse->id)
            ->latest()
            ->take(10)
            ->get();

        return Inertia::render('inventory/warehouses/show', [
            'warehouse' => $warehouse,
            'stocks' => $stocks,
            'totals' => ['products' => (int) $totals->products, 'quantity' => (float) $totals->quantity],
            'filters' => ['search' => $search],
            'movements' => $movements,
        ]);
    }

    public function create()
    {
        return Inertia::render('inventory/warehouses/create');
    }

    public function store(Request $request)
    {
        $data = $request->validate($this->rules());

        DB::transaction(function () use ($data) {
            $companyId = auth()->user()->company_id;

            if ($data['is_default'] ?? false) {
                Warehouse::where('company_id', $companyId)->update(['is_default' => false]);
            }

            Warehouse::create([
                'company_id' => $companyId,
                'name' => $data['name'],
                'code' => $data['code'] ?? null,
                'address' => $data['address'] ?? null,
                'description' => $data['description'] ?? null,
                'is_default' => $data['is_default'] ?? false,
                'is_active' => $data['is_active'] ?? true,
            ]);
        });

        return redirect()->route('warehouses.index')
            ->with('success', 'Armazém criado com sucesso!');
    }

    public function edit(Warehouse $warehouse)
    {
        return Inertia::render('inventory/warehouses/edit', [
            'warehouse' => $warehouse,
        ]);
    }

    public function update(Request $request, Warehouse $warehouse)
    {
        $data = $request->validate($this->rules());

        DB::transaction(function () use ($data, $warehouse) {
            // Só os campos validados: nunca company_id ou outros atributos vindos do pedido
            if ($data['is_default'] ?? false) {
                Warehouse::where('company_id', $warehouse->company_id)
                    ->whereKeyNot($warehouse->id)
                    ->update(['is_default' => false]);
            }

            $warehouse->update($data);
        });

        return redirect()->route('warehouses.index')
            ->with('success', 'Armazém atualizado!');
    }

    public function destroy(Warehouse $warehouse)
    {
        $reason = $this->deletionBlocker($warehouse);

        if ($reason) {
            return back()->with('error', $reason);
        }

        $warehouse->delete();

        return back()->with('success', 'Armazém removido!');
    }

    private function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'description' => 'nullable|string',
            'is_default' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    /** Motivo pelo qual o armazém não pode ser removido (stock, documentos de stock em curso), ou null. */
    private function deletionBlocker(Warehouse $warehouse): ?string
    {
        if ($warehouse->stocks()->where('quantity', '!=', 0)->exists()) {
            return 'Não é possível remover um armazém com stock. Transfira ou ajuste o stock primeiro.';
        }

        $pendingTransfers = StockTransfer::whereIn('status', ['pending', 'approved', 'in_transit'])
            ->where(fn ($q) => $q->where('from_warehouse_id', $warehouse->id)->orWhere('to_warehouse_id', $warehouse->id))
            ->exists();

        if ($pendingTransfers) {
            return 'Não é possível remover um armazém com transferências por concluir.';
        }

        if (StockAdjustment::where('warehouse_id', $warehouse->id)->where('status', 'draft')->exists()) {
            return 'Não é possível remover um armazém com ajustes em rascunho.';
        }

        return null;
    }
}
