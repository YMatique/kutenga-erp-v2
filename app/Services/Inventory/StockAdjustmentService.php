<?php

namespace App\Services\Inventory;

use App\Models\StockAdjustment;
use Illuminate\Support\Facades\DB;

class StockAdjustmentService
{
    
    public function __construct(
        private StockService $stockService
    ) {}

    public function complete(StockAdjustment $adjustment): void
    {
        if ($adjustment->items->isEmpty()) {
            throw new \Exception("Ajuste sem itens.");
        }

        DB::transaction(function () use ($adjustment) {

            foreach ($adjustment->items as $item) {

                $difference = $item->difference;

                if ($difference > 0) {
                    $this->stockService->in(
                        product: $item->product,
                        warehouse: $adjustment->warehouse,
                        quantity: $difference,
                        sourceType: StockAdjustment::class,
                        sourceId: $adjustment->id,
                        notes: "Ajuste #{$adjustment->id}"
                    );
                }

                if ($difference < 0) {
                    $this->stockService->out(
                        product: $item->product,
                        warehouse: $adjustment->warehouse,
                        quantity: abs($difference),
                        sourceType: StockAdjustment::class,
                        sourceId: $adjustment->id,
                        notes: "Ajuste #{$adjustment->id}"
                    );
                }
            }

            $adjustment->update([
                'status' => 'completed'
            ]);
        });
    }
}
