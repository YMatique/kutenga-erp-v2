<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Catalog\Product;
use App\Models\Inventory\ProductStock;
use App\Models\Inventory\StockMovement;
use App\Models\Inventory\Warehouse;
use App\Services\Inventory\StockExporter;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProductStockController extends Controller
{
    public function index(Request $request)
    {
        $companyId = auth()->user()->company_id;

        $query = StockExporter::filteredStocks($request, $companyId)->with('product');

        $stocks = $query
            ->paginate(20)
            ->withQueryString();

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

        $stocks = ProductStock::with('warehouse')
            ->where('product_id', $product->id)
            ->get();

        $movements = StockMovement::with(['warehouse', 'user'])
            ->where('product_id', $product->id)
            ->latest()
            ->take(10)
            ->get();

        return Inertia::render('inventory/stocks/show', [
            'product' => $product,
            'stocks' => $stocks,
            'movements' => $movements,
        ]);
    }
}
