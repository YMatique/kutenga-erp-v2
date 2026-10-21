<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Catalog\Product;
use App\Models\Inventory\Warehouse;
use App\Services\Inventory\StockService;
use App\Support\Tenant;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InventoryOpeningController extends Controller
{
    //
    public function index()
    {
        // Os produtos não vêm aqui: o formulário pesquisa-os no servidor, à medida que se escreve
        return Inertia::render('inventory/opening/index', [
            'warehouses' => Warehouse::where('is_active', true)->get(),
        ]);
    }

    public function store(Request $request, StockService $stockService)
    {
        $request->validate([
            'product_id' => ['required', Tenant::exists('products')->where('track_stock', true)->whereNull('deleted_at')],
            'warehouse_id' => ['required', Tenant::exists('warehouses')->where('is_active', true)->whereNull('deleted_at')],
            'quantity' => 'required|numeric|gt:0',
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
