<?php

namespace App\Services\Inventory;

use App\Models\Inventory\StockAdjustment;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class StockAdjustmentService
{
    public function __construct(
        private StockService $stockService
    ) {}

    public function complete(StockAdjustment $adjustment): void
    {
        if ($adjustment->status === 'completed') {
            throw new \Exception('Ajuste já foi concluído.');
        }

        $adjustment->load(['items.product', 'warehouse']);

        DB::transaction(function () use ($adjustment) {

            foreach ($adjustment->items as $item) {

                $difference = $item->new_quantity - $item->old_quantity;

                if ($difference === 0) {
                    continue;
                }

                $reasonLabel = match ($adjustment->reason) {
                    'physical_count' => 'Contagem Física',
                    'damaged' => 'Produto Danificado',
                    'loss' => 'Perda',
                    'correction' => 'Correção',
                    default => 'Outro',
                };

                $this->stockService->adjust(
                    product: $item->product,
                    warehouse: $adjustment->warehouse,
                    difference: $difference,
                    sourceType: StockAdjustment::class,
                    sourceId: $adjustment->id,
                    notes: "Ajuste #{$adjustment->id} - {$reasonLabel}"
                );
            }

            $adjustment->update([
                'status' => 'completed',
                'completed_by' => Auth::id(),
                'completed_at' => now(),
            ]);
        });
    }
}
