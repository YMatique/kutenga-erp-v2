<?php

namespace App\Services\Inventory;

use App\Exceptions\InsufficientStockException;
use App\Models\Inventory\InventoryClosing;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class InventoryClosingService
{
    public function __construct(
        private StockService $stockService
    ) {}

    /**
     * Conclui o fecho e regulariza o stock com as diferenças contadas (contado − esperado no snapshot).
     * Usa a diferença e não a quantidade contada, para não apagar as vendas feitas depois do snapshot.
     * Itens por contar ficam de fora. Devolve o número de movimentos de ajuste gerados.
     *
     * O estado é relido com a linha bloqueada, pelo que o fecho nunca é aplicado duas vezes.
     */
    public function complete(InventoryClosing $closing): int
    {
        return DB::transaction(function () use ($closing) {
            $locked = InventoryClosing::lockForUpdate()->findOrFail($closing->id);

            if ($locked->isCompleted()) {
                throw ValidationException::withMessages(['status' => 'Este fechamento já foi concluído.']);
            }

            $locked->load(['items.product', 'items.warehouse']);

            $applied = 0;

            // O fecho ainda não está concluído, por isso os seus próprios ajustes não são bloqueados por ele
            foreach ($locked->items->sortBy(['warehouse_id', 'product_id']) as $item) {
                if ($item->quantity_counted === null || ! $item->product || ! $item->warehouse) {
                    continue;
                }

                $difference = round($item->variance_value, 2);

                if (abs($difference) < 0.01) {
                    continue;
                }

                try {
                    $this->stockService->adjust(
                        product: $item->product,
                        warehouse: $item->warehouse,
                        difference: $difference,
                        sourceType: InventoryClosing::class,
                        sourceId: $locked->id,
                        notes: "Fecho de inventário #{$locked->id} ({$locked->reference_date->format('d/m/Y')})"
                    );
                } catch (InsufficientStockException $e) {
                    throw ValidationException::withMessages([
                        'stock' => "O stock de {$item->product->name} ({$item->warehouse->name}) é {$e->available} e não comporta a diferença contada de {$difference}.",
                    ]);
                }

                $applied++;
            }

            $locked->update([
                'status' => 'completed',
                'completed_at' => now(),
            ]);

            return $applied;
        });
    }
}
