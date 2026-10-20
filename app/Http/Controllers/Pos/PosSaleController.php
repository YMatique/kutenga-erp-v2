<?php

namespace App\Http\Controllers\Pos;

use App\Exceptions\BusinessRuleException;
use App\Exceptions\InsufficientStockException;
use App\Http\Controllers\Controller;
use App\Models\Billing\Customer;
use App\Models\Billing\Document;
use App\Models\Billing\Payment;
use App\Models\Billing\PaymentAllocation;
use App\Models\Pos\CashRegister;
use App\Models\Pos\PosShift;
use App\Services\Billing\BillingService;
use App\Support\Tenant;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;
use Throwable;

class PosSaleController extends Controller
{
    protected BillingService $billingService;

    public function __construct(BillingService $billingService)
    {
        $this->billingService = $billingService;
    }

    public function store(Request $request): JsonResponse
    {
        $user = Auth::user();
        $companyId = $user->company_id;

        $shift = PosShift::where('user_id', $user->id)
            ->where('company_id', $companyId)
            ->where('status', 'open')
            ->first();

        if (! $shift) {
            return response()->json(['error' => 'Não tem nenhum turno aberto. Abra um turno para vender.'], 409);
        }

        $validated = $request->validate([
            // Chave gerada pelo cliente para cada venda: reenviar o mesmo pedido (duplo clique,
            // falha de rede, repetição automática) devolve a venda já feita em vez de criar outra.
            'client_token' => 'nullable|string|max:64',
            'items' => 'required|array|min:1',
            'items.*.product_id' => ['required', Tenant::exists('products')->where('status', 'active')],
            'items.*.product_name' => 'required|string',
            'items.*.quantity' => 'required|numeric|min:0.001',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.tax_rate' => 'required|numeric|min:0',
            'items.*.discount_percent' => 'nullable|numeric|between:0,100',
            'payment_method' => 'required|string|in:cash,card,transfer',
            'amount_paid' => 'required|numeric|min:0',
        ]);

        $token = $validated['client_token'] ?? null;

        if ($token && ($existing = $this->findByToken($companyId, $token))) {
            return $this->replay($existing);
        }

        // Default "Consumidor Final" customer
        $customer = Customer::where('company_id', $companyId)->where('nuit', '999999999')->first();
        if (! $customer) {
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

        if (! $register) {
            return response()->json(['error' => 'Nenhuma caixa ativa configurada.'], 400);
        }

        if (! $shift->cash_register_id) {
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
            // O dia da venda é o do negócio (Maputo), não o de UTC: à noite já seria "amanhã"
            'issue_date' => now(config('app.business_timezone'))->toDateString(),
            'due_date' => now(config('app.business_timezone'))->toDateString(),
            'document_type' => 'FR',
            'source_module' => 'pos',
            'items' => $validated['items'],
        ];

        DB::beginTransaction();
        try {
            // 1. Create Draft
            $document = $this->billingService->createDraft($documentData, $companyId);
            $document->pos_shift_id = $shift->id;
            $document->pos_sale_token = $token;
            $document->save();

            // Em dinheiro, o valor entregue tem de cobrir o total (o troco não é receita)
            if ($validated['payment_method'] === 'cash' && (float) $validated['amount_paid'] < (float) $document->grand_total - 0.005) {
                throw new InvalidArgumentException('O valor entregue é inferior ao total da venda.');
            }

            // 2. Confirm and Emit — armazém da caixa, senão o predefinido da empresa
            $this->billingService->confirmAndEmit($document->id, $register->saleWarehouse());

            // 3. Register Payment
            $change = $validated['payment_method'] === 'cash'
                ? round(max(0, (float) $validated['amount_paid'] - (float) $document->grand_total), 2)
                : 0;

            $payment = Payment::create([
                'company_id' => $companyId,
                'customer_id' => $customer->id,
                'payment_date' => now(),
                'payment_method' => $validated['payment_method'],
                'amount' => $document->grand_total,
                'amount_tendered' => $validated['payment_method'] === 'cash' ? $validated['amount_paid'] : null,
                'change_given' => $validated['payment_method'] === 'cash' ? $change : null,
                'status' => 'completed',
                'reference' => 'POS-'.$shift->id.'-'.$document->id,
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
        } catch (UniqueConstraintViolationException $e) {
            DB::rollBack();

            // Outro pedido com a mesma chave ganhou a corrida: devolve a venda dele
            if ($token && ($existing = $this->findByToken($companyId, $token))) {
                return $this->replay($existing);
            }

            report($e);

            return response()->json(['error' => 'Não foi possível concluir a venda. Tente novamente.'], 500);
        } catch (InsufficientStockException|BusinessRuleException|InvalidArgumentException $e) {
            DB::rollBack();

            // Recusas previstas: a mensagem foi escrita para o operador
            return response()->json(['error' => $e->getMessage()], 422);
        } catch (Throwable $e) {
            DB::rollBack();
            report($e);

            // Erros inesperados (SQL, I/O...) ficam no log; o operador não vê detalhes internos
            return response()->json(['error' => 'Não foi possível concluir a venda. Tente novamente.'], 500);
        }

        return $this->saleResponse($document, $register, (float) $validated['amount_paid'], $change);
    }

    private function findByToken(int $companyId, string $token): ?Document
    {
        return Document::where('company_id', $companyId)
            ->where('source_module', 'pos')
            ->where('pos_sale_token', $token)
            ->first();
    }

    /** Resposta de uma venda já registada (pedido repetido): mesmos dados da original. */
    private function replay(Document $document): JsonResponse
    {
        $payment = $document->paymentAllocations()->with('payment')->first()?->payment;

        return $this->saleResponse(
            $document,
            $document->posShift?->cashRegister,
            (float) ($payment?->amount_tendered ?? $document->grand_total),
            (float) ($payment?->change_given ?? 0),
            replayed: true,
        );
    }

    private function saleResponse(Document $document, ?CashRegister $register, float $amountPaid, float $change, bool $replayed = false): JsonResponse
    {
        // Carregar items e company para impressao
        $document->load(['items', 'company', 'series']);

        return response()->json([
            'message' => 'Venda concluída com sucesso',
            'replayed' => $replayed,
            'document' => $document,
            'amount_paid' => $amountPaid,
            'auto_print' => (bool) $register?->auto_print,
            'change' => $change,
        ]);
    }
}
