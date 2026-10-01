<?php

namespace App\Http\Controllers\Pos;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Pos\CashRegister;
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

        // Turnos antigos (sem caixa) passam para a primeira caixa ativa da empresa
        $register = $shift->cashRegister
            ?? CashRegister::where('company_id', $companyId)->where('is_active', true)->orderBy('id')->first()
            ?? CashRegister::ensureDefault($companyId, $user->branch_id);

        if (!$register) {
            return response()->json(['error' => 'Nenhuma caixa ativa configurada.'], 400);
        }

        if (!$shift->cash_register_id) {
            $shift->update(['cash_register_id' => $register->id]);
        }

        // Série própria da caixa (independente da faturação)
        $series = $register->currentSeries($user->id);

        $documentData = [
            'customer_id' => $customer->id,
            'customer_name' => $customer->name,
            'customer_nuit' => $customer->nuit,
            'series_id' => $series->id,
            'branch_id' => $register->branch_id,
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

            // Em dinheiro, o valor entregue tem de cobrir o total (o troco não é receita)
            if ($validated['payment_method'] === 'cash' && (float) $validated['amount_paid'] < (float) $document->grand_total - 0.005) {
                throw new \InvalidArgumentException('O valor entregue é inferior ao total da venda.');
            }

            // 2. Confirm and Emit — armazém da caixa, senão o predefinido da empresa
            $warehouse = ($register?->warehouse_id
                    ? Warehouse::where('company_id', $companyId)->find($register->warehouse_id)
                    : null)
                ?? Warehouse::where('company_id', $companyId)->orderByDesc('is_default')->orderBy('id')->first();
            $this->billingService->confirmAndEmit($document->id, $warehouse);

            // 3. Register Payment
            $payment = Payment::create([
                'company_id' => $companyId,
                'customer_id' => $customer->id,
                'payment_date' => now(),
                'payment_method' => $validated['payment_method'],
                'amount' => $document->grand_total,
                'amount_tendered' => $validated['payment_method'] === 'cash' ? $validated['amount_paid'] : null,
                'change_given' => $validated['payment_method'] === 'cash'
                    ? round(max(0, (float) $validated['amount_paid'] - (float) $document->grand_total), 2)
                    : null,
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
                'document' => $document,
                'amount_paid' => (float) $validated['amount_paid'],
                'auto_print' => (bool) $register->auto_print,
                'change' => $validated['payment_method'] === 'cash'
                    ? round(max(0, (float) $validated['amount_paid'] - (float) $document->grand_total), 2)
                    : 0,
            ]);

        } catch (\InvalidArgumentException $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
