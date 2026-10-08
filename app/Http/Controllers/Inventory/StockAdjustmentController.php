<?php

namespace App\Http\Controllers\Inventory;

use App\Support\Tenant;

use App\Http\Controllers\Controller;

use App\Models\Catalog\Product;
use App\Models\Inventory\StockAdjustment;
use App\Models\Inventory\Warehouse;
use App\Services\Inventory\StockAdjustmentService;
use App\Services\Inventory\StockService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class StockAdjustmentController extends Controller
{
    public function index(Request $request)
    {
        $query = StockAdjustment::query()
            ->with('warehouse')
            ->withCount('items')
            ->where('company_id', Auth::user()->company_id);

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $adjustments = $query
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('inventory/adjustments/index', [
            'adjustments' => $adjustments,
            'filters' => [
                'status' => $request->status,
            ],
        ]);
    }

    public function create()
    {
        $companyId = auth()->user()->company_id;

        return Inertia::render('inventory/adjustments/create', [
            'warehouses' => Warehouse::where(
                'company_id',
                $companyId
            )->get(),

            'products' => Product::where(
                'company_id',
                $companyId
            )
                ->where('track_stock', true)
                ->orderBy('name')
                ->get([
                    'id',
                    'name',
                    'sku',
                    'barcode',
                ]),
        ]);
    }

    public function store(Request $request, StockService $stockService)
    {
        $data = $request->validate([
            'warehouse_id' => ['required', Tenant::exists('warehouses')],
            'reason' => ['required', 'string'],
            'notes' => ['nullable', 'string'],

            'items' => ['required', 'array', 'min:1'],

            'items.*.product_id' => [
                'required',
                Tenant::exists('products'),
            ],

            'items.*.new_quantity' => [
                'required',
                'numeric',
                'min:0',
            ],
        ]);

        $warehouse = Warehouse::findOrFail(
            $data['warehouse_id']
        );

        $adjustment = StockAdjustment::create([
            'company_id' => Auth::user()->company_id,
            'warehouse_id' => $warehouse->id,
            'reason' => $data['reason'],
            'notes' => $data['notes'] ?? null,
            'status' => 'draft',
            'created_by' => Auth::id(),
        ]);

        foreach ($data['items'] as $item) {

            $product = Product::findOrFail(
                $item['product_id']
            );

            $oldQuantity = $stockService->getStock(
                $product,
                $warehouse
            );

            $newQuantity = (float) $item['new_quantity'];

            $adjustment->items()->create([
                'product_id' => $product->id,
                'old_quantity' => $oldQuantity,
                'new_quantity' => $newQuantity,
                'difference' => $newQuantity - $oldQuantity,
            ]);
        }

        return redirect()
            ->route(
                'inventory.adjustments.show',
                $adjustment
            )
            ->with(
                'success',
                'Ajuste criado com sucesso.'
            );
    }

    public function show(StockAdjustment $adjustment)
    {
        $adjustment->load([
            'warehouse',
            'items.product',
            'creator',
            'completer',
            'canceller',
        ]);

        return Inertia::render(
            'inventory/adjustments/show',
            [
                'adjustment' => $adjustment,
            ]
        );
    }

    public function complete(
        StockAdjustment $adjustment,
        StockAdjustmentService $service
    ) {
        try {
            $service->complete($adjustment);
        } catch (ValidationException $e) {
            return back()->with('error', collect($e->errors())->flatten()->first());
        }

        return back()->with(
            'success',
            'Ajuste concluído.'
        );
    }

    public function cancel(
        StockAdjustment $adjustment,
        StockAdjustmentService $service
    ) {
        try {
            $service->cancel($adjustment);
        } catch (ValidationException $e) {
            return back()->with('error', collect($e->errors())->flatten()->first());
        }

        return back()->with(
            'success',
            'Ajuste cancelado.'
        );
    }
}
