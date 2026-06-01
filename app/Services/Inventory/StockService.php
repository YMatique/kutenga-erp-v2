<?php

namespace App\Services\Inventory;

use App\Models\Product;
use App\Models\StockMovement;
use App\Models\Warehouse;
use Illuminate\Support\Facades\Auth;

class StockService
{
    /**
     * Create a new class instance.
     */
    public function __construct()
    {
        //
    }

     /**
     * Retorna o stock atual de um produto num armazém.
     */
    public function getStock(
        Product $product,
        Warehouse $warehouse
    ): float {

        $in = StockMovement::query()
            ->where('product_id', $product->id)
            ->where('warehouse_id', $warehouse->id)
            ->whereIn('type', ['in', 'adjustment'])
            ->sum('quantity');

        $out = StockMovement::query()
            ->where('product_id', $product->id)
            ->where('warehouse_id', $warehouse->id)
            ->where('type', 'out')
            ->sum('quantity');

        return (float) ($in - $out);
    }

    /**
     * Entrada de stock.
     */
    public function in(
        Product $product,
        Warehouse $warehouse,
        float $quantity,
        ?string $sourceType = null,
        ?int $sourceId = null,
        ?string $notes = null
    ): StockMovement {

        return StockMovement::create([
            'company_id'   => $product->company_id,
            'product_id'   => $product->id,
            'warehouse_id' => $warehouse->id,
            'type'         => 'in',
            'quantity'     => $quantity,
            'source_type'  => $sourceType,
            'source_id'    => $sourceId,
            'notes'        => $notes,
            'created_by'   => Auth::id(),
        ]);
    }

    /**
     * Saída de stock.
     */
    public function out(
        Product $product,
        Warehouse $warehouse,
        float $quantity,
        ?string $sourceType = null,
        ?int $sourceId = null,
        ?string $notes = null
    ): StockMovement {

        $currentStock = $this->getStock(
            $product,
            $warehouse
        );

        if ($currentStock < $quantity) {
            throw new \Exception(
                "Stock insuficiente. Disponível: {$currentStock}"
            );
        }

        return StockMovement::create([
            'company_id'   => $product->company_id,
            'product_id'   => $product->id,
            'warehouse_id' => $warehouse->id,
            'type'         => 'out',
            'quantity'     => $quantity,
            'source_type'  => $sourceType,
            'source_id'    => $sourceId,
            'notes'        => $notes,
            'created_by'   => Auth::id(),
        ]);
    }

    /**
     * Ajuste manual.
     */
    public function adjust(
        Product $product,
        Warehouse $warehouse,
        float $difference,
        ?string $sourceType = null,
        ?int $sourceId = null,
        ?string $notes = null
    ): StockMovement {

        return StockMovement::create([
            'company_id'   => $product->company_id,
            'product_id'   => $product->id,
            'warehouse_id' => $warehouse->id,
            'type'         => 'adjustment',
            'quantity'     => $difference,
            'source_type'  => $sourceType,
            'source_id'    => $sourceId,
            'notes'        => $notes,
            'created_by'   => Auth::id(),
        ]);
    }
}
