<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Document;
use App\Models\Product;
use App\Models\ProductStock;
use App\Models\StockMovement;
use App\Models\PosShift;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;
use Spatie\SimpleExcel\SimpleExcelWriter;

class ReportController extends Controller
{
    /**
     * Display the Reports dashboard.
     */
    public function index(Request $request)
    {
        return Inertia::render('reports/index');
    }

    /**
     * Fetch aggregated data for the reports based on category and filters.
     */
    public function data(Request $request)
    {
        $companyId = $request->user()->company_id;
        $category = $request->query('category', 'sales');
        $startDate = $request->query('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDate = $request->query('end_date', Carbon::now()->endOfMonth()->toDateString());

        $startDate = Carbon::parse($startDate)->startOfDay();
        $endDate = Carbon::parse($endDate)->endOfDay();

        $data = [];

        switch ($category) {
            case 'sales':
                $data = $this->getSalesData($companyId, $startDate, $endDate);
                break;
            case 'inventory':
                $data = $this->getInventoryData($companyId, $startDate, $endDate);
                break;
            case 'customers':
                $data = $this->getCustomerData($companyId, $startDate, $endDate);
                break;
            case 'pos':
                $data = $this->getPosData($companyId, $startDate, $endDate);
                break;
        }

        return response()->json($data);
    }

    private function getSalesData($companyId, $startDate, $endDate)
    {
        // Vendas Confirmadas e Pagas (FT e FR)
        $sales = Document::where('company_id', $companyId)
            ->whereIn('document_type', ['FT', 'FR'])
            ->whereIn('status', ['confirmed', 'paid'])
            ->whereBetween('created_at', [$startDate, $endDate]);

        $totalRevenue = (float) $sales->sum('grand_total');
        $totalTaxes = (float) $sales->sum('tax_total');

        // Vendas por mês/dia (para gráficos)
        $chartData = $sales->get()
            ->groupBy(function ($date) {
                return Carbon::parse($date->created_at)->format('Y-m-d');
            })
            ->map(function ($row) {
                return $row->sum('grand_total');
            });

        // Faturas emitidas vs cotações
        $totalInvoices = Document::where('company_id', $companyId)
            ->where('document_type', 'FT')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->count();

        $totalQuotes = Document::where('company_id', $companyId)
            ->where('document_type', 'CT')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->count();

        return [
            'total_revenue' => $totalRevenue,
            'total_taxes' => $totalTaxes,
            'total_invoices' => $totalInvoices,
            'total_quotes' => $totalQuotes,
            'chart_data' => $chartData,
        ];
    }

    private function getInventoryData($companyId, $startDate, $endDate)
    {
        $movements = StockMovement::where('company_id', $companyId)
            ->whereBetween('created_at', [$startDate, $endDate]);

        $totalIns = (float) $movements->clone()->where('type', 'in')->sum('quantity');
        $totalOuts = (float) $movements->clone()->where('type', 'out')->sum('quantity');

        $lowStockProducts = Product::where('company_id', $companyId)
            ->where('track_stock', true)
            ->withSum('stocks as total_stock', 'quantity')
            ->get()
            ->filter(fn($p) => ($p->total_stock ?? 0) <= $p->min_stock)
            ->values();

        return [
            'total_ins' => $totalIns,
            'total_outs' => $totalOuts,
            'low_stock_products' => $lowStockProducts,
        ];
    }

    private function getCustomerData($companyId, $startDate, $endDate)
    {
        $customers = Customer::where('company_id', $companyId)->get();

        $topCustomers = Document::where('company_id', $companyId)
            ->whereIn('document_type', ['FT', 'FR'])
            ->whereIn('status', ['confirmed', 'paid'])
            ->whereBetween('created_at', [$startDate, $endDate])
            ->selectRaw('customer_id, sum(grand_total) as total_spent')
            ->groupBy('customer_id')
            ->orderByDesc('total_spent')
            ->limit(10)
            ->with('customer')
            ->get();

        $pendingBalances = Document::where('company_id', $companyId)
            ->where('document_type', 'FT')
            ->whereIn('status', ['confirmed', 'partial'])
            ->whereIn('payment_status', ['unpaid', 'partial'])
            ->selectRaw('customer_id, sum(grand_total - amount_paid) as pending_balance')
            ->groupBy('customer_id')
            ->orderByDesc('pending_balance')
            ->limit(10)
            ->with('customer')
            ->get();

        return [
            'total_customers' => $customers->count(),
            'top_customers' => $topCustomers,
            'pending_balances' => $pendingBalances,
        ];
    }

    private function getPosData($companyId, $startDate, $endDate)
    {
        $shifts = PosShift::where('company_id', $companyId)
            ->whereBetween('opened_at', [$startDate, $endDate])
            ->get();

        $totalShifts = $shifts->count();
        $totalExpected = $shifts->sum('expected_amount');
        $totalReported = $shifts->sum('reported_amount');
        $totalVariances = $shifts->sum('difference_amount');

        return [
            'total_shifts' => $totalShifts,
            'total_expected' => $totalExpected,
            'total_reported' => $totalReported,
            'total_variances' => $totalVariances,
        ];
    }

    public function exportPdf(Request $request)
    {
        $companyId = $request->user()->company_id;
        $category = $request->input('category', 'sales');

        // Simular os dados da request de API internamente
        $request->merge(['category' => $category]);
        $data = $this->data($request)->getData(true);

        $pdf = Pdf::loadView('reports.pdf', [
            'category' => $category,
            'data' => $data,
            'date_range' => [
                'start' => $request->input('start_date'),
                'end' => $request->input('end_date')
            ],
            'company' => $request->user()->company->name ?? 'Empresa'
        ]);

        return $pdf->download("relatorio_{$category}.pdf");
    }

    public function exportExcel(Request $request)
    {
        $category = $request->input('category', 'sales');
        $request->merge(['category' => $category]);
        $data = $this->data($request)->getData(true);

        $filename = "relatorio_{$category}.xlsx";
        $path = storage_path("app/public/{$filename}");

        $writer = SimpleExcelWriter::create($path);

        if ($category === 'sales') {
            $writer->addRow(['Indicador', 'Valor']);
            $writer->addRow(['Total Receitas', $data['total_revenue']]);
            $writer->addRow(['Total Impostos', $data['total_taxes']]);
            $writer->addRow(['Total Faturas', $data['total_invoices']]);
            $writer->addRow(['Total Cotações', $data['total_quotes']]);
        } elseif ($category === 'inventory') {
            $writer->addRow(['Indicador', 'Valor']);
            $writer->addRow(['Total Entradas', $data['total_ins']]);
            $writer->addRow(['Total Saídas', $data['total_outs']]);
        } elseif ($category === 'customers') {
            $writer->addRow(['Top Clientes']);
            $writer->addRow(['Nome', 'Total Gasto']);
            foreach ($data['top_customers'] as $tc) {
                $writer->addRow([$tc['customer']['name'] ?? 'N/A', $tc['total_spent']]);
            }
        } elseif ($category === 'pos') {
            $writer->addRow(['Indicador', 'Valor']);
            $writer->addRow(['Total Turnos', $data['total_shifts']]);
            $writer->addRow(['Total Esperado', $data['total_expected']]);
            $writer->addRow(['Total Reportado', $data['total_reported']]);
        }

        $writer->close();

        return response()->download($path)->deleteFileAfterSend(true);
    }
}
