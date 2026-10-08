<?php

namespace App\Http\Controllers;

use App\Models\Billing\Customer;
use App\Models\Billing\Document;
use App\Models\Catalog\Product;
use App\Models\Inventory\ProductStock;
use App\Models\Inventory\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
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
            if ($url === '/pos' && !$user->company?->can('pos')) {
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
        if (!$request->user()->can('reports.view')) {
            return redirect($this->landingPageFor($request->user()));
        }

        $companyId = $request->user()->company_id;

        // Total invoiced: Sum grand_total for FR and FT confirmed
        $totalInvoiced = (float) Document::where('company_id', $companyId)
            ->whereIn('document_type', ['FT', 'FR'])
            ->whereIn('status', ['confirmed', 'partial', 'paid'])
            ->sum('grand_total');

        // Receivables (Valor a Receber): Confirmed unpaid/partial FT (invoices)
        $receivables = (float) Document::where('company_id', $companyId)
            ->where('document_type', 'FT')
            ->whereIn('status', ['confirmed', 'partial'])
            ->whereIn('payment_status', ['unpaid', 'partial'])
            ->sum('grand_total');

        // Total clients
        $totalClients = Customer::where('company_id', $companyId)->count();

        // Total products/services
        $totalItems = Product::where('company_id', $companyId)->count();

        // Stock alerts count: sum(quantity) <= min_stock and track_stock = true
        $allProducts = Product::where('company_id', $companyId)
            ->withSum('stocks as total_stock', 'quantity')
            ->get();

        $lowStockCount = $allProducts->filter(function ($p) {
            return $p->track_stock && ($p->total_stock ?? 0) <= $p->min_stock;
        })->count();

        // Recent sales: latest 5 confirmed documents
        $recentSales = Document::where('company_id', $companyId)
            ->whereIn('document_type', ['FT', 'FR'])
            ->whereIn('status', ['confirmed', 'partial', 'paid'])
            ->with('customer')
            ->latest()
            ->limit(5)
            ->get()
            ->map(function ($doc) {
                return [
                    'id' => $doc->id,
                    'document_number' => $doc->document_number,
                    'url' => $doc->showUrl(),
                    'customer_name' => $doc->customer_name,
                    'grand_total' => (float) $doc->grand_total,
                    'status' => $doc->status,
                    'payment_status' => $doc->payment_status,
                    'created_at' => $doc->created_at->toISOString(),
                ];
            });

        // Recent activity: latest 5 stock movements
        $recentActivity = StockMovement::where('company_id', $companyId)
            ->with(['product', 'warehouse', 'user'])
            ->latest()
            ->limit(5)
            ->get()
            ->map(function ($mov) {
                return [
                    'id' => $mov->id,
                    'product_name' => $mov->product->name,
                    'warehouse_name' => $mov->warehouse->name,
                    'user_name' => $mov->user->name ?? 'Sistema',
                    'type' => $mov->type,
                    'quantity' => (float) $mov->quantity,
                    'created_at' => $mov->created_at->toISOString(),
                ];
            });

        // Monthly sales for chart (last 6 months) - Database agnostic grouping in PHP
        $sixMonthsAgo = now()->subMonths(6)->startOfMonth();
        $docsForChart = Document::where('company_id', $companyId)
            ->whereIn('document_type', ['FT', 'FR'])
            ->whereIn('status', ['confirmed', 'partial', 'paid'])
            ->where('created_at', '>=', $sixMonthsAgo)
            ->get();

        $monthlySales = [];
        for ($i = 5; $i >= 0; $i--) {
            $monthDate = now()->subMonths($i);
            $monthKey = $monthDate->format('Y-m');
            $label = $monthDate->format('M Y');
            
            $totalForMonth = $docsForChart->filter(function ($doc) use ($monthKey) {
                return $doc->created_at->format('Y-m') === $monthKey;
            })->sum('grand_total');

            $monthlySales[] = [
                'label' => $label,
                'value' => (float) $totalForMonth,
            ];
        }

        return Inertia::render('dashboard', [
            'metrics' => [
                'total_invoiced' => $totalInvoiced,
                'receivables' => $receivables,
                'total_clients' => $totalClients,
                'total_items' => $totalItems,
                'low_stock_count' => $lowStockCount,
            ],
            'recent_sales' => $recentSales,
            'recent_activity' => $recentActivity,
            'chart_data' => $monthlySales,
        ]);
    }
}
