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

            // Depois de uma receção parcial, o que falta resolve-se ao receber (perda ou devolução), não ao cancelar
            if ($locked->items->contains(fn ($item) => (float) ($item->received_quantity ?? 0) > 0 || $item->shortage_action !== null)) {
                throw ValidationException::withMessages([
                    'status' => 'Esta transferência já foi recebida em parte. Receba o que falta e escolha a perda ou a devolução à origem.',
                ]);
            }

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

                // O destino passa a ter a linha (a zero) para a mercadoria a caminho aparecer lá como "a chegar"
                $this->stockService->ensureLine($item->product, $locked->toWarehouse);
            }

            $locked->update(['status' => 'in_transit', 'shipped_at' => now(), 'shipped_by' => Auth::id()]);
        });
    }

    /**
     * Recebe (parte de) uma transferência em trânsito: a mercadoria entra no armazém de destino.
     *
     * A quantidade indicada de cada produto é a que chegou *agora* (por omissão, tudo o que ainda falta
     * receber), e soma-se ao que já tinha chegado antes. O que continua em falta tem, para cada produto,
     * um destino à escolha: "pending" (o resto ainda vem a caminho: a transferência continua em trânsito
     * e pode receber-se mais tarde), "loss" (perda em trânsito, o stock já tinha saído da origem) ou
     * "return" (volta à origem). Sem escolha, a diferença é uma perda. A transferência fica concluída
     * quando já não há nada a caminho de nenhum produto.
     *
     * @param  array<int|string, float|int|string>  $received  quantidade chegada agora, por id do item
     * @param  array<int|string, string>  $shortage  destino do que continua em falta, por id do item
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

            $closed = [];
            $stillOnTheWay = false;
            $changed = false;

            foreach ($locked->items->sortBy('product_id') as $item) {
                $sent = (float) $item->quantity;
                $remaining = $item->remaining;
                $got = round((float) ($received[$item->id] ?? $remaining), 3);

                if ($got < 0 || $got > $remaining) {
                    throw ValidationException::withMessages([
                        'received' => "A quantidade recebida de {$item->product->name} tem de estar entre 0 e {$remaining}.",
                    ]);
                }

                if ($got > 0) {
                    $total = round((float) ($item->received_quantity ?? 0) + $got, 3);

                    $this->stockService->in(
                        product: $item->product,
                        warehouse: $locked->toWarehouse,
                        quantity: $got,
                        sourceType: StockTransfer::class,
                        sourceId: $locked->id,
                        notes: "Transferência #{$locked->id} recebida de {$locked->fromWarehouse->name} em {$locked->toWarehouse->name}".($total < $sent ? ' (receção parcial)' : '')
                    );

                    $item->received_quantity = $total;
                    $changed = true;
                }

                // O que ainda falta deste produto, se já não estava resolvido
                $missing = round($sent - (float) ($item->received_quantity ?? 0), 3);

                if ($item->shortage_action === null && $missing > 0) {
                    $action = $shortage[$item->id] ?? 'loss';

                    if (! in_array($action, ['loss', 'return', 'pending'], true)) {
                        throw ValidationException::withMessages([
                            'shortage' => "O destino da diferença de {$item->product->name} tem de ser perda, devolução à origem ou ainda a caminho.",
                        ]);
                    }

                    if ($action === 'pending') {
                        $stillOnTheWay = true;
                    } else {
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

                        $item->shortage_action = $action;
                        $changed = true;
                        $closed[] = "{$item->product->name}: enviadas {$sent}, recebidas ".(float) ($item->received_quantity ?? 0).', '.($action === 'return'
                            ? "{$missing} devolvidas à origem"
                            : "perda de {$missing}");
                    }
                }

                $item->save();
            }

            // Uma receção que não recebe nada nem resolve nada não faria mais do que deixar um registo vazio
            if (! $changed) {
                throw ValidationException::withMessages([
                    'received' => 'Indique o que chegou, ou o que fazer ao que falta (perda ou devolução).',
                ]);
            }

            if (! $stillOnTheWay) {
                $locked->update(['status' => 'completed', 'received_at' => now(), 'received_by' => Auth::id()]);
            }

            if ($closed) {
                SystemNotification::create([
                    'company_id' => $locked->company_id,
                    'type' => 'transfer_discrepancy',
                    'title' => 'Diferença numa transferência',
                    'message' => "A transferência #{$locked->id} chegou a {$locked->toWarehouse->name} com diferenças: ".implode('; ', $closed).'.',
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
