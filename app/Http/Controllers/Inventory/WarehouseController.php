<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;

use App\Models\Inventory\Warehouse;
use App\Models\Inventory\ProductStock;
use App\Models\Inventory\StockMovement;
use Illuminate\Http\Request;
use Inertia\Inertia;

class WarehouseController extends Controller
{
    public function index()
    {
        return Inertia::render('inventory/warehouses/index', [
            'warehouses' => Warehouse::withCount('stocks as products_count')
                ->withSum('stocks as total_quantity', 'quantity')
                ->latest()
                ->get()
                ->map(function ($w) {
                    $w->total_quantity = (float) ($w->total_quantity ?? 0);
                    return $w;
                }),
        ]);
    }

    public function show(Warehouse $warehouse)
    {
        $stocks = ProductStock::with(['product.category', 'product.brand', 'product.unit'])
            ->where('warehouse_id', $warehouse->id)
            ->get();

        $movements = StockMovement::with(['product', 'user'])
            ->where('warehouse_id', $warehouse->id)
            ->latest()
            ->take(10)
            ->get();

        return Inertia::render('inventory/warehouses/show', [
            'warehouse' => $warehouse,
            'stocks' => $stocks,
            'movements' => $movements,
        ]);
    }

    public function create()
    {
        return Inertia::render('inventory/warehouses/create');
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'description' => 'nullable|string',
            'is_default' => 'boolean',
            'is_active' => 'boolean',
        ]);

        Warehouse::create([
            'company_id' => auth()->user()->company_id,
            'name' => $request->name,
            'code' => $request->code,
            'address' => $request->address,
            'description' => $request->description,
            'is_default' => $request->is_default ?? false,
            'is_active' => $request->is_active ?? true,
        ]);

        return redirect()->route('warehouses.index')
            ->with('success', 'Armazém criado com sucesso!');
    }

    public function edit(Warehouse $warehouse)
    {
        return Inertia::render('inventory/warehouses/edit', [
            'warehouse' => $warehouse,
        ]);
    }

    public function update(Request $request, Warehouse $warehouse)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'description' => 'nullable|string',
            'is_default' => 'boolean',
            'is_active' => 'boolean',
        ]);

        $warehouse->update($request->all());

        return redirect()->route('warehouses.index')
            ->with('success', 'Armazém atualizado!');
    }

    public function destroy(Warehouse $warehouse)
    {
        $warehouse->delete();

        return back()->with('success', 'Armazém removido!');
    }
}
