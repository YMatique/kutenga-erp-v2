<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Catalog\Product;
use App\Models\Inventory\InventoryClosing;
use App\Models\Inventory\ProductStock;
use App\Models\Inventory\StockAdjustment;
use App\Models\Inventory\StockMovement;
use App\Models\Inventory\StockTransfer;
use App\Models\Inventory\Warehouse;
use App\Services\Inventory\StockAlerts;
use App\Services\Inventory\StockExporter;
use App\Support\BusinessTime;
use Carbon\CarbonImmutable;
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

    /** Dias do gráfico de atividade (hoje incluído). */
    private const ACTIVITY_DAYS = 30;

    public function index(Request $request)
    {
        $companyId = auth()->user()->company_id;

        // Filtro por armazém: um id que não é desta empresa ignora-se (mostra tudo), não dá erro
        $selected = $request->filled('warehouse_id')
            ? Warehouse::where('company_id', $companyId)->find($request->integer('warehouse_id'))
            : null;
        $warehouseId = $selected?->id;

        // Saldo de cada produto (de todos os armazéns, ou do selecionado), somado na base de dados;
        // a mesma definição de alerta que o dashboard principal usa
        $tracked = fn () => StockAlerts::tracked($companyId, $warehouseId);

        $total = StockAlerts::TOTAL;
        $outOfStock = StockAlerts::OUT_OF_STOCK;
        $lowStock = StockAlerts::LOW_STOCK;

        $alerts = StockAlerts::counts($companyId, $warehouseId);
        $outOfStockCount = $alerts['out'];
        $lowStockCount = $alerts['low'];

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
            ->when($warehouseId, fn ($q) => $q->where('product_stocks.warehouse_id', $warehouseId))
            ->selectRaw('COALESCE(SUM(product_stocks.quantity), 0) as quantity, COALESCE(SUM(product_stocks.quantity * COALESCE(products.cost, 0)), 0) as value')
            ->first();

        $perWarehouse = $stocked()
            ->groupBy('product_stocks.warehouse_id')
            ->selectRaw('product_stocks.warehouse_id, SUM(CASE WHEN product_stocks.quantity > 0 THEN 1 ELSE 0 END) as products, SUM(product_stocks.quantity * COALESCE(products.cost, 0)) as value')
            ->get()
            ->keyBy('warehouse_id');

        // O peso de cada armazém é sobre o valor de todos, mesmo com um armazém selecionado
        $inventoryValue = (float) $perWarehouse->sum('value');

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
            ->when($warehouseId, fn ($q) => $q->where('warehouse_id', $warehouseId))
            ->latest()
            ->limit(10)
            ->get();

        $user = auth()->user();

        // O que vai a caminho não está em nenhum armazém e por isso fica fora do valor do inventário:
        // mostra-se à parte (ao custo atual), com as transferências que saem ou chegam ao armazém filtrado
        $inTransitValue = (float) DB::table('stock_transfer_items')
            ->join('stock_transfers', 'stock_transfers.id', '=', 'stock_transfer_items.stock_transfer_id')
            ->join('products', 'products.id', '=', 'stock_transfer_items.product_id')
            ->where('stock_transfers.company_id', $companyId)
            ->where('stock_transfers.status', 'in_transit')
            ->when($warehouseId, fn ($q) => $q->where(fn ($q) => $q->where('stock_transfers.from_warehouse_id', $warehouseId)->orWhere('stock_transfers.to_warehouse_id', $warehouseId)))
            ->sum(DB::raw('stock_transfer_items.quantity * COALESCE(products.cost, 0)'));

        // O trabalho por tratar também se filtra: transferências que saem ou chegam ao armazém,
        // ajustes dele e fechos dele ou de todos os armazéns
        $transfers = fn (string $status) => StockTransfer::where('company_id', $companyId)->where('status', $status)
            ->when($warehouseId, fn ($q) => $q->where(fn ($q) => $q->where('from_warehouse_id', $warehouseId)->orWhere('to_warehouse_id', $warehouseId)));

        return Inertia::render('inventory/dashboard/index', [
            'stats' => [
                'products' => $tracked()->count(),
                'warehouses' => $warehouseSummary->count(),
                'total_stock' => (float) $figures->quantity,
                'inventory_value' => (float) $figures->value,
                'in_transit_value' => round($inTransitValue, 2),
                'low_stock' => $lowStockCount,
                'out_of_stock' => $outOfStockCount,
            ],
            'attentionProducts' => $attentionProducts,
            'warehouseSummary' => $warehouseSummary,
            'recentMovements' => $recentMovements,
            'queue' => [
                'transfers_pending' => $transfers('pending')->count(),
                'transfers_approved' => $transfers('approved')->count(),
                'transfers_in_transit' => $transfers('in_transit')->count(),
                'adjustments_draft' => StockAdjustment::where('company_id', $companyId)->where('status', 'draft')
                    ->when($warehouseId, fn ($q) => $q->where('warehouse_id', $warehouseId))->count(),
                'closings_open' => InventoryClosing::where('company_id', $companyId)->where('status', 'draft')
                    ->when($warehouseId, fn ($q) => $q->where(fn ($q) => $q->where('warehouse_id', $warehouseId)->orWhereNull('warehouse_id')))->count(),
            ],
            'activity' => $this->activity($companyId, $warehouseId),
            'filters' => ['warehouse_id' => $warehouseId, 'warehouse_name' => $selected?->name],
            // Só as ações que o utilizador pode mesmo fazer (as outras dariam 403)
            'can' => [
                'adjust' => $user->can('inventory.adjust'),
                'transfer' => $user->can('inventory.transfer'),
                'catalog' => $user->can('catalog.edit'),
            ],
        ]);
    }

    /**
     * Valor das entradas e saídas de cada um dos últimos dias, ao custo atual dos produtos
     * (os movimentos não guardam o custo). O stock inicial fica de fora: é carga de dados,
     * não atividade. Os ajustes contam como entrada ou saída conforme o sinal.
     *
     * @return array<int, array{date: string, entries: float, exits: float, movements: int}>
     */
    private function activity(int $companyId, ?int $warehouseId = null): array
    {
        // Os dias contam-se no fuso do negócio, mas os instantes estão gravados em UTC: um movimento
        // das 23:30 UTC é já do dia seguinte em Maputo. A janela começa à meia-noite local (em UTC)
        // e cada movimento passa ao dia certo conforme a hora a que foi gravado.
        $first = BusinessTime::today()->subDays(self::ACTIVITY_DAYS - 1);
        $offset = BusinessTime::now()->utcOffset(); // minutos em relação a UTC (Maputo: +120)

        $time = 'TIME(stock_movements.created_at)';
        [$shift, $direction] = match (true) {
            $offset > 0 => ["CASE WHEN {$time} >= '".$this->clock(1440 - $offset)."' THEN 1 ELSE 0 END", 1],
            $offset < 0 => ["CASE WHEN {$time} < '".$this->clock(-$offset)."' THEN 1 ELSE 0 END", -1],
            default => ['0', 0],
        };

        $entry = "stock_movements.type = 'in' OR (stock_movements.type = 'adjustment' AND stock_movements.quantity > 0)";
        $exit = "stock_movements.type = 'out' OR (stock_movements.type = 'adjustment' AND stock_movements.quantity < 0)";
        $value = 'ABS(stock_movements.quantity) * COALESCE(products.cost, 0)';

        $perDay = StockMovement::query()
            ->join('products', 'products.id', '=', 'stock_movements.product_id')
            ->where('stock_movements.company_id', $companyId)
            ->where('stock_movements.type', '!=', 'opening')
            ->when($warehouseId, fn ($q) => $q->where('stock_movements.warehouse_id', $warehouseId))
            ->where('stock_movements.created_at', '>=', $first->utc()->toDateTimeString())
            ->groupByRaw("DATE(stock_movements.created_at), {$shift}")
            ->selectRaw("DATE(stock_movements.created_at) as day, {$shift} as shifted, SUM(CASE WHEN {$entry} THEN {$value} ELSE 0 END) as entries, SUM(CASE WHEN {$exit} THEN {$value} ELSE 0 END) as exits, COUNT(*) as movements")
            ->get();

        // Passa cada grupo ao seu dia de negócio e soma os que caíram no mesmo
        $byDay = [];
        foreach ($perDay as $row) {
            $day = CarbonImmutable::parse($row->day)->addDays($row->shifted * $direction)->toDateString();
            $byDay[$day] ??= ['entries' => 0.0, 'exits' => 0.0, 'movements' => 0];
            $byDay[$day]['entries'] += (float) $row->entries;
            $byDay[$day]['exits'] += (float) $row->exits;
            $byDay[$day]['movements'] += (int) $row->movements;
        }

        // Todos os dias aparecem, mesmo os sem movimentos, para o eixo ser contínuo
        return collect(range(0, self::ACTIVITY_DAYS - 1))
            ->map(function (int $ago) use ($first, $byDay) {
                $date = $first->addDays($ago)->toDateString();
                $row = $byDay[$date] ?? null;

                return [
                    'date' => $date,
                    'entries' => round($row['entries'] ?? 0, 2),
                    'exits' => round($row['exits'] ?? 0, 2),
                    'movements' => $row['movements'] ?? 0,
                ];
            })
            ->all();
    }

    /** Minutos desde a meia-noite como "HH:MM:SS", para comparar com TIME(). */
    private function clock(int $minutes): string
    {
        return sprintf('%02d:%02d:00', intdiv($minutes, 60), $minutes % 60);
    }
}
