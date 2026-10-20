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

    /** Produtos da empresa com controlo de stock, já com o saldo total disponível como `totals.total`. */
    public static function tracked(int $companyId): Builder
    {
        $totals = DB::table('product_stocks')
            ->where('company_id', $companyId)
            ->groupBy('product_id')
            ->selectRaw('product_id, SUM(quantity) as total');

        return Product::query()
            ->where('products.company_id', $companyId)
            ->where('products.track_stock', true)
            ->leftJoinSub($totals, 'totals', 'totals.product_id', '=', 'products.id');
    }

    /** @return array{low: int, out: int} */
    public static function counts(int $companyId): array
    {
        return [
            'low' => self::tracked($companyId)->whereRaw(self::LOW_STOCK)->count(),
            'out' => self::tracked($companyId)->whereRaw(self::OUT_OF_STOCK)->count(),
        ];
    }
}
