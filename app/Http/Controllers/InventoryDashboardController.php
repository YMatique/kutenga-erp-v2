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
     public function index(StockService $stockService)
    {
        $companyId = auth()->user()->company_id;

        $products = Product::where('company_id', $companyId)
            ->with(['category'])
            ->get();

        $warehouses = Warehouse::where('company_id', $companyId)->get();

        // produtos com stock baixo
        $lowStock = $products->filter(function ($product) use ($warehouses, $stockService) {

            foreach ($warehouses as $warehouse) {

                if (!$product->track_stock) {
                    continue;
                }

                $stock = $stockService->getStock($product, $warehouse);

                if ($product->min_stock !== null && $stock <= $product->min_stock) {
                    return true;
                }
            }

            return false;
        });

        // sem stock
        $outOfStock = $products->filter(function ($product) use ($warehouses, $stockService) {

            foreach ($warehouses as $warehouse) {

                if (!$product->track_stock) {
                    continue;
                }

                if ($stockService->getStock($product, $warehouse) > 0) {
                    return false;
                }
            }

            return true;
        });

        // movimentos recentes
        $recentMovements = StockMovement::with(['product', 'warehouse'])
            ->where('company_id', $companyId)
            ->latest()
            ->limit(10)
            ->get();

        return Inertia::render('inventory/dashboard/index', [
            'stats' => [
                'total_products' => $products->count(),
                'low_stock' => $lowStock->count(),
                'out_of_stock' => $outOfStock->count(),
                'total_warehouses' => $warehouses->count(),
            ],
            'lowStockProducts' => $lowStock->values(),
            'outOfStockProducts' => $outOfStock->values(),
            'recentMovements' => $recentMovements,
        ]);
    }
}
