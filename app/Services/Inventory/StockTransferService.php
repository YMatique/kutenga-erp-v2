<?php

namespace App\Services\Inventory;

use App\Models\StockTransfer;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class StockTransferService
{
    public function __construct(
        private StockService $stockService
    ) {}

    public function complete(StockTransfer $transfer): void
    {
        if ($transfer->status === 'completed') {
            throw new \Exception("Transferência já foi concluída.");
        }

        DB::transaction(function () use ($transfer) {

            // 1. VALIDAR STOCK ANTES DE FAZER QUALQUER MOVIMENTO
            foreach ($transfer->items as $item) {

                $currentStock = $this->stockService->getStock(
                    $item->product,
                    $transfer->fromWarehouse
                );

                if ($currentStock < $item->quantity) {
                    throw ValidationException::withMessages([
                        'stock' => "Stock insuficiente para {$item->product->name}. Disponível: {$currentStock}"
                    ]);
                }
            }

            // 2. EXECUTAR MOVIMENTOS
            foreach ($transfer->items as $item) {

                // SAÍDA
                $this->stockService->out(
                    product: $item->product,
                    warehouse: $transfer->fromWarehouse,
                    quantity: $item->quantity,
                    sourceType: StockTransfer::class,
                    sourceId: $transfer->id,
                    notes: "Transferência #{$transfer->id}"
                );

                // ENTRADA
                $this->stockService->in(
                    product: $item->product,
                    warehouse: $transfer->toWarehouse,
                    quantity: $item->quantity,
                    sourceType: StockTransfer::class,
                    sourceId: $transfer->id,
                    notes: "Transferência #{$transfer->id}"
                );
            }

            // 3. FINALIZAR TRANSFERÊNCIA
            $transfer->update([
                'status' => 'completed'
            ]);
        });
    }
}
