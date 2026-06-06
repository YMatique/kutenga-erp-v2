<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\StockTransfer;
use App\Models\Warehouse;
use App\Services\Inventory\StockTransferService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StockTransferController extends Controller
{
    //
      public function __construct(
        private StockTransferService $service
    ) {}

    public function index()
    {
        $transfers = StockTransfer::with(['fromWarehouse', 'toWarehouse'])
            ->where('company_id', auth()->user()->company_id)
            ->latest()
            ->get();

        return Inertia::render('inventory/transfers/index', [
            'transfers' => $transfers
        ]);
    }

    public function create()
    {
        return Inertia::render('Inventory/Transfers/Create', [
            'warehouses' => Warehouse::all()
        ]);
    }

    public function store(Request $request)
    {
        $transfer = StockTransfer::create([
            'company_id' => auth()->user()->company_id,
            'from_warehouse_id' => $request->from_warehouse_id,
            'to_warehouse_id' => $request->to_warehouse_id,
            'status' => 'pending'
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
}
