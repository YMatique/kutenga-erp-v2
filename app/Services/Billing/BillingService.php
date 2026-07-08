<?php

namespace App\Services\Billing;

use App\Models\Customer;
use App\Models\Document;
use App\Models\DocumentItem;
use App\Models\DocumentSeries;
use App\Models\Payment;
use App\Models\PaymentAllocation;
use App\Models\Product;
use App\Models\Warehouse;
use App\Services\Inventory\StockService;
use App\Models\StockMovement;
use Exception;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class BillingService
{
     protected StockService $stockService;

    /**
     * Injeção de dependência do StockService existente para baixa automática.
     */
    public function __construct(StockService $stockService)
    {
        $this->stockService = $stockService;
    }

    /**
     * Criação de um Rascunho Documental (Draft).
     */
    public function createDraft(array $payload, int $companyId): Document
    {
        return DB::transaction(function () use ($payload, $companyId) {
            
            $seriesId = $payload['series_id'] ?? null;
            if (!$seriesId) {
                $series = DocumentSeries::where('company_id', $companyId)
                    ->where('year', date('Y'))
                    ->where('is_active', true)
                    ->first();
                
                if (!$series) {
                    throw new Exception("Nenhuma série documental ativa configurada para o ano atual.");
                }
                $seriesId = $series->id;
            }

            // Cria o documento em modo rascunho
            $document = Document::create([
                'company_id' => $companyId,
                'branch_id' => $payload['branch_id'] ?? null,
                'series_id' => $seriesId,
                'customer_id' => $payload['customer_id'] ?? null,
                
                // Persistência Histórica do Cliente (Snapshot imutável)
                'customer_name' => $payload['customer_name'] ?? 'Consumidor Final',
                'customer_nuit' => $payload['customer_nuit'] ?? '999999999',
                'customer_phone' => $payload['customer_phone'] ?? null,
                'customer_email' => $payload['customer_email'] ?? null,
                'customer_address' => $payload['customer_address'] ?? 'Maputo, Moçambique',
                
                'document_type' => $payload['document_type'] ?? 'FR',
                'status' => 'draft',
                'issue_date' => $payload['issue_date'] ?? date('Y-m-d'),
                'due_date' => $payload['due_date'] ?? date('Y-m-d'),
                'notes' => $payload['notes'] ?? null,
                'created_by' => Auth::id(),
            ]);

            // Insere os itens calculando as taxas individuais
            if (!empty($payload['items'])) {
                foreach ($payload['items'] as $item) {
                    $this->addItem($document, $item);
                }
            }

            $this->recalculateTotals($document);

            return $document->load('items');
        });
    }

    /**
     * Adiciona um item ao rascunho calculando as regras do IVA (16% Moçambique).
     */
    public function addItem(Document $document, array $itemData): DocumentItem
    {
        if ($document->status !== 'draft') {
            throw new Exception("Imutabilidade: Não é permitido modificar itens de um documento já emitido.");
        }

        $qty = floatval($itemData['quantity']);
        $price = floatval($itemData['unit_price']);
        $discountPercent = floatval($itemData['discount_percent'] ?? 0.00);
        $taxRate = floatval($itemData['tax_rate'] ?? 16.00); // IVA padrão de 16%

        $base = $qty * $price;
        $discountAmount = $base * ($discountPercent / 100);
        $taxable = $base - $discountAmount;
        $taxAmount = $taxable * ($taxRate / 100);
        
        $total = $taxable + $taxAmount;

        return DocumentItem::create([
            'document_id' => $document->id,
            'product_id' => $itemData['product_id'] ?? null,
            'product_name' => $itemData['product_name'],
            'product_sku' => $itemData['product_sku'] ?? null,
            'product_barcode' => $itemData['product_barcode'] ?? null,
            'description' => $itemData['description'] ?? null,
            'quantity' => $qty,
            'unit_price' => $price,
            'tax_rate' => $taxRate,
            'discount_percent' => $discountPercent,
            'total' => $total
        ]);
    }

    /**
     * Recalcula os totais e acumulados da fatura.
     */
    public function recalculateTotals(Document $document): void
    {
        $items = $document->items()->get();
        $subtotal = 0.00;
        $discountTotal = 0.00;
        $taxTotal = 0.00;

        foreach ($items as $item) {
            $lineSubtotal = $item->quantity * $item->unit_price;
            $lineDiscount = $lineSubtotal * ($item->discount_percent / 100);
            $lineTaxable = $lineSubtotal - $lineDiscount;
            $lineTax = $lineTaxable * ($item->tax_rate / 100);

            $subtotal += $lineSubtotal;
            $discountTotal += $lineDiscount;
            $taxTotal += $lineTax;
        }

        $document->update([
            'subtotal' => $subtotal,
            'discount_total' => $discountTotal,
            'tax_total' => $taxTotal,
            'grand_total' => $subtotal - $discountTotal + $taxTotal
        ]);
    }

    /**
     * EMISSÃO E CONFIRMAÇÃO OFICIAL
     * Tranca as tabelas, gera o sequencial único fiscal e dá a baixa física de stock no armazém.
     */
    public function confirmAndEmit(int $documentId, ?Warehouse $warehouse = null): Document
    {
        return DB::transaction(function () use ($documentId, $warehouse) {
            
            // Bloqueio pessimista para evitar duplicação em concorrência
            $document = Document::lockForUpdate()->findOrFail($documentId);

            if ($document->status !== 'draft') {
                throw new Exception("Este documento já se encontra emitido ou cancelado.");
            }

            // Tranca e obtém o sequencial correto da série ativa
            $series = DocumentSeries::lockForUpdate()->findOrFail($document->series_id);
            $sequence = $series->next_number;

            // Incrementa o número da série para a próxima emissão
            $series->next_number = $sequence + 1;
            $series->save();

            // Formatação do número fiscal (ex: FT A/2026/00148)
            $formattedNumber = sprintf(
                "%s %s/%d/%s",
                $document->document_type,
                $series->code,
                $series->year,
                str_pad((string)$sequence, 5, "0", STR_PAD_LEFT)
            );

            $status = $document->getInitialStatus();
            $paymentStatus = $document->getInitialPaymentStatus();

            $document->update([
                'status' => $status,
                'document_number' => $formattedNumber,
                'sequence_number' => $sequence,
                'payment_status' => $paymentStatus
            ]);

            // Movimentação física de stock conforme as regras de negócio do tipo de documento
            if ($warehouse) {
                $document->processStock($this->stockService, $warehouse);
            } else {
                if ($document->has_physical_products && in_array($document->document_type, ['FT', 'FR', 'NC', 'GR'])) {
                    throw new Exception("Um armazém de saída/entrada é obrigatório para confirmar este documento, pois contém itens físicos.");
                }
            }

            // Registo e atualização de saldos de conta corrente do cliente
            $document->processFinancial();

            return $document->load('items');
        });
    }

    /**
     * Regista pagamentos recebidos e faz a alocação amortizando as faturas de crédito em aberto (FIFO).
     */
    public function registerPayment(int $customerId, float $amount, string $method, ?string $reference = null): Payment
    {
        return DB::transaction(function () use ($customerId, $amount, $method, $reference) {
            $customer = Customer::lockForUpdate()->findOrFail($customerId);

            // Cria a transação de pagamento
            $payment = Payment::create([
                'company_id' => $customer->company_id,
                'customer_id' => $customer->id,
                'payment_method' => $method,
                'amount' => $amount,
                'payment_date' => date('Y-m-d'),
                'reference' => $reference,
                'created_by' => Auth::id()
            ]);

            // Deduz o saldo geral pendente do cliente
            $customer->decrement('balance', $amount);

            // Amortização das faturas pendentes por ordem de vencimento (FIFO)
            $remaining = $amount;
            $pendingInvoices = Document::where('customer_id', $customer->id)
                ->where('document_type', 'FT')
                ->whereIn('payment_status', ['unpaid', 'partial'])
                ->orderBy('due_date', 'asc')
                ->lockForUpdate()
                ->get();

            foreach ($pendingInvoices as $invoice) {
                if ($remaining <= 0) break;

                // Calcula o montante em dívida na fatura
                $alreadyPaid = PaymentAllocation::where('document_id', $invoice->id)->sum('amount_allocated');
                $dueInInvoice = $invoice->grand_total - $alreadyPaid;

                if ($dueInInvoice <= 0) continue;

                $allocationAmount = min($remaining, $dueInInvoice);
                
                // Cria o registo de alocação de liquidação
                PaymentAllocation::create([
                    'payment_id' => $payment->id,
                    'document_id' => $invoice->id,
                    'amount_allocated' => $allocationAmount
                ]);

                $remaining -= $allocationAmount;
                $newDue = $dueInInvoice - $allocationAmount;

                // Atualiza o estado da fatura individual
                $invoice->update([
                    'payment_status' => $newDue <= 0 ? 'paid' : 'partial',
                    'status' => $newDue <= 0 ? 'paid' : 'partial'
                ]);
            }

            return $payment->load('allocations');
        });
    }

    /**
     * Cancelamento / Estorno oficial de um documento.
     */
    public function cancel(int $documentId): Document
    {
        return DB::transaction(function () use ($documentId) {
            $document = Document::lockForUpdate()->findOrFail($documentId);

            if ($document->status === 'cancelled') {
                throw new Exception("Este documento já se encontra cancelado.");
            }

            // Se for rascunho, apenas cancelamos o estado
            if ($document->status === 'draft') {
                $document->update([
                    'status' => 'cancelled',
                    'cancelled_by' => Auth::id()
                ]);
                return $document;
            }

            // Descobrir qual armazém foi usado para a movimentação
            $warehouseId = StockMovement::where('source_type', 'document')
                ->where('source_id', $document->id)
                ->value('warehouse_id');

            $warehouse = $warehouseId ? Warehouse::find($warehouseId) : Warehouse::where('company_id', $document->company_id)->where('is_active', true)->first();

            if (!$warehouse && in_array($document->document_type, ['FT', 'FR', 'NC', 'GR'])) {
                throw new Exception("Não foi possível determinar o armazém para reverter os movimentos de stock.");
            }

            // Reverte a movimentação física de stock
            if ($warehouse) {
                $document->reverseStock($this->stockService, $warehouse);
            }

            // Reverte a atualização de saldos de conta corrente do cliente
            $document->reverseFinancial();

            // Atualiza status e registo de cancelamento
            $document->update([
                'status' => 'cancelled',
                'cancelled_by' => Auth::id()
            ]);

            return $document->load('items');
        });
    }

    /**
     * Atualização de um Rascunho Documental (Draft).
     */
    public function updateDraft(int $documentId, array $payload): Document
    {
        return DB::transaction(function () use ($documentId, $payload) {
            $document = Document::lockForUpdate()->findOrFail($documentId);

            if ($document->status !== 'draft') {
                throw new Exception("Apenas rascunhos podem ser editados.");
            }

            $document->update([
                'customer_id' => $payload['customer_id'] ?? null,
                'customer_name' => $payload['customer_name'] ?? 'Consumidor Final',
                'customer_nuit' => $payload['customer_nuit'] ?? '999999999',
                'customer_phone' => $payload['customer_phone'] ?? null,
                'customer_email' => $payload['customer_email'] ?? null,
                'customer_address' => $payload['customer_address'] ?? 'Maputo, Moçambique',
                'issue_date' => $payload['issue_date'] ?? $document->issue_date,
                'due_date' => $payload['due_date'] ?? $document->due_date,
                'notes' => $payload['notes'] ?? null,
            ]);

            // Limpa os itens antigos e insere os novos
            $document->items()->delete();

            if (!empty($payload['items'])) {
                foreach ($payload['items'] as $item) {
                    $this->addItem($document, $item);
                }
            }

            $this->recalculateTotals($document);

            return $document->load('items');
        });
    }
}
