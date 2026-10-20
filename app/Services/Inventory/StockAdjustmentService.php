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

                $reasonLabel = match ($adjustment->reason) {
                    'physical_count' => 'Contagem Física',
                    'damaged' => 'Produto Danificado',
                    'loss' => 'Perda',
                    'correction' => 'Correção',
                    default => 'Outro',
                };

                // O saldo de partida é o de agora, não o do rascunho: vendas feitas entretanto
                // não podem fazer o stock final divergir da quantidade indicada.
                $movement = $this->stockService->adjustTo(
                    product: $item->product,
                    warehouse: $adjustment->warehouse,
                    targetQuantity: (float) $item->new_quantity,
                    sourceType: StockAdjustment::class,
                    sourceId: $adjustment->id,
                    notes: "Ajuste #{$adjustment->id} - {$reasonLabel}"
                );

                // Regista no item o que realmente foi aplicado
                $difference = $movement ? (float) $movement->quantity : 0.0;

                $item->update([
                    'old_quantity' => (float) $item->new_quantity - $difference,
                    'difference' => $difference,
                ]);
            }

            $adjustment->update([
                'status' => 'completed',
                'completed_by' => Auth::id(),
                'completed_at' => now(),
            ]);
        });
    }
}
