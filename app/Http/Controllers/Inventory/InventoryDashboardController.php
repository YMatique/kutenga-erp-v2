<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Catalog\Product;
use App\Models\Inventory\StockMovement;
use App\Models\Inventory\Warehouse;
use App\Services\Inventory\StockExporter;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InventoryDashboardController extends Controller
{
    /** Relatório de inventário (CSV/XLSX): um produto por linha, com uma coluna por armazém. */
    public function export(Request $request, StockExporter $exporter)
    {
        $companyId = auth()->user()->company_id;
        $warehouses = Warehouse::where('company_id', $companyId)->orderBy('name')->get(['id', 'name']);

        return $exporter->summary($request, $companyId, $warehouses);
    }

    public function index()
    {
        $companyId = auth()->user()->company_id;

        $products = Product::query()
            ->where('company_id', $companyId)
            ->where('track_stock', true)
            ->with([
                'category',
                'stocks.warehouse',
            ])
            ->get();

        $warehouses = Warehouse::query()
            ->where('company_id', $companyId)
            ->get();

        $totalStock = $products->sum(function ($product) {
            return $product->stocks->sum('quantity');
        });

        $inventoryValue = $products->sum(function ($product) {
            $qty = $product->stocks->sum('quantity');

            return $qty * ($product->cost ?? 0);
        });

        $lowStockProducts = $products
            ->filter(function ($product) {

                if (! $product->track_stock) {
                    return false;
                }

                $stock = $product->stocks->sum('quantity');

                return $stock > 0
                    && $product->min_stock !== null
                    && $stock <= $product->min_stock;
            })
            ->values();

        $outOfStockProducts = $products
            ->filter(function ($product) {

                if (! $product->track_stock) {
                    return false;
                }

                return $product->stocks->sum('quantity') <= 0;
            })
            ->values();

        $warehouseSummary = $warehouses->map(function ($warehouse) {

            $stock = $warehouse->stockMovements()
                ->where('company_id', $warehouse->company_id)
                ->count();

            return [
                'id' => $warehouse->id,
                'name' => $warehouse->name,
                'is_default' => $warehouse->is_default,
                'products' => $warehouse
                    ->stocks()
                    ->count(),
                'quantity' => $warehouse
                    ->stocks()
                    ->sum('quantity'),
            ];
        });

        $recentMovements = StockMovement::query()
            ->with([
                'product' => fn ($q) => $q->withTrashed()->select('id', 'name'),
                'warehouse:id,name',
            ])
            ->where('company_id', $companyId)
            ->latest()
            ->limit(10)
            ->get();

        return Inertia::render(
            'inventory/dashboard/index',
            [
                'stats' => [
                    'products' => $products->count(),
                    'warehouses' => $warehouses->count(),
                    'total_stock' => $totalStock,
                    'inventory_value' => $inventoryValue,
                    'low_stock' => $lowStockProducts->count(),
                    'out_of_stock' => $outOfStockProducts->count(),
                ],

                'lowStockProducts' => $lowStockProducts,
                'outOfStockProducts' => $outOfStockProducts,
                'warehouseSummary' => $warehouseSummary,
                'recentMovements' => $recentMovements,
            ]
        );
    }
}
