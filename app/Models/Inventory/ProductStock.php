<?php

namespace App\Models\Inventory;

use App\Models\Catalog\Product;
use App\Traits\BelongsToCompany;
// use App\Traits\HasAudit;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class ProductStock extends Model
{
    use BelongsToCompany; // /* , HasAudit */;

    //
    protected $fillable = [
        'company_id',
        'product_id',
        'warehouse_id',
        'quantity',
    ];

    protected $casts = [
        'quantity' => 'float',
        'reserved' => 'float',
        'incoming' => 'float',
    ];

    /**
     * Junta `reserved` (prometido a transferências aprovadas que saem deste armazém) a cada
     * linha, numa só consulta. Para ter também `available`, chamar `append('available')`.
     */
    public function scopeWithReserved(Builder $query): Builder
    {
        if ($query->getQuery()->columns === null) {
            $query->select('product_stocks.*');
        }

        $reserved = DB::table('stock_transfer_items')
            ->join('stock_transfers', 'stock_transfers.id', '=', 'stock_transfer_items.stock_transfer_id')
            ->selectRaw('coalesce(sum(stock_transfer_items.quantity), 0)')
            ->where('stock_transfers.status', 'approved')
            ->whereColumn('stock_transfers.company_id', 'product_stocks.company_id')
            ->whereColumn('stock_transfers.from_warehouse_id', 'product_stocks.warehouse_id')
            ->whereColumn('stock_transfer_items.product_id', 'product_stocks.product_id');

        return $query->selectSub($reserved, 'reserved');
    }

    /**
     * Junta `incoming` (o que vai a caminho deste armazém, de transferências em trânsito) a cada linha.
     * Só conta para linhas que já existem: um produto que ainda nunca teve stock no destino
     * aparece na página do produto, onde se listam as transferências em trânsito.
     */
    public function scopeWithIncoming(Builder $query): Builder
    {
        if ($query->getQuery()->columns === null) {
            $query->select('product_stocks.*');
        }

        $incoming = DB::table('stock_transfer_items')
            ->join('stock_transfers', 'stock_transfers.id', '=', 'stock_transfer_items.stock_transfer_id')
            ->selectRaw('coalesce(sum('.StockTransferItem::REMAINING_SQL.'), 0)')
            ->where('stock_transfers.status', 'in_transit')
            ->whereColumn('stock_transfers.company_id', 'product_stocks.company_id')
            ->whereColumn('stock_transfers.to_warehouse_id', 'product_stocks.warehouse_id')
            ->whereColumn('stock_transfer_items.product_id', 'product_stocks.product_id');

        return $query->selectSub($incoming, 'incoming');
    }

    /** Saldo menos o reservado (nunca negativo); só existe se a linha foi lida com `withReserved`. */
    public function getAvailableAttribute(): ?float
    {
        if (! array_key_exists('reserved', $this->attributes)) {
            return null;
        }

        return max(0, round((float) $this->quantity - (float) $this->reserved, 3));
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }
}
