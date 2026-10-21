<?php

namespace App\Services\Inventory;

use App\Exceptions\InsufficientStockException;
use App\Models\Inventory\StockTransfer;
use App\Models\SystemNotification;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class StockTransferService
{
    public function __construct(
        private StockService $stockService
    ) {}

    /**
     * Aprova uma transferência pendente e reserva o stock na origem: só passa se, para cada produto,
     * o disponível (saldo menos o reservado por outras transferências aprovadas) chegar. Enquanto
     * estiver aprovada, essa quantidade não pode ser vendida nem movida por outros.
     */
    public function approve(StockTransfer $transfer): void
    {
        DB::transaction(function () use ($transfer) {
            $locked = StockTransfer::lockForUpdate()->findOrFail($transfer->id);

            if ($locked->status !== 'pending') {
                throw ValidationException::withMessages(['status' => 'Apenas transferências pendentes podem ser aprovadas.']);
            }

            $locked->load(['items.product', 'fromWarehouse']);

            // Mesma ordem de produtos que ao concluir: aprovações simultâneas não se bloqueiam mutuamente
            foreach ($locked->items->sortBy('product_id') as $item) {
                $available = $this->stockService->availableForUpdate($item->product, $locked->fromWarehouse);

                if ($available < (float) $item->quantity) {
                    throw ValidationException::withMessages([
                        'stock' => "Stock disponível insuficiente para {$item->product->name} em {$locked->fromWarehouse->name}. Disponível: {$available}, pedido: ".(float) $item->quantity.'.',
                    ]);
                }
            }

            $locked->update(['status' => 'approved']);
        });
    }

    /**
     * Cancela uma transferência. Pendente ou aprovada ainda não moveu stock (cancelar liberta a reserva).
     * Em trânsito já saiu da origem: cancelar devolve a mercadoria à origem.
     */
    public function cancel(StockTransfer $transfer): void
    {
        DB::transaction(function () use ($transfer) {
            $locked = StockTransfer::lockForUpdate()->findOrFail($transfer->id);

            if (in_array($locked->status, ['pending', 'approved'], true)) {
                $locked->update(['status' => 'cancelled']);

                return;
            }

            if ($locked->status !== 'in_transit') {
                throw ValidationException::withMessages([
                    'status' => 'Só é possível cancelar transferências pendentes, aprovadas ou em trânsito.',
                ]);
            }

            $locked->load(['items.product', 'fromWarehouse', 'toWarehouse']);

            $note = "Transferência #{$locked->id} para {$locked->toWarehouse->name} devolvida a {$locked->fromWarehouse->name}";

            foreach ($locked->items->sortBy('product_id') as $item) {
                $this->stockService->in(
                    product: $item->product,
                    warehouse: $locked->fromWarehouse,
                    quantity: (float) $item->quantity,
                    sourceType: StockTransfer::class,
                    sourceId: $locked->id,
                    notes: $note
                );
            }

            $locked->update(['status' => 'cancelled']);
        });
    }

    /**
     * Envia uma transferência aprovada: a mercadoria sai da origem e fica em trânsito (não está em
     * nenhum armazém) até ser recebida. A reserva acaba, porque o stock já saiu.
     */
    public function ship(StockTransfer $transfer): void
    {
        DB::transaction(function () use ($transfer) {
            $locked = StockTransfer::lockForUpdate()->findOrFail($transfer->id);

            if ($locked->status !== 'approved') {
                throw ValidationException::withMessages([
                    'status' => $locked->status === 'in_transit'
                        ? 'A transferência já está em trânsito.'
                        : 'Só é possível enviar transferências aprovadas.',
                ]);
            }

            $locked->load(['items.product', 'fromWarehouse', 'toWarehouse']);

            $note = "Transferência #{$locked->id} enviada de {$locked->fromWarehouse->name} para {$locked->toWarehouse->name} (em trânsito)";

            // Mesma ordem de produtos que nas outras operações: duas transferências em sentidos opostos não se bloqueiam
            foreach ($locked->items->sortBy('product_id') as $item) {
                try {
                    $this->stockService->out(
                        product: $item->product,
                        warehouse: $locked->fromWarehouse,
                        quantity: (float) $item->quantity,
                        sourceType: StockTransfer::class,
                        sourceId: $locked->id,
                        notes: $note
                    );
                } catch (InsufficientStockException $e) {
                    throw ValidationException::withMessages([
                        'stock' => "Stock insuficiente para {$item->product->name}. Disponível: {$e->available}",
                    ]);
                }
            }

            $locked->update(['status' => 'in_transit', 'shipped_at' => now(), 'shipped_by' => Auth::id()]);
        });
    }

    /**
     * Recebe uma transferência em trânsito: a mercadoria entra no armazém de destino. A quantidade
     * recebida de cada produto pode ser menor do que a enviada (por omissão, é a enviada). O que
     * falta fica registado e avisa-se o utilizador; para cada produto escolhe-se o seu destino:
     * "loss" (perda em trânsito, o stock já tinha saído da origem) ou "return" (volta à origem).
     *
     * @param  array<int|string, float|int|string>  $received  quantidade recebida por id do item
     * @param  array<int|string, string>  $shortage  destino da diferença por id do item ("loss" por omissão)
     */
    public function receive(StockTransfer $transfer, array $received = [], array $shortage = []): void
    {
        DB::transaction(function () use ($transfer, $received, $shortage) {
            $locked = StockTransfer::lockForUpdate()->findOrFail($transfer->id);

            if ($locked->status !== 'in_transit') {
                throw ValidationException::withMessages([
                    'status' => $locked->status === 'completed'
                        ? 'A transferência já foi recebida.'
                        : 'Só é possível receber transferências em trânsito.',
                ]);
            }

            $locked->load(['items.product', 'fromWarehouse', 'toWarehouse']);

            $note = "Transferência #{$locked->id} recebida de {$locked->fromWarehouse->name} em {$locked->toWarehouse->name}";
            $shortages = [];

            foreach ($locked->items->sortBy('product_id') as $item) {
                $sent = (float) $item->quantity;
                $got = round((float) ($received[$item->id] ?? $sent), 3);

                if ($got < 0 || $got > $sent) {
                    throw ValidationException::withMessages([
                        'received' => "A quantidade recebida de {$item->product->name} tem de estar entre 0 e {$sent}.",
                    ]);
                }

                if ($got > 0) {
                    $this->stockService->in(
                        product: $item->product,
                        warehouse: $locked->toWarehouse,
                        quantity: $got,
                        sourceType: StockTransfer::class,
                        sourceId: $locked->id,
                        notes: $note
                    );
                }

                $action = null;

                if ($got < $sent) {
                    $missing = round($sent - $got, 3);
                    $action = $shortage[$item->id] ?? 'loss';

                    if (! in_array($action, ['loss', 'return'], true)) {
                        throw ValidationException::withMessages([
                            'shortage' => "O destino da diferença de {$item->product->name} tem de ser perda ou devolução à origem.",
                        ]);
                    }

                    if ($action === 'return') {
                        $this->stockService->in(
                            product: $item->product,
                            warehouse: $locked->fromWarehouse,
                            quantity: $missing,
                            sourceType: StockTransfer::class,
                            sourceId: $locked->id,
                            notes: "Diferença da transferência #{$locked->id} devolvida a {$locked->fromWarehouse->name}"
                        );
                    }

                    $shortages[] = "{$item->product->name}: enviadas {$sent}, recebidas {$got}, ".($action === 'return'
                        ? "{$missing} devolvidas à origem"
                        : "perda de {$missing}");
                }

                $item->update(['received_quantity' => $got, 'shortage_action' => $action]);
            }

            $locked->update(['status' => 'completed', 'received_at' => now(), 'received_by' => Auth::id()]);

            if ($shortages) {
                SystemNotification::create([
                    'company_id' => $locked->company_id,
                    'type' => 'transfer_discrepancy',
                    'title' => 'Diferença numa transferência',
                    'message' => "A transferência #{$locked->id} chegou a {$locked->toWarehouse->name} com diferenças: ".implode('; ', $shortages).'.',
                    'link' => "/inventory/transfers/{$locked->id}",
                    'is_read' => false,
                ]);
            }
        });
    }

    /**
     * Conclui uma transferência aprovada: saída na origem e entrada no destino, tudo ou nada.
     *
     * O estado é relido com a linha bloqueada, pelo que dois pedidos simultâneos (ou um duplo clique)
     * nunca movem o stock duas vezes, mesmo que tenham carregado a transferência antes de ela ser concluída.
     */
    public function complete(StockTransfer $transfer): void
    {
        DB::transaction(function () use ($transfer) {
            $locked = StockTransfer::lockForUpdate()->findOrFail($transfer->id);

            if ($locked->status !== 'approved') {
                throw ValidationException::withMessages([
                    'status' => $locked->status === 'completed'
                        ? 'Transferência já foi concluída.'
                        : 'Só é possível concluir transferências aprovadas.',
                ]);
            }

            $locked->load(['items.product', 'fromWarehouse', 'toWarehouse']);

            $note = "Transferência #{$locked->id} de {$locked->fromWarehouse->name} para {$locked->toWarehouse->name}";

            // Ordem estável de produtos: duas transferências em sentidos opostos não se bloqueiam mutuamente
            foreach ($locked->items->sortBy('product_id') as $item) {
                try {
                    $this->stockService->out(
                        product: $item->product,
                        warehouse: $locked->fromWarehouse,
                        quantity: (float) $item->quantity,
                        sourceType: StockTransfer::class,
                        sourceId: $locked->id,
                        notes: $note
                    );
                } catch (InsufficientStockException $e) {
                    throw ValidationException::withMessages([
                        'stock' => "Stock insuficiente para {$item->product->name}. Disponível: {$e->available}",
                    ]);
                }

                $this->stockService->in(
                    product: $item->product,
                    warehouse: $locked->toWarehouse,
                    quantity: (float) $item->quantity,
                    sourceType: StockTransfer::class,
                    sourceId: $locked->id,
                    notes: $note
                );
            }

            $locked->update(['status' => 'completed']);
        });
    }

    /** Muda o estado só se, com a linha bloqueada, ainda estiver num dos estados de partida. */
    private function transition(StockTransfer $transfer, array $from, string $to, string $error): void
    {
        DB::transaction(function () use ($transfer, $from, $to, $error) {
            $locked = StockTransfer::lockForUpdate()->findOrFail($transfer->id);

            if (! in_array($locked->status, $from, true)) {
                throw ValidationException::withMessages(['status' => $error]);
            }

            $locked->update(['status' => $to]);
        });
    }
}
