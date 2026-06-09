<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\Warehouse;
use App\Services\Inventory\StockService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InventoryDashboardController extends Controller
{
    //  public function index(StockService $stockService)
    // {
    //     $companyId = auth()->user()->company_id;

    //     $products = Product::where('company_id', $companyId)
    //         ->with(['category'])
    //         ->get();

    //     $warehouses = Warehouse::where('company_id', $companyId)->get();

    //     // produtos com stock baixo
    //     $lowStock = $products->filter(function ($product) use ($warehouses, $stockService) {

    //         foreach ($warehouses as $warehouse) {

    //             if (!$product->track_stock) {
    //                 continue;
    //             }

    //             $stock = $stockService->getStock($product, $warehouse);

    //             if ($product->min_stock !== null && $stock <= $product->min_stock) {
    //                 return true;
    //             }
    //         }

    //         return false;
    //     });

    //     // sem stock
    //     $outOfStock = $products->filter(function ($product) use ($warehouses, $stockService) {

    //         foreach ($warehouses as $warehouse) {

    //             if (!$product->track_stock) {
    //                 continue;
    //             }

    //             if ($stockService->getStock($product, $warehouse) > 0) {
    //                 return false;
    //             }
    //         }

    //         return true;
    //     });

    //     // movimentos recentes
    //     $recentMovements = StockMovement::with(['product', 'warehouse'])
    //         ->where('company_id', $companyId)
    //         ->latest()
    //         ->limit(10)
    //         ->get();

    //     return Inertia::render('inventory/dashboard/index', [
    //         'stats' => [
    //             'total_products' => $products->count(),
    //             'low_stock' => $lowStock->count(),
    //             'out_of_stock' => $outOfStock->count(),
    //             'total_warehouses' => $warehouses->count(),
    //         ],
    //         'lowStockProducts' => $lowStock->values(),
    //         'outOfStockProducts' => $outOfStock->values(),
    //         'recentMovements' => $recentMovements,
    //     ]);
    // }

    public function index()
{
    $companyId = auth()->user()->company_id;

    $products = Product::query()
        ->where('company_id', $companyId)
        ->with([
            'category',
            'stocks.warehouse'
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

            if (!$product->track_stock) {
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

            if (!$product->track_stock) {
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
            'product:id,name',
            'warehouse:id,name'
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
