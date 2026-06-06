<?php

namespace App\Services\Inventory;

use App\Models\StockAdjustment;
use Illuminate\Support\Facades\DB;

class StockAdjustmentService
{
    
    public function __construct(
        private StockService $stockService
    ) {}

    // public function complete(StockAdjustment $adjustment): void
    // {
    //     if ($adjustment->items->isEmpty()) {
    //         throw new \Exception("Ajuste sem itens.");
    //     }

    //     DB::transaction(function () use ($adjustment) {

    //         foreach ($adjustment->items as $item) {

    //             $difference = $item->difference;

    //             if ($difference > 0) {
    //                 $this->stockService->in(
    //                     product: $item->product,
    //                     warehouse: $adjustment->warehouse,
    //                     quantity: $difference,
    //                     sourceType: StockAdjustment::class,
    //                     sourceId: $adjustment->id,
    //                     notes: "Ajuste #{$adjustment->id}"
    //                 );
    //             }

    //             if ($difference < 0) {
    //                 $this->stockService->out(
    //                     product: $item->product,
    //                     warehouse: $adjustment->warehouse,
    //                     quantity: abs($difference),
    //                     sourceType: StockAdjustment::class,
    //                     sourceId: $adjustment->id,
    //                     notes: "Ajuste #{$adjustment->id}"
    //                 );
    //             }
    //         }

    //         $adjustment->update([
    //             'status' => 'completed'
    //         ]);
    //     });
    // }
     public function complete(StockAdjustment $adjustment): void
    {
        if ($adjustment->status === 'completed') {
            throw new \Exception("Ajuste já foi concluído.");
        }

        $adjustment->load(['items.product', 'warehouse']);

        DB::transaction(function () use ($adjustment) {

            foreach ($adjustment->items as $item) {

                // stock atual no sistema
                $currentStock = $this->stockService->getStock(
                    $item->product,
                    $adjustment->warehouse
                );

                // validação opcional (pode remover se quiser permitir ajuste livre)
                // if ($currentStock != $item->old_quantity) {
                //     throw ValidationException::withMessages([
                //         'stock' => "Stock mudou para {$item->product->name}"
                //     ]);
                // }

                $difference = $item->new_quantity - $item->old_quantity;

                if ($difference == 0) {
                    continue;
                }

                // REGISTA MOVIMENTO REAL
                $this->stockService->adjust(
                    product: $item->product,
                    warehouse: $adjustment->warehouse,
                    difference: $difference,
                    sourceType: StockAdjustment::class,
                    sourceId: $adjustment->id,
                    notes: "Ajuste #{$adjustment->id}"
                );
            }

            $adjustment->update([
                'status' => 'completed'
            ]);
        });
    }
}
