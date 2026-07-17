<?php

namespace App\Http\Controllers\Billing;

use App\Models\Billing\Payment;


use App\Http\Controllers\Controller;

use App\Models\Billing\Customer;
use App\Models\Billing\Receipt;
use App\Models\Billing\DocumentSeries;
use App\Models\Catalog\Product;
use App\Models\Inventory\Warehouse;
use App\Services\Billing\BillingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ReceiptController extends Controller
{
    protected BillingService $billingService;

    public function __construct(BillingService $billingService)
    {
        $this->billingService = $billingService;
    }

    public function index(Request $request): Response
    {
        $companyId = $request->user()->company_id;

        $query = Receipt::where('company_id', $companyId)
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

        $receipts = $query->orderBy('created_at', 'desc')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('billing/receipts/index', [
            'documents' => $receipts,
            'filters' => $request->only(['search', 'status']),
            'kpis' => $kpis,
            'type' => 'FR',
            'title' => 'Faturas-Recibo'
        ]);
    }

    public function create(Request $request): Response
    {
        $companyId = $request->user()->company_id;

        $customers = Customer::where('company_id', $companyId)->where('is_active', true)->get();
        $products = Product::where('company_id', $companyId)->where('status', 'active')->get();
        $series = DocumentSeries::where('company_id', $companyId)->where('is_active', true)->get();
        $warehouses = Warehouse::where('company_id', $companyId)->where('is_active', true)->get();

        return Inertia::render('billing/receipts/create', [
            'customers' => $customers,
            'products' => $products,
            'series' => $series,
            'warehouses' => $warehouses,
            'type' => 'FR'
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

        $validated['document_type'] = 'FR';
        $validated['source_module'] = 'billing';

        $document = $this->billingService->createDraft($validated, $companyId);

        return redirect()->route('billing.receipts.show', $document->id)
            ->with('success', 'Rascunho de fatura-recibo criado com sucesso!');
    }

    public function show(Request $request, $id): Response
    {
        $companyId = $request->user()->company_id;

        $receipt = Receipt::where('company_id', $companyId)
            ->with(['items', 'series', 'customer'])
            ->findOrFail($id);

        $warehouses = Warehouse::where('company_id', $companyId)->where('is_active', true)->get();

        return Inertia::render('billing/receipts/show', [
            'document' => $receipt,
            'warehouses' => $warehouses,
            'type' => 'FR'
        ]);
    }

    public function edit(Request $request, $id): Response
    {
        $companyId = $request->user()->company_id;

        $receipt = Receipt::where('company_id', $companyId)
            ->with(['items'])
            ->findOrFail($id);

        if ($receipt->status !== 'draft') {
            abort(403, 'Apenas rascunhos podem ser editados.');
        }

        $customers = Customer::where('company_id', $companyId)->where('is_active', true)->get();
        $products = Product::where('company_id', $companyId)->where('status', 'active')->get();
        $series = DocumentSeries::where('company_id', $companyId)->where('is_active', true)->get();
        $warehouses = Warehouse::where('company_id', $companyId)->where('is_active', true)->get();

        return Inertia::render('billing/receipts/edit', [
            'document' => $receipt,
            'customers' => $customers,
            'products' => $products,
            'series' => $series,
            'warehouses' => $warehouses,
            'type' => 'FR'
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

        return redirect()->route('billing.receipts.show', $id)
            ->with('success', 'Rascunho de fatura-recibo atualizado com sucesso!');
    }

    public function confirm(Request $request, $id)
    {
        $user = $request->user();
        $companyId = $user->company_id;
        $receipt = Receipt::where('company_id', $companyId)->findOrFail($id);

        $hasPhysicalProducts = $receipt->has_physical_products;

        $validated = $request->validate([
            'warehouse_id' => $hasPhysicalProducts ? 'required|exists:warehouses,id' : 'nullable|exists:warehouses,id',
            'payment_method' => 'required|string|in:cash,card,transfer',
        ]);

        try {
            DB::beginTransaction();

            $warehouse = null;
            if (!empty($validated['warehouse_id'])) {
                $warehouse = Warehouse::where('company_id', $companyId)->findOrFail($validated['warehouse_id']);
            }
            $this->billingService->confirmAndEmit($receipt->id, $warehouse);

            // Refetch to get updated grand_total if any
            $receipt->refresh();

            // Register Payment
            $payment = \App\Models\Billing\Payment::create([
                'company_id' => $companyId,
                'customer_id' => $receipt->customer_id,
                'payment_date' => now(),
                'payment_method' => $validated['payment_method'],
                'amount' => $receipt->grand_total,
                'status' => 'completed',
                'reference' => 'FR-' . $receipt->id . '-' . time(),
                'created_by' => $user->id,
            ]);

            \App\Models\Billing\PaymentAllocation::create([
                'payment_id' => $payment->id,
                'document_id' => $receipt->id,
                'amount_allocated' => $receipt->grand_total,
                'created_by' => $user->id,
            ]);

            DB::commit();

            return redirect()->back()->with('success', 'Fatura-Recibo emitido oficialmente e pagamento registado!');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function cancel(Request $request, $id)
    {
        try {
            $this->billingService->cancel($id);
            return redirect()->back()->with('success', 'Fatura-Recibo cancelada com sucesso!');
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }
}

