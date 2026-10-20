<?php

namespace App\Services\Inventory;

use App\Models\Catalog\Product;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

/**
 * Produtos com controlo de stock em alerta, calculados na base de dados.
 *
 * O saldo de um produto é a soma de todos os armazéns. Está "esgotado" com saldo <= 0 e
 * "baixo" com saldo > 0 mas não acima do stock mínimo. Partilhado pelos dashboards para
 * ambos contarem exatamente o mesmo.
 */
class StockAlerts
{
    /** Saldo total do produto (0 quando não tem linhas de stock). */
    public const TOTAL = 'COALESCE(totals.total, 0)';

    public const OUT_OF_STOCK = self::TOTAL.' <= 0';

    public const LOW_STOCK = self::TOTAL.' > 0 AND products.min_stock IS NOT NULL AND '.self::TOTAL.' <= products.min_stock';

    /**
     * Produtos da empresa com controlo de stock, já com o saldo disponível como `totals.total`.
     *
     * Sem armazém, o saldo é o total de todos e entram todos os produtos. Com armazém, o saldo é o
     * desse armazém e só entram os produtos que lá têm linha de stock (um produto nunca guardado
     * ali não está "esgotado" nesse armazém, simplesmente não existe).
     */
    public static function tracked(int $companyId, ?int $warehouseId = null): Builder
    {
        $totals = DB::table('product_stocks')
            ->where('company_id', $companyId)
            ->when($warehouseId, fn ($q) => $q->where('warehouse_id', $warehouseId))
            ->groupBy('product_id')
            ->selectRaw('product_id, SUM(quantity) as total');

        $products = Product::query()
            ->where('products.company_id', $companyId)
            ->where('products.track_stock', true);

        return $warehouseId
            ? $products->joinSub($totals, 'totals', 'totals.product_id', '=', 'products.id')
            : $products->leftJoinSub($totals, 'totals', 'totals.product_id', '=', 'products.id');
    }

    /** @return array{low: int, out: int} */
    public static function counts(int $companyId, ?int $warehouseId = null): array
    {
        return [
            'low' => self::tracked($companyId, $warehouseId)->whereRaw(self::LOW_STOCK)->count(),
            'out' => self::tracked($companyId, $warehouseId)->whereRaw(self::OUT_OF_STOCK)->count(),
        ];
    }
}
