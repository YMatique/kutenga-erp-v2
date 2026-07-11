<?php

namespace App\Http\Controllers\Pos;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use App\Models\PosShift;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class PosReportController extends Controller
{
    public function index()
    {
        $user    = Auth::user();
        $company = $user->company_id;

        // KPIs do mês atual
        $thisMonth = [
            'sales_total' => (float) DB::table('documents')
                ->join('pos_shifts', 'documents.pos_shift_id', '=', 'pos_shifts.id')
                ->where('pos_shifts.company_id', $company)
                ->whereMonth('documents.created_at', now()->month)
                ->whereYear('documents.created_at', now()->year)
                ->whereNull('documents.deleted_at')
                ->sum('documents.grand_total'),

            'transactions' => DB::table('documents')
                ->join('pos_shifts', 'documents.pos_shift_id', '=', 'pos_shifts.id')
                ->where('pos_shifts.company_id', $company)
                ->whereMonth('documents.created_at', now()->month)
                ->whereYear('documents.created_at', now()->year)
                ->whereNull('documents.deleted_at')
                ->count(),

            'tax_total' => (float) DB::table('documents')
                ->join('pos_shifts', 'documents.pos_shift_id', '=', 'pos_shifts.id')
                ->where('pos_shifts.company_id', $company)
                ->whereMonth('documents.created_at', now()->month)
                ->whereYear('documents.created_at', now()->year)
                ->whereNull('documents.deleted_at')
                ->sum('documents.tax_total'),

            'shifts_count' => PosShift::where('company_id', $company)
                ->whereMonth('opened_at', now()->month)
                ->whereYear('opened_at', now()->year)
                ->count(),
        ];

        $thisMonth['avg_ticket'] = $thisMonth['transactions'] > 0
            ? $thisMonth['sales_total'] / $thisMonth['transactions']
            : 0;

        // Vendas por dia (últimos 30 dias)
        $dailySales = DB::table('documents')
            ->join('pos_shifts', 'documents.pos_shift_id', '=', 'pos_shifts.id')
            ->where('pos_shifts.company_id', $company)
            ->where('documents.created_at', '>=', now()->subDays(29)->startOfDay())
            ->whereNull('documents.deleted_at')
            ->selectRaw('DATE(documents.created_at) as date, SUM(documents.grand_total) as total, COUNT(*) as count')
            ->groupByRaw('DATE(documents.created_at)')
            ->orderBy('date')
            ->get()
            ->map(fn($r) => ['date' => $r->date, 'total' => (float) $r->total, 'count' => $r->count]);

        // Vendas por operador (mês atual)
        $byOperator = DB::table('documents')
            ->join('pos_shifts', 'documents.pos_shift_id', '=', 'pos_shifts.id')
            ->join('users', 'pos_shifts.user_id', '=', 'users.id')
            ->where('pos_shifts.company_id', $company)
            ->whereMonth('documents.created_at', now()->month)
            ->whereYear('documents.created_at', now()->year)
            ->whereNull('documents.deleted_at')
            ->selectRaw('users.name as operator, SUM(documents.grand_total) as total, COUNT(*) as transactions')
            ->groupBy('users.id', 'users.name')
            ->orderByDesc('total')
            ->get()
            ->map(fn($r) => ['operator' => $r->operator, 'total' => (float) $r->total, 'transactions' => $r->transactions]);

        // Top 10 produtos mais vendidos (mês atual)
        $topProducts = DB::table('document_items')
            ->join('documents', 'document_items.document_id', '=', 'documents.id')
            ->join('pos_shifts', 'documents.pos_shift_id', '=', 'pos_shifts.id')
            ->where('pos_shifts.company_id', $company)
            ->whereMonth('documents.created_at', now()->month)
            ->whereYear('documents.created_at', now()->year)
            ->whereNull('documents.deleted_at')
            ->selectRaw('document_items.product_name, SUM(document_items.quantity) as qty, SUM(document_items.quantity * document_items.unit_price) as revenue')
            ->groupBy('document_items.product_id', 'document_items.product_name')
            ->orderByDesc('qty')
            ->limit(10)
            ->get()
            ->map(fn($r) => ['name' => $r->product_name, 'qty' => (float) $r->qty, 'revenue' => (float) $r->revenue]);

        // Turnos recentes
        $recentShifts = PosShift::where('company_id', $company)
            ->with(['user:id,name'])
            ->withSum('documents', 'grand_total')
            ->withCount('documents')
            ->orderByDesc('opened_at')
            ->limit(10)
            ->get()
            ->map(fn($s) => [
                'id'             => $s->id,
                'operator'       => $s->user?->name ?? '—',
                'status'         => $s->status,
                'opened_at'      => $s->opened_at,
                'closed_at'      => $s->closed_at,
                'sales_total'    => (float) ($s->documents_sum_grand_total ?? 0),
                'documents_count'=> $s->documents_count,
            ]);

        return Inertia::render('pos/Reports/Index', [
            'kpis'         => $thisMonth,
            'dailySales'   => $dailySales,
            'byOperator'   => $byOperator,
            'topProducts'  => $topProducts,
            'recentShifts' => $recentShifts,
            'period'       => ['month' => now()->month, 'year' => now()->year, 'label' => now()->translatedFormat('F Y')],
        ]);
    }
}
