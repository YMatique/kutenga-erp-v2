<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Quote;
use App\Models\DocumentSeries;
use App\Models\Product;
use App\Services\Billing\BillingService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class QuoteController extends Controller
{
    protected BillingService $billingService;

    public function __construct(BillingService $billingService)
    {
        $this->billingService = $billingService;
    }

    public function index(Request $request): Response
    {
        $companyId = $request->user()->company_id;

        $quotes = Quote::where('company_id', $companyId)
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
            })
            ->orderBy('created_at', 'desc')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('billing/quotes/index', [
            'documents' => $quotes,
            'filters' => $request->only(['search', 'status']),
            'type' => 'CT',
            'title' => 'Cotações e Orçamentos'
        ]);
    }

    public function create(Request $request): Response
    {
        $companyId = $request->user()->company_id;

        $customers = Customer::where('company_id', $companyId)->where('is_active', true)->get();
        $products = Product::where('company_id', $companyId)->where('status', 'active')->get();
        $series = DocumentSeries::where('company_id', $companyId)->where('is_active', true)->get();

        return Inertia::render('billing/quotes/create', [
            'customers' => $customers,
            'products' => $products,
            'series' => $series,
            'type' => 'CT'
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

        $validated['document_type'] = 'CT';

        $document = $this->billingService->createDraft($validated, $companyId);

        return redirect()->route('billing.quotes.show', $document->id)
            ->with('success', 'Rascunho de cotação criado com sucesso!');
    }

    public function show(Request $request, $id): Response
    {
        $companyId = $request->user()->company_id;

        $quote = Quote::where('company_id', $companyId)
            ->with(['items', 'series', 'customer', 'company'])
            ->findOrFail($id);

        return Inertia::render('billing/quotes/show', [
            'document' => $quote,
            'type' => 'CT'
        ]);
    }

    public function edit(Request $request, $id): Response
    {
        $companyId = $request->user()->company_id;

        $quote = Quote::where('company_id', $companyId)
            ->with(['items'])
            ->findOrFail($id);

        if ($quote->status !== 'draft') {
            abort(403, 'Apenas rascunhos podem ser editados.');
        }

        $customers = Customer::where('company_id', $companyId)->where('is_active', true)->get();
        $products = Product::where('company_id', $companyId)->where('status', 'active')->get();
        $series = DocumentSeries::where('company_id', $companyId)->where('is_active', true)->get();

        return Inertia::render('billing/quotes/edit', [
            'document' => $quote,
            'customers' => $customers,
            'products' => $products,
            'series' => $series,
            'type' => 'CT'
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

        return redirect()->route('billing.quotes.show', $id)
            ->with('success', 'Rascunho de cotação atualizado com sucesso!');
    }

    public function confirm(Request $request, $id)
    {
        $companyId = $request->user()->company_id;
        $quote = Quote::where('company_id', $companyId)->findOrFail($id);

        try {
            $this->billingService->confirmAndEmit($quote->id, null);
            return redirect()->back()->with('success', 'Cotação confirmada e emitida fiscalmente!');
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function cancel(Request $request, $id)
    {
        try {
            $this->billingService->cancel($id);
            return redirect()->back()->with('success', 'Cotação cancelada com sucesso!');
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }
}

