<?php

namespace App\Http\Controllers\Pos;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Pos\PosShift;
use App\Models\Billing\Customer;
use App\Models\Inventory\Warehouse;
use App\Models\Billing\DocumentSeries;
use App\Models\Billing\Payment;
use App\Models\Billing\PaymentAllocation;
use App\Services\Billing\BillingService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class PosSaleController extends Controller
{
    protected BillingService $billingService;

    public function __construct(BillingService $billingService)
    {
        $this->billingService = $billingService;
    }

    public function store(Request $request)
    {
        $user = Auth::user();
        $companyId = $user->company_id;

        $shift = PosShift::where('user_id', $user->id)
            ->where('company_id', $companyId)
            ->where('status', 'open')
            ->firstOrFail();

        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.product_name' => 'required|string',
            'items.*.quantity' => 'required|numeric|min:0.001',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.tax_rate' => 'required|numeric|min:0',
            'items.*.discount_percent' => 'nullable|numeric|between:0,100',
            'payment_method' => 'required|string|in:cash,card,transfer',
            'amount_paid' => 'required|numeric|min:0',
        ]);

        // Default "Consumidor Final" customer
        $customer = Customer::where('company_id', $companyId)->where('nuit', '999999999')->first();
        if (!$customer) {
            $customer = Customer::create([
                'company_id' => $companyId,
                'name' => 'Consumidor Final',
                'nuit' => '999999999',
                'is_active' => true,
            ]);
        }

        // Default POS series (should ideally be configured, picking first active series for now)
        $series = DocumentSeries::where('company_id', $companyId)
            ->where('year', date('Y'))
            ->where('is_active', true)
            ->first();
        if (!$series) {
            $series = DocumentSeries::where('company_id', $companyId)->where('is_active', true)->first();
        }
        if (!$series) {
            return response()->json(['error' => 'Nenhuma série ativa encontrada.'], 400);
        }

        $documentData = [
            'customer_id' => $customer->id,
            'customer_name' => $customer->name,
            'customer_nuit' => $customer->nuit,
            'series_id' => $series->id,
            'issue_date' => now()->toDateString(),
            'due_date' => now()->toDateString(),
            'document_type' => 'FR',
            'source_module' => 'pos',
            'items' => $validated['items'],
        ];

        DB::beginTransaction();
        try {
            // 1. Create Draft
            $document = $this->billingService->createDraft($documentData, $companyId);
            $document->pos_shift_id = $shift->id;
            $document->save();

            // 2. Confirm and Emit (Assumes default warehouse is 1 for now)
            $warehouse = Warehouse::where('company_id', $companyId)->first();
            $this->billingService->confirmAndEmit($document->id, $warehouse);

            // 3. Register Payment
            $payment = Payment::create([
                'company_id' => $companyId,
                'customer_id' => $customer->id,
                'payment_date' => now(),
                'payment_method' => $validated['payment_method'],
                'amount' => $document->grand_total,
                'status' => 'completed',
                'reference' => 'POS-' . $shift->id . '-' . time(),
                'created_by' => $user->id,
            ]);

            PaymentAllocation::create([
                'payment_id' => $payment->id,
                'document_id' => $document->id,
                'amount_allocated' => $document->grand_total,
                'created_by' => $user->id,
            ]);

            $document->update(['payment_status' => 'paid']);

            DB::commit();

            // Carregar items e company para impressao
            $document->load(['items', 'company', 'series']);

            return response()->json([
                'message' => 'Venda concluída com sucesso',
                'document' => $document
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
