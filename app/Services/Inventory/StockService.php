<?php

namespace App\Services\Inventory;

use App\Models\Product;
use App\Models\StockMovement;
use App\Models\Warehouse;
use Illuminate\Support\Facades\Auth;

class StockService
{
      /* STOCK ATUAL (ledger-based)
     */
    public function getStock(Product $product, Warehouse $warehouse): float
    {
        $in = StockMovement::where('product_id', $product->id)
            ->where('warehouse_id', $warehouse->id)
            ->where('type', 'in')
            ->sum('quantity');

        $out = StockMovement::where('product_id', $product->id)
            ->where('warehouse_id', $warehouse->id)
            ->where('type', 'out')
            ->sum('quantity');

        return (float) ($in - $out);
    }

    /**
     * ENTRADA DE STOCK
     */
    public function in(
        Product $product,
        Warehouse $warehouse,
        float $quantity,
        ?string $sourceType = null,
        ?int $sourceId = null,
        ?string $notes = null
    ): StockMovement {
        return $this->recordMovement(
            $product,
            $warehouse,
            'in',
            $quantity,
            $sourceType,
            $sourceId,
            $notes
        );
    }

    /**
     * SAÍDA DE STOCK
     */
    public function out(
        Product $product,
        Warehouse $warehouse,
        float $quantity,
        ?string $sourceType = null,
        ?int $sourceId = null,
        ?string $notes = null
    ): StockMovement {

        $currentStock = $this->getStock($product, $warehouse);

        if ($currentStock < $quantity) {
            throw new \Exception(
                "Stock insuficiente. Disponível: {$currentStock}"
            );
        }

        return $this->recordMovement(
            $product,
            $warehouse,
            'out',
            $quantity,
            $sourceType,
            $sourceId,
            $notes
        );
    }

    /**
     * AJUSTE (CORRIGIDO)
     * - positivo = entrada
     * - negativo = saída
     */
    public function adjust(
        Product $product,
        Warehouse $warehouse,
        float $difference,
        ?string $sourceType = null,
        ?int $sourceId = null,
        ?string $notes = null
    ): StockMovement {

        $type = $difference >= 0 ? 'in' : 'out';

        return $this->recordMovement(
            $product,
            $warehouse,
            $type,
            abs($difference),
            $sourceType,
            $sourceId,
            $notes
        );
    }

    /**
     * MÉTODO CENTRAL (CORE DO ERP)
     */
    private function recordMovement(
        Product $product,
        Warehouse $warehouse,
        string $type,
        float $quantity,
        ?string $sourceType = null,
        ?int $sourceId = null,
        ?string $notes = null
    ): StockMovement {

        return DB::transaction(function () use (
            $product,
            $warehouse,
            $type,
            $quantity,
            $sourceType,
            $sourceId,
            $notes
        ) {
            return StockMovement::create([
                'company_id'   => $product->company_id,
                'product_id'   => $product->id,
                'warehouse_id' => $warehouse->id,
                'type'         => $type,
                'quantity'     => $quantity,
                'source_type'  => $sourceType,
                'source_id'    => $sourceId,
                'notes'        => $notes,
                'created_by'   => Auth::id(),
            ]);
        });
    }

    /**
     * STOCK POR TODOS ARMAZÉNS
     */
    public function getStockByWarehouses(Product $product): array
    {
        $warehouses = Warehouse::where('company_id', $product->company_id)->get();

        return $warehouses->map(function ($warehouse) use ($product) {
            return [
                'warehouse' => [
                    'id' => $warehouse->id,
                    'name' => $warehouse->name,
                ],
                'stock' => $this->getStock($product, $warehouse),
            ];
        })->values()->toArray();
    }
}