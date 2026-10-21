<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Catalog\Product;
use App\Models\Inventory\ProductStock;
use App\Models\Inventory\StockMovement;
use App\Models\Inventory\StockTransferItem;
use App\Models\Inventory\Warehouse;
use App\Services\Inventory\StockExporter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ProductStockController extends Controller
{
    public function index(Request $request)
    {
        $companyId = auth()->user()->company_id;

        $query = StockExporter::filteredStocks($request, $companyId)->with('product');

        $stocks = $query
            ->paginate(20)
            ->withQueryString()
            ->through(fn (ProductStock $stock) => $stock->append('available'));

        return Inertia::render('inventory/stocks/index', [
            'stocks' => $stocks,
            'warehouses' => Warehouse::where('company_id', $companyId)->orderBy('name')->get(['id', 'name']),
            'filters' => $request->only(['search', 'status', 'warehouse_id']),
        ]);
    }

    /** Exporta o stock (CSV/XLSX) com os mesmos filtros do ecrã. */
    public function export(Request $request, StockExporter $exporter)
    {
        return $exporter->stocks($request, auth()->user()->company_id);
    }

    public function show(Product $product)
    {
        $product->load(['category', 'unit', 'brand']);

        $stocks = ProductStock::withReserved()
            ->withIncoming()
            ->with('warehouse')
            ->where('product_id', $product->id)
            ->get()
            ->each->append('available');

        // O que está a caminho: não está em nenhum armazém, mas ainda é da empresa
        $inTransit = DB::table('stock_transfer_items')
            ->join('stock_transfers', 'stock_transfers.id', '=', 'stock_transfer_items.stock_transfer_id')
            ->join('warehouses as origin', 'origin.id', '=', 'stock_transfers.from_warehouse_id')
            ->join('warehouses as destination', 'destination.id', '=', 'stock_transfers.to_warehouse_id')
            ->where('stock_transfers.company_id', $product->company_id)
            ->where('stock_transfers.status', 'in_transit')
            ->where('stock_transfer_items.product_id', $product->id)
            ->whereRaw('('.StockTransferItem::REMAINING_SQL.') > 0')
            ->orderBy('stock_transfers.shipped_at')
            ->get([
                'stock_transfers.id as transfer_id',
                'origin.name as from',
                'destination.name as to',
                'stock_transfers.shipped_at',
                DB::raw('('.StockTransferItem::REMAINING_SQL.') as remaining'),
            ])
            ->map(fn ($row) => [
                'transfer_id' => $row->transfer_id,
                'from' => $row->from,
                'to' => $row->to,
                'shipped_at' => $row->shipped_at,
                'quantity' => (float) $row->remaining,
            ]);

        $movements = StockMovement::with(['warehouse', 'user'])
            ->where('product_id', $product->id)
            ->latest()
            ->take(10)
            ->get();

        return Inertia::render('inventory/stocks/show', [
            'product' => $product,
            'stocks' => $stocks,
            'in_transit' => $inTransit,
            'movements' => $movements,
        ]);
    }
}
