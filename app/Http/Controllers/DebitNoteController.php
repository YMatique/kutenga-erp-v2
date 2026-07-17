<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\DebitNote;
use App\Models\Document;
use App\Models\DocumentSeries;
use App\Models\Product;
use App\Models\Warehouse;
use App\Services\Billing\BillingService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DebitNoteController extends Controller
{
    protected BillingService $billingService;

    public function __construct(BillingService $billingService)
    {
        $this->billingService = $billingService;
    }

    public function index(Request $request): Response
    {
        $companyId = $request->user()->company_id;

        $query = DebitNote::where('company_id', $companyId)
            ->with(['series', 'customer', 'referencedDocument'])
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

        $notes = $query->orderBy('created_at', 'desc')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('billing/debit-notes/index', [
            'documents' => $notes,
            'filters' => $request->only(['search', 'status']),
            'kpis' => $kpis,
            'type' => 'ND',
            'title' => 'Notas de Débito'
        ]);
    }

    public function create(Request $request): Response
    {
        $companyId = $request->user()->company_id;

        $customers = Customer::where('company_id', $companyId)->where('is_active', true)->get();
        $products = Product::where('company_id', $companyId)->where('status', 'active')->get();
        $series = DocumentSeries::where('company_id', $companyId)->where('is_active', true)->get();
        $warehouses = Warehouse::where('company_id', $companyId)->where('is_active', true)->get();

        // Carregar as faturas válidas para retificação
        $invoices = Document::where('company_id', $companyId)
            ->whereIn('document_type', ['FT', 'FR'])
            ->whereIn('status', ['confirmed', 'paid', 'partial'])
            ->with('items')
            ->get();

        return Inertia::render('billing/debit-notes/create', [
            'customers' => $customers,
            'products' => $products,
            'series' => $series,
            'warehouses' => $warehouses,
            'invoices' => $invoices,
            'type' => 'ND'
        ]);
    }

    public function store(Request $request)
    {
        $companyId = $request->user()->company_id;

        $validated = $request->validate([
            'referenced_document_id' => 'required|exists:documents,id',
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

        $validated['document_type'] = 'ND';

        $document = $this->billingService->createDraft($validated, $companyId);

        return redirect()->route('billing.debit-notes.show', $document->id)
            ->with('success', 'Rascunho de nota de débito criado com sucesso!');
    }

    public function show(Request $request, $id): Response
    {
        $companyId = $request->user()->company_id;

        $note = DebitNote::where('company_id', $companyId)
            ->with(['items', 'series', 'customer', 'referencedDocument'])
            ->findOrFail($id);

        $warehouses = Warehouse::where('company_id', $companyId)->where('is_active', true)->get();

        return Inertia::render('billing/debit-notes/show', [
            'document' => $note,
            'warehouses' => $warehouses,
            'type' => 'ND'
        ]);
    }

    public function edit(Request $request, $id): Response
    {
        $companyId = $request->user()->company_id;

        $note = DebitNote::where('company_id', $companyId)
            ->with(['items', 'referencedDocument'])
            ->findOrFail($id);

        if ($note->status !== 'draft') {
            abort(403, 'Apenas rascunhos podem ser editados.');
        }

        $customers = Customer::where('company_id', $companyId)->where('is_active', true)->get();
        $products = Product::where('company_id', $companyId)->where('status', 'active')->get();
        $series = DocumentSeries::where('company_id', $companyId)->where('is_active', true)->get();
        $warehouses = Warehouse::where('company_id', $companyId)->where('is_active', true)->get();

        // Carregar as faturas válidas para retificação
        $invoices = Document::where('company_id', $companyId)
            ->whereIn('document_type', ['FT', 'FR'])
            ->whereIn('status', ['confirmed', 'paid', 'partial'])
            ->with('items')
            ->get();

        return Inertia::render('billing/debit-notes/edit', [
            'document' => $note,
            'customers' => $customers,
            'products' => $products,
            'series' => $series,
            'warehouses' => $warehouses,
            'invoices' => $invoices,
            'type' => 'ND'
        ]);
    }

    public function update(Request $request, $id)
    {
        $companyId = $request->user()->company_id;

        $validated = $request->validate([
            'referenced_document_id' => 'required|exists:documents,id',
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

        return redirect()->route('billing.debit-notes.show', $id)
            ->with('success', 'Rascunho de nota de débito atualizado com sucesso!');
    }

    public function confirm(Request $request, $id)
    {
        $companyId = $request->user()->company_id;
        $note = DebitNote::where('company_id', $companyId)->findOrFail($id);

        try {
            $this->billingService->confirmAndEmit($note->id, null);

            return redirect()->back()->with('success', 'Nota de Débito emitida oficialmente e saldos atualizados!');
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function cancel(Request $request, $id)
    {
        try {
            $this->billingService->cancel($id);
            return redirect()->back()->with('success', 'Nota de Débito cancelada com sucesso!');
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }
}

