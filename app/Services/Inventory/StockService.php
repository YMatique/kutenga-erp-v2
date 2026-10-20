<?php

namespace App\Services\Inventory;

use App\Exceptions\BusinessRuleException;
use App\Exceptions\InsufficientStockException;
use App\Mail\LowStockAlertMail;
use App\Models\Catalog\Product;
use App\Models\Company;
use App\Models\Inventory\InventoryClosing;
use App\Models\Inventory\ProductStock;
use App\Models\Inventory\StockMovement;
use App\Models\Inventory\Warehouse;
use App\Models\SystemNotification;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

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

        // O saldo é verificado dentro da transação, com a linha de stock bloqueada,
        // para que duas saídas simultâneas não passem ambas pela mesma verificação.
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

    /**
     * Acerta o saldo para a quantidade indicada, calculando a diferença contra o saldo
     * atual (lido com a linha bloqueada), nunca contra uma contagem antiga.
     * Devolve null quando o saldo já é o pretendido.
     */
    public function adjustTo(
        Product $product,
        Warehouse $warehouse,
        float $targetQuantity,
        ?string $sourceType = null,
        ?int $sourceId = null,
        ?string $notes = null
    ): ?StockMovement {
        return DB::transaction(function () use ($product, $warehouse, $targetQuantity, $sourceType, $sourceId, $notes) {
            $stock = $this->lockedStockRow($product, $warehouse);

            $difference = round($targetQuantity - (float) $stock->quantity, 2);

            if (abs($difference) < 0.01) {
                return null;
            }

            return $this->adjust($product, $warehouse, $difference, $sourceType, $sourceId, $notes);
        });
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

        if (in_array($type, ['in', 'out'], true) && $quantity <= 0) {
            throw new \InvalidArgumentException('A quantidade do movimento tem de ser positiva.');
        }

        return DB::transaction(function () use (
            $product,
            $warehouse,
            $type,
            $quantity,
            $sourceType,
            $sourceId,
            $notes
        ) {

            // 0. Bloquear a linha de stock (criando-a se for a primeira vez) até ao fim da transação
            $stock = $this->lockedStockRow($product, $warehouse);

            $this->assertNotBlockedByClosing($product, $warehouse);

            if ($type === 'out' && (float) $stock->quantity < $quantity) {
                throw new InsufficientStockException((float) $stock->quantity);
            }

            // Um ajuste negativo também não pode deixar o saldo abaixo de zero
            if ($type === 'adjustment' && (float) $stock->quantity + $quantity < 0) {
                throw new InsufficientStockException((float) $stock->quantity);
            }

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

    /**
     * Linha de stock produto/armazém bloqueada para escrita (SELECT ... FOR UPDATE).
     * Tem de ser chamada dentro de uma transação. `createOrFirst` apoia-se no índice único
     * (produto, armazém, empresa), por isso duas criações simultâneas não duplicam a linha.
     */
    private function lockedStockRow(Product $product, Warehouse $warehouse): ProductStock
    {
        $keys = [
            'company_id' => $product->company_id,
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
        ];

        $row = ProductStock::withoutGlobalScopes()->createOrFirst($keys, ['quantity' => 0]);

        return ProductStock::withoutGlobalScopes()->whereKey($row->id)->lockForUpdate()->firstOrFail();
    }

    /**
     * Um fecho de inventário concluído com `blocks_movements` congela o stock do seu armazém
     * (ou de todos, se não tiver armazém) até à data de referência. Os movimentos são sempre
     * datados de agora, por isso só um fecho de hoje os bloqueia.
     */
    private function assertNotBlockedByClosing(Product $product, Warehouse $warehouse): void
    {
        $blocked = InventoryClosing::withoutGlobalScopes()
            ->where('company_id', $product->company_id)
            ->where('status', 'completed')
            ->where('blocks_movements', true)
            ->where(fn ($q) => $q->whereNull('warehouse_id')->orWhere('warehouse_id', $warehouse->id))
            ->get()
            ->contains(fn (InventoryClosing $closing) => $closing->blocksMovementOnDate(now()->startOfDay()));

        if ($blocked) {
            throw new BusinessRuleException('Os movimentos de stock estão bloqueados por um fecho de inventário concluído.');
        }
    }

    private function updateProductStock(StockMovement $movement): void
    {
        $delta = match ($movement->type) {
            'in' => $movement->quantity,
            'out' => -$movement->quantity,
            'adjustment' => $movement->quantity,
            'opening' => $movement->quantity,
            default => 0,
        };

        // Incremento feito pela base de dados (quantity = quantity + delta), nunca ler-e-gravar em PHP
        ProductStock::withoutGlobalScopes()->where([
            'company_id' => $movement->company_id,
            'product_id' => $movement->product_id,
            'warehouse_id' => $movement->warehouse_id,
        ])->increment('quantity', (float) $delta);

        // Immediate verification of limits (low stock & out of stock)
        $product = Product::find($movement->product_id);
        if ($product && $product->track_stock) {
            $totalStock = ProductStock::where('product_id', $product->id)->sum('quantity');

            if ($totalStock <= 0) {
                // Out of stock
                $exists = SystemNotification::where('company_id', $product->company_id)
                    ->where('type', 'out_of_stock')
                    ->where('link', "/products/{$product->id}")
                    ->where('is_read', false)
                    ->exists();

                if (! $exists) {
                    SystemNotification::create([
                        'company_id' => $product->company_id,
                        'type' => 'out_of_stock',
                        'title' => 'Stock Esgotado',
                        'message' => "O produto {$product->name} esgotou em todos os armazéns. Stock Atual: 0.",
                        'link' => "/products/{$product->id}",
                        'is_read' => false,
                    ]);

                    $company = Company::find($product->company_id);
                    if ($company && $company->notify_low_stock_email && $company->email) {
                        try {
                            Mail::to($company->email)->send(new LowStockAlertMail($product, 0));
                        } catch (\Exception $e) {
                            Log::error("Erro ao enviar email de stock esgotado para {$company->email}: ".$e->getMessage());
                        }
                    }
                }

                // Resolve low stock notification
                SystemNotification::where('company_id', $product->company_id)
                    ->where('type', 'low_stock')
                    ->where('link', "/products/{$product->id}")
                    ->where('is_read', false)
                    ->update(['is_read' => true]);

            } elseif (! is_null($product->min_stock) && $totalStock <= $product->min_stock) {
                // Low stock
                $exists = SystemNotification::where('company_id', $product->company_id)
                    ->where('type', 'low_stock')
                    ->where('link', "/products/{$product->id}")
                    ->where('is_read', false)
                    ->exists();

                if (! $exists) {
                    SystemNotification::create([
                        'company_id' => $product->company_id,
                        'type' => 'low_stock',
                        'title' => 'Stock Mínimo Atingido',
                        'message' => "O produto {$product->name} atingiu ou desceu abaixo do limite mínimo ({$product->min_stock}). Stock Atual: {$totalStock}.",
                        'link' => "/products/{$product->id}",
                        'is_read' => false,
                    ]);

                    $company = Company::find($product->company_id);
                    if ($company && $company->notify_low_stock_email && $company->email) {
                        try {
                            Mail::to($company->email)->send(new LowStockAlertMail($product, $totalStock));
                        } catch (\Exception $e) {
                            Log::error("Erro ao enviar email de stock mínimo para {$company->email}: ".$e->getMessage());
                        }
                    }
                }

                // Resolve out of stock notification (since stock is > 0 now)
                SystemNotification::where('company_id', $product->company_id)
                    ->where('type', 'out_of_stock')
                    ->where('link', "/products/{$product->id}")
                    ->where('is_read', false)
                    ->update(['is_read' => true]);

            } else {
                // Healthy stock -> resolve both alerts
                SystemNotification::where('company_id', $product->company_id)
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

        if ($quantity <= 0) {
            throw new BusinessRuleException('O stock inicial tem de ser superior a zero.');
        }

        // A verificação é feita com a linha de stock bloqueada, para que dois pedidos
        // simultâneos não definam o stock inicial duas vezes.
        return DB::transaction(function () use ($product, $warehouse, $quantity, $notes) {
            $this->lockedStockRow($product, $warehouse);

            if ($this->openingExists($product, $warehouse)) {
                throw new BusinessRuleException('O stock inicial já foi definido para este produto neste armazém.');
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
        });
    }

    public function openingExists(Product $product, Warehouse $warehouse): bool
    {
        return StockMovement::where('product_id', $product->id)
            ->where('warehouse_id', $warehouse->id)
            ->where('type', 'opening')
            ->exists();
    }
}
