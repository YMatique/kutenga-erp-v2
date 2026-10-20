<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Catalog\Product;
use App\Models\Inventory\ProductStock;
use App\Models\Inventory\StockMovement;
use App\Models\Inventory\Warehouse;
use App\Services\Inventory\StockExporter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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

    /** Quantos produtos mostrar na tabela de atenção; o resto fica a um clique, na lista de stock. */
    private const ATTENTION_LIMIT = 8;

    public function index()
    {
        $companyId = auth()->user()->company_id;

        // Saldo total de cada produto (todos os armazéns), somado na base de dados
        $totals = DB::table('product_stocks')
            ->where('company_id', $companyId)
            ->groupBy('product_id')
            ->selectRaw('product_id, SUM(quantity) as total');

        $tracked = fn () => Product::query()
            ->where('products.company_id', $companyId)
            ->where('products.track_stock', true)
            ->leftJoinSub($totals, 'totals', 'totals.product_id', '=', 'products.id');

        $total = 'COALESCE(totals.total, 0)';
        $outOfStock = "{$total} <= 0";
        $lowStock = "{$total} > 0 AND products.min_stock IS NOT NULL AND {$total} <= products.min_stock";

        $outOfStockCount = $tracked()->whereRaw($outOfStock)->count();
        $lowStockCount = $tracked()->whereRaw($lowStock)->count();

        // Os mais urgentes: esgotados primeiro e depois os mais abaixo do mínimo
        $attentionProducts = $tracked()
            ->with(['category:id,name', 'unit:id,short_name'])
            ->select('products.*')
            ->selectRaw("{$total} as total_stock")
            ->where(fn ($q) => $q->whereRaw($outOfStock)->orWhereRaw($lowStock))
            ->orderByRaw("CASE WHEN {$total} <= 0 THEN 0 ELSE 1 END")
            ->orderByRaw("({$total} * 1.0) / NULLIF(products.min_stock, 0)")
            ->orderBy('products.name')
            ->limit(self::ATTENTION_LIMIT)
            ->get()
            ->map(fn (Product $product) => [
                'id' => $product->id,
                'name' => $product->name,
                'category' => $product->category?->name,
                'unit' => $product->unit?->short_name,
                'total_stock' => (float) $product->total_stock,
                'min_stock' => (float) $product->min_stock,
                'status' => (float) $product->total_stock <= 0 ? 'out_of_stock' : 'low',
            ]);

        // Stock e valor (custo × quantidade) dos produtos com controlo de stock
        $stocked = fn () => ProductStock::query()
            ->join('products', 'products.id', '=', 'product_stocks.product_id')
            ->where('product_stocks.company_id', $companyId)
            ->where('products.track_stock', true)
            ->whereNull('products.deleted_at');

        $figures = $stocked()
            ->selectRaw('COALESCE(SUM(product_stocks.quantity), 0) as quantity, COALESCE(SUM(product_stocks.quantity * COALESCE(products.cost, 0)), 0) as value')
            ->first();

        $perWarehouse = $stocked()
            ->groupBy('product_stocks.warehouse_id')
            ->selectRaw('product_stocks.warehouse_id, SUM(CASE WHEN product_stocks.quantity > 0 THEN 1 ELSE 0 END) as products, SUM(product_stocks.quantity * COALESCE(products.cost, 0)) as value')
            ->get()
            ->keyBy('warehouse_id');

        $inventoryValue = (float) $figures->value;

        // Só armazéns ativos; somar unidades de produtos diferentes (kg, peças…) não diz nada, por isso mostra-se o valor
        $warehouseSummary = Warehouse::query()
            ->where('company_id', $companyId)
            ->where('is_active', true)
            ->orderByDesc('is_default')
            ->orderBy('name')
            ->get(['id', 'name', 'is_default'])
            ->map(function (Warehouse $warehouse) use ($perWarehouse, $inventoryValue) {
                $row = $perWarehouse->get($warehouse->id);
                $value = (float) ($row->value ?? 0);

                return [
                    'id' => $warehouse->id,
                    'name' => $warehouse->name,
                    'is_default' => $warehouse->is_default,
                    'products' => (int) ($row->products ?? 0),
                    'value' => $value,
                    'share' => $inventoryValue > 0 ? round($value / $inventoryValue * 100, 1) : 0,
                ];
            })
            ->values();

        $recentMovements = StockMovement::query()
            ->with([
                'product' => fn ($q) => $q->withTrashed()->select('id', 'name'),
                'warehouse:id,name',
                'user:id,name',
            ])
            ->where('company_id', $companyId)
            ->latest()
            ->limit(10)
            ->get();

        return Inertia::render('inventory/dashboard/index', [
            'stats' => [
                'products' => $tracked()->count(),
                'warehouses' => $warehouseSummary->count(),
                'total_stock' => (float) $figures->quantity,
                'inventory_value' => $inventoryValue,
                'low_stock' => $lowStockCount,
                'out_of_stock' => $outOfStockCount,
            ],
            'attentionProducts' => $attentionProducts,
            'warehouseSummary' => $warehouseSummary,
            'recentMovements' => $recentMovements,
        ]);
    }
}
