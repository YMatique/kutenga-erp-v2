<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductStock;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProductStockController extends Controller
{
     public function index()
    {
        $stocks = ProductStock::with(['product', 'warehouse'])
            ->where('company_id', auth()->user()->company_id)
            ->get();

        return Inertia::render('inventory/stocks/index', [
            'stocks' => $stocks
        ]);
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
