<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Catalog\Product;
use App\Models\Inventory\StockTransfer;
use App\Models\Inventory\Warehouse;
use App\Services\Inventory\StockService;
use App\Services\Inventory\StockTransferService;
use App\Support\Tenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class StockTransferController extends Controller
{
    //
    public function __construct(
        private StockTransferService $service
    ) {}

    public function index(Request $request)
    {
        $companyId = auth()->user()->company_id;

        $query = StockTransfer::with(['fromWarehouse', 'toWarehouse'])
            ->withCount('items')
            // Em trânsito e já com alguma coisa recebida ou resolvida: "parcialmente recebida"
            ->withExists(['items as is_partial' => fn ($q) => $q->where(fn ($q) => $q->where('received_quantity', '>', 0)->orWhereNotNull('shortage_action'))])
            ->where('company_id', $companyId);

        // filtro por status
        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // pesquisa por ID ou warehouse
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('id', $request->search)
                    ->orWhereHas('fromWarehouse', fn ($w) => $w->where('name', 'like', "%{$request->search}%")
                    )
                    ->orWhereHas('toWarehouse', fn ($w) => $w->where('name', 'like', "%{$request->search}%")
                    );
            });
        }

        $transfers = $query
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return inertia('inventory/transfers/index', [
            'transfers' => $transfers,
            'filters' => $request->only(['status', 'search']),
            'can' => $this->abilities(),
        ]);
    }

    public function create()
    {
        $companyId = Auth::user()->company_id;

        // Os produtos não vêm aqui: o formulário pesquisa-os no servidor, já com o stock da origem
        return Inertia::render('inventory/transfers/create', [
            'warehouses' => Warehouse::where('company_id', $companyId)->get(),
        ]);
    }

    public function store(Request $request, StockService $stockService)
    {
        $data = $request->validate([
            'from_warehouse_id' => ['required', 'integer', Tenant::exists('warehouses')],
            'to_warehouse_id' => ['required', 'integer', 'different:from_warehouse_id', Tenant::exists('warehouses')],
            'notes' => ['nullable', 'string', 'max:255'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'distinct', Tenant::exists('products')],
            'items.*.quantity' => ['required', 'numeric', 'gt:0'],
        ]);

        // Recusa logo uma quantidade que a unidade do produto não aceita (2,5 caixas não existem)
        $products = Product::with('unit')->whereIn('id', collect($data['items'])->pluck('product_id'))->get()->keyBy('id');

        foreach ($data['items'] as $item) {
            $stockService->assertQuantityAllowed($products[$item['product_id']], (float) $item['quantity']);
        }

        DB::transaction(function () use ($data) {
            $transfer = StockTransfer::create([
                'company_id' => auth()->user()->company_id,
                'from_warehouse_id' => $data['from_warehouse_id'],
                'to_warehouse_id' => $data['to_warehouse_id'],
                'notes' => $data['notes'] ?? null,
                'status' => 'pending',
                'created_by' => auth()->id(),
            ]);

            foreach ($data['items'] as $item) {
                $transfer->items()->create([
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                ]);
            }
        });

        return redirect()->route('inventory.transfers.index')->with('success', 'Transferência criada com sucesso.');
    }

    public function complete(StockTransfer $transfer)
    {
        return $this->run(fn () => $this->service->complete($transfer), 'Transferência concluída.');
    }

    public function ship(StockTransfer $transfer)
    {
        return $this->run(fn () => $this->service->ship($transfer), 'Transferência enviada: a mercadoria está em trânsito.');
    }

    public function receive(Request $request, StockTransfer $transfer)
    {
        $data = $request->validate([
            'received' => ['nullable', 'array'],
            'received.*' => ['numeric', 'min:0'],
            'shortage' => ['nullable', 'array'],
            'shortage.*' => ['in:loss,return,pending'],
        ]);

        return $this->run(
            fn () => $this->service->receive($transfer, $data['received'] ?? [], $data['shortage'] ?? []),
            'Transferência recebida.'
        );
    }

    public function show(StockTransfer $transfer, StockService $stockService)
    {
        $transfer->load(['items.product', 'fromWarehouse', 'toWarehouse']);

        // O que ainda falta receber de cada produto, para o ecrã de receção
        $transfer->items->each->append('remaining');

        // Enquanto está em curso, mostra quanto há disponível na origem para cada produto
        // (sem contar a reserva da própria transferência, que é dela)
        if (in_array($transfer->status, ['pending', 'approved'], true)) {
            $transfer->items->each(fn ($item) => $item->setAttribute(
                'available',
                $stockService->getAvailable($item->product, $transfer->fromWarehouse, $transfer->id)
            ));
        }

        return Inertia::render('inventory/transfers/show', [
            'transfer' => $transfer,
            'can' => $this->abilities(),
        ]);
    }

    public function cancel(StockTransfer $transfer)
    {
        return $this->run(
            fn () => $this->service->cancel($transfer),
            $transfer->status === 'in_transit' ? 'Transferência cancelada: a mercadoria voltou à origem.' : 'Transferência cancelada.'
        );
    }

    public function approve(StockTransfer $transfer)
    {
        return $this->run(fn () => $this->service->approve($transfer), 'Transferência aprovada.');
    }

    /** O que o utilizador pode fazer, para o ecrã só mostrar as ações que não acabariam num 403. */
    private function abilities(): array
    {
        $user = auth()->user();

        return [
            'transfer' => $user->can('inventory.transfer'),
            'receive' => $user->can('inventory.receive'),
        ];
    }

    /** Executa a ação e mostra as recusas de regra de negócio como aviso, não como erro 500. */
    private function run(callable $action, string $success): RedirectResponse
    {
        try {
            $action();
        } catch (ValidationException $e) {
            return back()->with('error', collect($e->errors())->flatten()->first());
        }

        return back()->with('success', $success);
    }
}
