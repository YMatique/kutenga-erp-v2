<?php

namespace App\Http\Controllers;

use App\Models\Billing\Document;
use App\Models\Inventory\StockMovement;
use App\Services\Inventory\StockAlerts;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    /**
     * Estados de um documento já emitido (rascunhos e cancelados não contam). `overdue` é o estado
     * em que o comando diário põe as faturas vencidas: continuam emitidas e por receber.
     */
    private const ISSUED = ['confirmed', 'partial', 'paid', 'overdue'];

    /** Meses do gráfico, o corrente incluído. */
    private const CHART_MONTHS = 6;

    /** Primeira área acessível ao utilizador, por ordem de relevância para quem não vê o dashboard. */
    private function landingPageFor($user): string
    {
        $areas = [
            'sales.create' => '/pos',
            'invoice.view' => '/billing/invoices',
            'sales.view' => '/billing/quotes',
            'inventory.view' => '/inventory',
            'catalog.view' => '/products',
        ];

        foreach ($areas as $permission => $url) {
            // O POS depende do plano: mandar para lá quem não o tem faria um ciclo com o dashboard
            if ($url === '/pos' && ! $user->company?->can('pos')) {
                continue;
            }

            if ($user->can($permission)) {
                return $url;
            }
        }

        return '/settings/profile';
    }

    public function index(Request $request)
    {
        // O Dashboard geral mostra indicadores da empresa inteira (permissão reports.view).
        // É a página inicial de toda a gente, por isso quem não a tem não leva um 403: segue
        // para a primeira área a que tem acesso.
        if (! $request->user()->can('reports.view')) {
            return redirect($this->landingPageFor($request->user()));
        }

        $user = $request->user();
        $companyId = $user->company_id;

        // "Hoje" e o mês a que cada documento pertence contam-se no fuso do negócio (a aplicação
        // guarda os instantes em UTC) e pela data de emissão, não pela de criação do registo.
        $today = now(config('app.business_timezone'))->startOfDay();
        $monthStart = $today->startOfMonth();

        $billed = $this->billed($companyId, $today, $monthStart);
        $open = $this->openInvoices($companyId, $today);
        $alerts = StockAlerts::counts($companyId);

        return Inertia::render('dashboard', [
            'metrics' => [
                'billed_month' => $billed['month'],
                'received_month' => $this->received($companyId, $today, $monthStart),
                'receivables' => $open['receivables'],
                'overdue' => $open['overdue'],
                'stock_alerts' => $alerts['low'] + $alerts['out'],
            ],
            'chart_data' => $billed['chart'],
            'top_customers' => $this->topCustomers($companyId, $today, $monthStart),
            'top_products' => $this->topProducts($companyId, $today, $monthStart),
            'recent_sales' => $this->recentSales($companyId, $today),
            'recent_activity' => $this->recentActivity($companyId),
            // Só o que o utilizador pode abrir: nenhuma ligação ou ação deve acabar num 403
            'can' => [
                'create_invoice' => $user->can('invoice.create'),
                'view_invoices' => $user->can('invoice.view'),
                'pos' => $user->can('sales.create') && (bool) $user->company?->can('pos'),
                'create_customer' => $user->can('sales.create'),
                'catalog' => $user->can('catalog.edit'),
                'inventory' => $user->can('inventory.view'),
            ],
        ]);
    }

    /**
     * Faturado líquido (faturas e faturas-recibo menos notas de crédito) por dia de emissão nos
     * últimos meses, e a partir daí o mês corrente, a sua variação face ao mesmo período do mês
     * anterior e a série mensal do gráfico. Os dias vêm da base de dados; o resto soma-se aqui.
     *
     * @return array{month: array<string, mixed>, chart: array<int, array<string, mixed>>}
     */
    private function billed(int $companyId, CarbonImmutable $today, CarbonImmutable $monthStart): array
    {
        $first = $monthStart->subMonthsNoOverflow(self::CHART_MONTHS - 1);

        $daily = $this->issuedDocuments($companyId, ['FT', 'FR', 'NC'], $first, $today)
            ->groupBy('issue_date')
            ->selectRaw("issue_date as day, SUM(CASE WHEN document_type = 'NC' THEN -grand_total ELSE grand_total END) as total")
            ->get()
            ->map(fn ($row) => ['day' => substr((string) $row->day, 0, 10), 'total' => (float) $row->total]);

        $sum = fn (CarbonImmutable $from, CarbonImmutable $to) => round(
            $daily->filter(fn ($d) => $d['day'] >= $from->toDateString() && $d['day'] <= $to->toDateString())->sum('total'),
            2
        );

        $chart = collect(range(self::CHART_MONTHS - 1, 0))->map(function (int $ago) use ($monthStart, $sum) {
            $start = $monthStart->subMonthsNoOverflow($ago);

            return [
                'month' => $start->format('Y-m'),
                'value' => $sum($start, $start->endOfMonth()->startOfDay()),
                'current' => $ago === 0,
            ];
        })->values()->all();

        // Compara com os mesmos dias do mês anterior (não com o mês inteiro, que já acabou)
        $previousStart = $monthStart->subMonthNoOverflow();
        $previousEnd = $previousStart->addDays($today->day - 1)->min($previousStart->endOfMonth()->startOfDay());

        $current = $sum($monthStart, $today);
        $previous = $sum($previousStart, $previousEnd);

        return [
            'month' => [
                'value' => $current,
                'previous' => $previous,
                'change' => $previous > 0 ? round(($current - $previous) / $previous * 100, 1) : null,
            ],
            'chart' => $chart,
        ];
    }

    /**
     * Pagamentos registados no mês corrente.
     *
     * @return array{value: float, payments: int}
     */
    private function received(int $companyId, CarbonImmutable $today, CarbonImmutable $monthStart): array
    {
        $row = DB::table('payments')
            ->where('company_id', $companyId)
            ->where('payment_date', '>=', $monthStart->toDateString())
            ->where('payment_date', '<', $today->addDay()->toDateString())
            ->selectRaw('COALESCE(SUM(amount), 0) as total, COUNT(*) as payments')
            ->first();

        return ['value' => round((float) $row->total, 2), 'payments' => (int) $row->payments];
    }

    /**
     * Faturas por liquidar. Em dívida = total − pagamentos alocados − notas de crédito emitidas
     * sobre a fatura (o total de uma fatura parcialmente paga não é o que falta receber).
     * Vencida = em dívida e com data de vencimento anterior a hoje.
     *
     * @return array{receivables: array{value: float, invoices: int}, overdue: array{value: float, invoices: int}}
     */
    private function openInvoices(int $companyId, CarbonImmutable $today): array
    {
        $allocated = DB::table('payment_allocations')
            ->groupBy('document_id')
            ->selectRaw('document_id, SUM(amount_allocated) as allocated');

        $credited = DB::table('documents')
            ->where('document_type', 'NC')
            ->whereIn('status', self::ISSUED)
            ->whereNull('deleted_at')
            ->whereNotNull('referenced_document_id')
            ->groupBy('referenced_document_id')
            ->selectRaw('referenced_document_id as document_id, SUM(grand_total) as credited');

        $open = Document::query()
            ->where('documents.company_id', $companyId)
            ->where('documents.document_type', 'FT')
            ->whereIn('documents.status', ['confirmed', 'partial', 'overdue'])
            ->whereIn('documents.payment_status', ['unpaid', 'partial'])
            ->leftJoinSub($allocated, 'alloc', 'alloc.document_id', '=', 'documents.id')
            ->leftJoinSub($credited, 'cred', 'cred.document_id', '=', 'documents.id')
            ->selectRaw('documents.due_date, documents.grand_total - COALESCE(alloc.allocated, 0) - COALESCE(cred.credited, 0) as outstanding')
            ->toBase();

        $row = DB::query()
            ->fromSub($open, 'o')
            ->selectRaw('COALESCE(SUM(CASE WHEN o.outstanding > 0 THEN o.outstanding ELSE 0 END), 0) as receivables')
            ->selectRaw('COALESCE(SUM(CASE WHEN o.outstanding > 0 THEN 1 ELSE 0 END), 0) as receivables_invoices')
            ->selectRaw('COALESCE(SUM(CASE WHEN o.outstanding > 0 AND o.due_date < ? THEN o.outstanding ELSE 0 END), 0) as overdue', [$today->toDateString()])
            ->selectRaw('COALESCE(SUM(CASE WHEN o.outstanding > 0 AND o.due_date < ? THEN 1 ELSE 0 END), 0) as overdue_invoices', [$today->toDateString()])
            ->first();

        return [
            'receivables' => ['value' => round((float) $row->receivables, 2), 'invoices' => (int) $row->receivables_invoices],
            'overdue' => ['value' => round((float) $row->overdue, 2), 'invoices' => (int) $row->overdue_invoices],
        ];
    }

    /** Clientes que mais compraram no mês, em faturado líquido (com IVA). */
    private function topCustomers(int $companyId, CarbonImmutable $today, CarbonImmutable $monthStart): array
    {
        return $this->issuedDocuments($companyId, ['FT', 'FR', 'NC'], $monthStart, $today)
            ->groupBy('customer_id')
            ->selectRaw("MAX(customer_name) as name, SUM(CASE WHEN document_type = 'NC' THEN -grand_total ELSE grand_total END) as total")
            ->orderByDesc('total')
            ->limit(5)
            ->get()
            ->filter(fn ($row) => (float) $row->total > 0)
            ->map(fn ($row) => ['name' => $row->name, 'value' => round((float) $row->total, 2)])
            ->values()
            ->all();
    }

    /** Produtos e serviços que mais faturaram no mês, em faturado líquido (com IVA). */
    private function topProducts(int $companyId, CarbonImmutable $today, CarbonImmutable $monthStart): array
    {
        return DB::table('document_items')
            ->join('documents', 'documents.id', '=', 'document_items.document_id')
            ->where('documents.company_id', $companyId)
            ->whereNull('documents.deleted_at')
            ->whereIn('documents.document_type', ['FT', 'FR', 'NC'])
            ->whereIn('documents.status', self::ISSUED)
            ->where('documents.issue_date', '>=', $monthStart->toDateString())
            ->where('documents.issue_date', '<', $today->addDay()->toDateString())
            ->groupBy('document_items.product_name')
            ->selectRaw("document_items.product_name as name, SUM(CASE WHEN documents.document_type = 'NC' THEN -document_items.total ELSE document_items.total END) as total")
            ->orderByDesc('total')
            ->limit(5)
            ->get()
            ->filter(fn ($row) => (float) $row->total > 0)
            ->map(fn ($row) => ['name' => $row->name, 'value' => round((float) $row->total, 2)])
            ->values()
            ->all();
    }

    private function recentSales(int $companyId, CarbonImmutable $today)
    {
        return Document::where('company_id', $companyId)
            ->whereIn('document_type', ['FT', 'FR'])
            ->whereIn('status', self::ISSUED)
            ->orderByDesc('issue_date')
            ->orderByDesc('id')
            ->limit(5)
            ->get()
            ->map(fn (Document $doc) => [
                'id' => $doc->id,
                'document_number' => $doc->document_number,
                'url' => $doc->showUrl(),
                'customer_name' => $doc->customer_name,
                'grand_total' => (float) $doc->grand_total,
                'issue_date' => $doc->issue_date->toDateString(),
                'state' => $this->paymentState($doc, $today),
            ]);
    }

    /** Estado de cobrança de um documento emitido: paga, parcial, por pagar ou vencida. */
    private function paymentState(Document $doc, CarbonImmutable $today): string
    {
        if ($doc->document_type === 'FR' || $doc->payment_status === 'paid') {
            return 'paid';
        }

        if ($doc->status === 'overdue') {
            return 'overdue';
        }

        if ($doc->payment_status === 'partial' || $doc->status === 'partial') {
            return 'partial';
        }

        return $doc->due_date->toDateString() < $today->toDateString() ? 'overdue' : 'unpaid';
    }

    private function recentActivity(int $companyId)
    {
        // Produto e armazém apagados continuam a ter histórico, por isso vêm incluídos
        return StockMovement::where('company_id', $companyId)
            ->with([
                'product' => fn ($q) => $q->withTrashed(),
                'warehouse' => fn ($q) => $q->withTrashed(),
                'user',
            ])
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn (StockMovement $mov) => [
                'id' => $mov->id,
                'product_name' => $mov->product?->name ?? '—',
                'warehouse_name' => $mov->warehouse?->name ?? '—',
                'user_name' => $mov->user?->name ?? 'Sistema',
                'type' => $mov->type,
                'quantity' => (float) $mov->quantity,
                'created_at' => $mov->created_at->toISOString(),
            ]);
    }

    /**
     * Documentos emitidos da empresa, dos tipos indicados, com data de emissão entre as duas datas
     * (inclusive). O limite superior é "antes de amanhã" para valer também com a hora gravada.
     *
     * @param  array<int, string>  $types
     */
    private function issuedDocuments(int $companyId, array $types, CarbonImmutable $from, CarbonImmutable $to)
    {
        return Document::where('company_id', $companyId)
            ->whereIn('document_type', $types)
            ->whereIn('status', self::ISSUED)
            ->where('issue_date', '>=', $from->toDateString())
            ->where('issue_date', '<', $to->addDay()->toDateString());
    }
}
