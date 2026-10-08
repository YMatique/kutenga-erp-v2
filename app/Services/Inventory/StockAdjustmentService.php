<?php

namespace App\Services\Inventory;

use App\Models\Inventory\StockAdjustment;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class StockAdjustmentService
{
    public function __construct(
        private StockService $stockService
    ) {}

    public function cancel(StockAdjustment $adjustment): void
    {
        DB::transaction(function () use ($adjustment) {
            $locked = StockAdjustment::lockForUpdate()->findOrFail($adjustment->id);

            if ($locked->status !== 'draft') {
                throw ValidationException::withMessages([
                    'status' => $locked->status === 'completed'
                        ? 'Não é possível cancelar um ajuste concluído.'
                        : 'O ajuste já está cancelado.',
                ]);
            }

            $locked->update([
                'status' => 'cancelled',
                'cancelled_by' => Auth::id(),
                'cancelled_at' => now(),
            ]);
        });
    }

    /**
     * Aplica um ajuste em rascunho. O estado é relido com a linha bloqueada: um ajuste
     * cancelado ou já concluído (mesmo que a instância recebida esteja desatualizada) é recusado.
     */
    public function complete(StockAdjustment $adjustment): void
    {
        DB::transaction(function () use ($adjustment) {
            $adjustment = StockAdjustment::lockForUpdate()->findOrFail($adjustment->id);

            if ($adjustment->status !== 'draft') {
                throw ValidationException::withMessages([
                    'status' => $adjustment->status === 'completed'
                        ? 'Ajuste já foi concluído.'
                        : 'Um ajuste cancelado não pode ser concluído.',
                ]);
            }

            $adjustment->load(['items.product', 'warehouse']);

            foreach ($adjustment->items as $item) {

                $difference = (float) $item->new_quantity - (float) $item->old_quantity;

                if (abs($difference) < 0.0001) {
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
