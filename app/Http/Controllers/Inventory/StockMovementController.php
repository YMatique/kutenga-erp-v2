<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Inventory\StockMovement;
use Illuminate\Http\Request;
use Inertia\Inertia;

use App\Models\Inventory\Warehouse;

class StockMovementController extends Controller
{
    public function index(Request $request)
    {
        $companyId = auth()->user()->company_id;

        $query = StockMovement::with(['product', 'warehouse', 'user'])
            ->whereHas('product', fn($q) => $q->where('company_id', $companyId));

        if ($request->filled('search')) {
            $query->whereHas('product', function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('sku', 'like', "%{$request->search}%");
            });
        }

        if ($request->filled('type') && $request->type !== 'all') {
            $query->where('type', $request->type);
        }

        if ($request->filled('warehouse_id') && $request->warehouse_id !== 'all') {
            $query->where('warehouse_id', $request->warehouse_id);
        }

        $kpis = [
            'total' => (clone $query)->count(),
            'in' => (clone $query)->whereIn('type', ['in', 'opening'])->sum('quantity'),
            'out' => (clone $query)->where('type', 'out')->sum('quantity'),
        ];

        $movements = $query->latest()->paginate(20)->withQueryString();

        $warehouses = Warehouse::where('company_id', $companyId)->get(['id', 'name']);

        return Inertia::render('inventory/movements/index', [
            'movements' => $movements,
            'warehouses' => $warehouses,
            'filters' => $request->only(['search', 'type', 'warehouse_id']),
            'kpis' => $kpis
        ]);
    }
}
