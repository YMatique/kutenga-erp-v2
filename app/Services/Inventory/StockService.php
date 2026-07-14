<?php

namespace App\Services\Inventory;

use App\Models\Product;
use App\Models\ProductStock;
use App\Models\StockMovement;
use App\Models\Warehouse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class StockService
{
    /*
    |--------------------------------------------------------------------------
    | STOCK (CACHE - leitura rápida)
    |--------------------------------------------------------------------------
    */

    public function getStock(Product $product, Warehouse $warehouse): float
    {
        return (float) ProductStock::where('company_id', $product->company_id)
            ->where('product_id', $product->id)
            ->where('warehouse_id', $warehouse->id)
            ->value('quantity') ?? 0;
    }

    public function getTotalStock(Product $product): float
    {
        return (float) ProductStock::where('company_id', $product->company_id)
            ->where('product_id', $product->id)
            ->sum('quantity');
    }

    public function getStockByWarehouses(Product $product): array
    {
        $stocks = ProductStock::where('company_id', $product->company_id)
            ->where('product_id', $product->id)
            ->with('warehouse')
            ->get();

        return $stocks->map(function ($stock) {
            return [
                'warehouse' => [
                    'id' => $stock->warehouse->id,
                    'name' => $stock->warehouse->name,
                ],
                'stock' => (float) $stock->quantity,
            ];
        })->values()->toArray();
    }

    /*
    |--------------------------------------------------------------------------
    | ENTRADA DE STOCK
    |--------------------------------------------------------------------------
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

    /*
    |--------------------------------------------------------------------------
    | SAÍDA DE STOCK
    |--------------------------------------------------------------------------
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

    /*
    |--------------------------------------------------------------------------
    | AJUSTE
    |--------------------------------------------------------------------------
    */

    public function adjust(
        Product $product,
        Warehouse $warehouse,
        float $difference,
        ?string $sourceType = null,
        ?int $sourceId = null,
        ?string $notes = null
    ): StockMovement {

        return $this->recordMovement(
            $product,
            $warehouse,
            'adjustment',
            $difference,
            $sourceType,
            $sourceId,
            $notes
        );
    }

    /*
    |--------------------------------------------------------------------------
    | CORE DO SISTEMA (MOVIMENTO + ATUALIZAÇÃO DE STOCK)
    |--------------------------------------------------------------------------
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

            // 1. Criar movimento (fonte da verdade)
            $movement = StockMovement::create([
                'company_id' => $product->company_id,
                'product_id' => $product->id,
                'warehouse_id' => $warehouse->id,
                'type' => $type,
                'quantity' => $quantity,
                'source_type' => $sourceType,
                'source_id' => $sourceId,
                'notes' => $notes,
                'created_by' => Auth::id(),
            ]);

            // 2. Atualizar cache de stock
            $this->updateProductStock($movement);

            return $movement;
        });
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE DO STOCK CACHE
    |--------------------------------------------------------------------------
    */

    private function updateProductStock(StockMovement $movement): void
    {
        $stock = ProductStock::firstOrCreate([
            'company_id' => $movement->company_id,
            'product_id' => $movement->product_id,
            'warehouse_id' => $movement->warehouse_id,
        ]);

        $delta = match ($movement->type) {
            'in' => $movement->quantity,
            'out' => -$movement->quantity,
            'adjustment' => $movement->quantity,
            'opening' => $movement->quantity,
            default => 0,
        };

        $stock->quantity += $delta;
        $stock->save();

        // Immediate verification of limits (low stock & out of stock)
        $product = Product::find($movement->product_id);
        if ($product && $product->track_stock) {
            $totalStock = ProductStock::where('product_id', $product->id)->sum('quantity');

            if ($totalStock <= 0) {
                // Out of stock
                $exists = \App\Models\SystemNotification::where('company_id', $product->company_id)
                    ->where('type', 'out_of_stock')
                    ->where('link', "/products/{$product->id}")
                    ->where('is_read', false)
                    ->exists();

                if (!$exists) {
                    \App\Models\SystemNotification::create([
                        'company_id' => $product->company_id,
                        'type' => 'out_of_stock',
                        'title' => 'Stock Esgotado',
                        'message' => "O produto {$product->name} esgotou em todos os armazéns. Stock Atual: 0.",
                        'link' => "/products/{$product->id}",
                        'is_read' => false,
                    ]);
                }

                // Resolve low stock notification
                \App\Models\SystemNotification::where('company_id', $product->company_id)
                    ->where('type', 'low_stock')
                    ->where('link', "/products/{$product->id}")
                    ->where('is_read', false)
                    ->update(['is_read' => true]);

            } elseif (!is_null($product->min_stock) && $totalStock <= $product->min_stock) {
                // Low stock
                $exists = \App\Models\SystemNotification::where('company_id', $product->company_id)
                    ->where('type', 'low_stock')
                    ->where('link', "/products/{$product->id}")
                    ->where('is_read', false)
                    ->exists();

                if (!$exists) {
                    \App\Models\SystemNotification::create([
                        'company_id' => $product->company_id,
                        'type' => 'low_stock',
                        'title' => 'Stock Mínimo Atingido',
                        'message' => "O produto {$product->name} atingiu ou desceu abaixo do limite mínimo ({$product->min_stock}). Stock Atual: {$totalStock}.",
                        'link' => "/products/{$product->id}",
                        'is_read' => false,
                    ]);
                }

                // Resolve out of stock notification (since stock is > 0 now)
                \App\Models\SystemNotification::where('company_id', $product->company_id)
                    ->where('type', 'out_of_stock')
                    ->where('link', "/products/{$product->id}")
                    ->where('is_read', false)
                    ->update(['is_read' => true]);

            } else {
                // Healthy stock -> resolve both alerts
                \App\Models\SystemNotification::where('company_id', $product->company_id)
                    ->whereIn('type', ['low_stock', 'out_of_stock'])
                    ->where('link', "/products/{$product->id}")
                    ->where('is_read', false)
                    ->update(['is_read' => true]);
            }
        }
    }

    public function lockStock(Product $product, Warehouse $warehouse)
    {
        return ProductStock::where('product_id', $product->id)
            ->where('warehouse_id', $warehouse->id)
            ->lockForUpdate()
            ->first();
    }

    public function opening(
        Product $product,
        Warehouse $warehouse,
        float $quantity,
        ?string $notes = null
    ): StockMovement {

     if ($this->openingExists($product, $warehouse)) {
        throw new \Exception("Stock inicial já foi definido para este produto neste armazém.");
    }
        return $this->recordMovement(
            $product,
            $warehouse,
            'opening',
            $quantity,
            'opening_stock',
            null,
            $notes
        );
    }

    public function openingExists(Product $product, Warehouse $warehouse): bool
    {
        return StockMovement::where('product_id', $product->id)
            ->where('warehouse_id', $warehouse->id)
            ->where('type', 'opening')
            ->exists();
    }
}
