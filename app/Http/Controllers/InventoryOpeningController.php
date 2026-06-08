<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Warehouse;
use App\Services\Inventory\StockService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InventoryOpeningController extends Controller
{
    //
      public function index()
    {
        $products = Product::with('category')
            ->where('track_stock', true)
            ->get();

        $warehouses = Warehouse::where('is_active', true)->get();
// C:\Users\LENOVO\Herd\kutenga-erp-v2\resources\js\pages\inventory\opening\index.tsx
        return Inertia::render('inventory/opening/index', [
            'products' => $products,
            'warehouses' => $warehouses,
        ]);
    }

    public function store(Request $request, StockService $stockService)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'warehouse_id' => 'required|exists:warehouses,id',
            'quantity' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $product = Product::findOrFail($request->product_id);
        $warehouse = Warehouse::findOrFail($request->warehouse_id);

        $stockService->opening(
            $product,
            $warehouse,
            $request->quantity,
            $request->notes
        );

        return back()->with('success', 'Stock inicial definido com sucesso');
    }
}
