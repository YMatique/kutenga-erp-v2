<?php

namespace App\Services\Inventory;

use App\Exceptions\InsufficientStockException;
use App\Models\Inventory\StockTransfer;
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

    public function cancel(StockTransfer $transfer): void
    {
        $this->transition($transfer, from: ['pending', 'approved'], to: 'cancelled', error: 'Só é possível cancelar transferências pendentes ou aprovadas.');
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
