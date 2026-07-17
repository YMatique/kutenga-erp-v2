<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Invoice;
use App\Models\DocumentSeries;
use App\Models\Product;
use App\Models\Warehouse;
use App\Services\Billing\BillingService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InvoiceController extends Controller
{
    protected BillingService $billingService;

    public function __construct(BillingService $billingService)
    {
        $this->billingService = $billingService;
    }

    public function index(Request $request): Response
    {
        $companyId = $request->user()->company_id;

        $query = Invoice::where('company_id', $companyId)
            ->with(['series', 'customer'])
            ->when($request->search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('document_number', 'like', "%{$search}%")
                      ->orWhere('customer_name', 'like', "%{$search}%")
                      ->orWhere('customer_nuit', 'like', "%{$search}%");
                });
            })
            ->when($request->status, function ($query, $status) {
                if ($status !== 'all') {
                    $query->where('status', $status);
                }
            });

        $kpis = [
            'total_count' => (clone $query)->count(),
            'total_amount' => (clone $query)->sum('grand_total'),
            'paid_amount' => (clone $query)->where('status', 'paid')->sum('grand_total'),
            'pending_amount' => (clone $query)->whereIn('status', ['draft', 'confirmed', 'partial', 'overdue'])->sum('grand_total'),
        ];

        $invoices = $query->orderBy('created_at', 'desc')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('billing/invoices/index', [
            'documents' => $invoices,
            'filters' => $request->only(['search', 'status']),
            'kpis' => $kpis,
            'type' => 'FT',
            'title' => 'Faturas a Crédito'
        ]);
    }

    public function create(Request $request): Response
    {
        $companyId = $request->user()->company_id;

        $customers = Customer::where('company_id', $companyId)->where('is_active', true)->get();
        $products = Product::where('company_id', $companyId)->where('status', 'active')->get();
        $series = DocumentSeries::where('company_id', $companyId)->where('is_active', true)->get();
        $warehouses = Warehouse::where('company_id', $companyId)->where('is_active', true)->get();

        return Inertia::render('billing/invoices/create', [
            'customers' => $customers,
            'products' => $products,
            'series' => $series,
            'warehouses' => $warehouses,
            'type' => 'FT'
        ]);
    }

    public function store(Request $request)
    {
        $companyId = $request->user()->company_id;

        $validated = $request->validate([
            'customer_id' => 'nullable|exists:customers,id',
            'customer_name' => 'required|string|max:255',
            'customer_nuit' => 'required|string|max:15',
            'customer_phone' => 'nullable|string|max:30',
            'customer_email' => 'nullable|email|max:255',
            'customer_address' => 'nullable|string',
            'series_id' => 'nullable|exists:document_series,id',
            'issue_date' => 'required|date',
            'due_date' => 'required|date|after_or_equal:issue_date',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'nullable|exists:products,id',
            'items.*.product_name' => 'required|string|max:255',
            'items.*.product_sku' => 'nullable|string|max:50',
            'items.*.product_barcode' => 'nullable|string|max:50',
            'items.*.quantity' => 'required|numeric|min:0.001',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.tax_rate' => 'required|numeric|min:0',
            'items.*.discount_percent' => 'nullable|numeric|between:0,100',
        ]);

        $validated['document_type'] = 'FT';

        $document = $this->billingService->createDraft($validated, $companyId);

        return redirect()->route('billing.invoices.show', $document->id)
            ->with('success', 'Rascunho de fatura criado com sucesso!');
    }

    public function show(Request $request, $id): Response
    {
        $companyId = $request->user()->company_id;

        $invoice = Invoice::where('company_id', $companyId)
            ->with(['items', 'series', 'customer', 'company'])
            ->findOrFail($id);

        $warehouses = Warehouse::where('company_id', $companyId)->where('is_active', true)->get();

        return Inertia::render('billing/invoices/show', [
            'document' => $invoice,
            'warehouses' => $warehouses,
            'type' => 'FT'
        ]);
    }

    public function edit(Request $request, $id): Response
    {
        $companyId = $request->user()->company_id;

        $invoice = Invoice::where('company_id', $companyId)
            ->with(['items'])
            ->findOrFail($id);

        if ($invoice->status !== 'draft') {
            abort(403, 'Apenas rascunhos podem ser editados.');
        }

        $customers = Customer::where('company_id', $companyId)->where('is_active', true)->get();
        $products = Product::where('company_id', $companyId)->where('status', 'active')->get();
        $series = DocumentSeries::where('company_id', $companyId)->where('is_active', true)->get();
        $warehouses = Warehouse::where('company_id', $companyId)->where('is_active', true)->get();

        return Inertia::render('billing/invoices/edit', [
            'document' => $invoice,
            'customers' => $customers,
            'products' => $products,
            'series' => $series,
            'warehouses' => $warehouses,
            'type' => 'FT'
        ]);
    }

    public function update(Request $request, $id)
    {
        $companyId = $request->user()->company_id;

        $validated = $request->validate([
            'customer_id' => 'nullable|exists:customers,id',
            'customer_name' => 'required|string|max:255',
            'customer_nuit' => 'required|string|max:15',
            'customer_phone' => 'nullable|string|max:30',
            'customer_email' => 'nullable|email|max:255',
            'customer_address' => 'nullable|string',
            'issue_date' => 'required|date',
            'due_date' => 'required|date|after_or_equal:issue_date',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'nullable|exists:products,id',
            'items.*.product_name' => 'required|string|max:255',
            'items.*.product_sku' => 'nullable|string|max:50',
            'items.*.product_barcode' => 'nullable|string|max:50',
            'items.*.quantity' => 'required|numeric|min:0.001',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.tax_rate' => 'required|numeric|min:0',
            'items.*.discount_percent' => 'nullable|numeric|between:0,100',
        ]);

        $this->billingService->updateDraft($id, $validated);

        return redirect()->route('billing.invoices.show', $id)
            ->with('success', 'Rascunho de fatura atualizado com sucesso!');
    }

    public function confirm(Request $request, $id)
    {
        $companyId = $request->user()->company_id;
        $invoice = Invoice::where('company_id', $companyId)->findOrFail($id);

        $hasPhysicalProducts = $invoice->has_physical_products;

        $validated = $request->validate([
            'warehouse_id' => $hasPhysicalProducts ? 'required|exists:warehouses,id' : 'nullable|exists:warehouses,id',
        ]);

        try {
            $warehouse = null;
            if (!empty($validated['warehouse_id'])) {
                $warehouse = Warehouse::where('company_id', $companyId)->findOrFail($validated['warehouse_id']);
            }
            $this->billingService->confirmAndEmit($invoice->id, $warehouse);

            return redirect()->back()->with('success', 'Fatura emitida oficialmente e stock atualizado!');
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function cancel(Request $request, $id)
    {
        try {
            $this->billingService->cancel($id);
            return redirect()->back()->with('success', 'Fatura cancelada/estornada com sucesso!');
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function receivePayment(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'amount' => 'required|numeric|min:0.01',
            'payment_method' => 'required|string',
            'reference' => 'nullable|string|max:100'
        ]);

        try {
            $this->billingService->registerPayment(
                $validated['customer_id'],
                $validated['amount'],
                $validated['payment_method'],
                $validated['reference']
            );

            return redirect()->back()->with('success', 'Pagamento recebido com sucesso!');
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }
}
