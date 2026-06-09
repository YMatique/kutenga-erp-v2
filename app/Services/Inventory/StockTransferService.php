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

        $transfer->load(['items.product', 'fromWarehouse', 'toWarehouse']);

        DB::transaction(function () use ($transfer) {

            foreach ($transfer->items as $item) {

                // 🔒 LOCK do stock origem
                $stockRow = $this->stockService->lockStock(
                    $item->product,
                    $transfer->fromWarehouse
                );

                $currentStock = $stockRow?->quantity ?? 0;

                // ❌ validação imediata por item
                if ($currentStock < $item->quantity) {
                    throw ValidationException::withMessages([
                        'stock' => "Stock insuficiente para {$item->product->name}. Disponível: {$currentStock}"
                    ]);
                }

                // 🚚 SAÍDA (origem)
                $this->stockService->out(
                    product: $item->product,
                    warehouse: $transfer->fromWarehouse,
                    quantity: $item->quantity,
                    sourceType: StockTransfer::class,
                    sourceId: $transfer->id,
                    notes: "Transferência #{$transfer->id}"
                );

                // 📥 ENTRADA (destino)
                $this->stockService->in(
                    product: $item->product,
                    warehouse: $transfer->toWarehouse,
                    quantity: $item->quantity,
                    sourceType: StockTransfer::class,
                    sourceId: $transfer->id,
                    notes: "Transferência #{$transfer->id}"
                );
            }

            // ✔ finalizar apenas se tudo correr bem
            $transfer->update([
                'status' => 'completed'
            ]);
        });
    } 
}
