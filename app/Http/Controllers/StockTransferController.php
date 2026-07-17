<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\StockTransfer;
use App\Models\Warehouse;
use App\Services\Inventory\StockTransferService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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
        ]);
    }

    public function create()
    {
        $companyId = Auth::user()->company_id;
        $products = Product::query()
            ->where('company_id', $companyId)
            ->where('track_stock', true)
            ->whereHas('stocks', function ($q) {
                $q->where('quantity', '>', 0);
            })
            ->with(['stocks' => function ($q) {
                $q->select('product_id', 'quantity');
            }])
            ->get();

        return Inertia::render('inventory/transfers/create', [
            'warehouses' => Warehouse::where('company_id', $companyId)->get(),
            'products' => $products,
        ]);
    }

    public function store(Request $request)
    {
        $transfer = StockTransfer::create([
            'company_id' => auth()->user()->company_id,
            'from_warehouse_id' => $request->from_warehouse_id,
            'to_warehouse_id' => $request->to_warehouse_id,
            'status' => 'pending',
        ]);

        // items (simplificado)
        foreach ($request->items as $item) {
            $transfer->items()->create($item);
        }

        return redirect()->route('inventory.transfers.index');
    }

    public function complete(StockTransfer $transfer)
    {
        $this->service->complete($transfer);

        return back();
    }

    public function show(StockTransfer $transfer)
    {
        $transfer->load(['items.product', 'fromWarehouse', 'toWarehouse']);

        return Inertia::render('inventory/transfers/show', [
            'transfer' => $transfer,
        ]);
    }

    public function cancel(StockTransfer $transfer)
    {
        if ($transfer->status === 'completed') {
            throw new \Exception('Não é possível cancelar uma transferência concluída.');
        }

        $transfer->update([
            'status' => 'cancelled',
        ]);
    }
    public function approve(StockTransfer $transfer)
    {
        if ($transfer->status !== 'pending') {
            throw new \Exception('Apenas transferências pendentes podem ser aprovadas.');
        }

        $transfer->update([
            'status' => 'approved',
        ]);
        return back();
    }
}
