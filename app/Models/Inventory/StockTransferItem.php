<?php

namespace App\Models\Inventory;

use App\Models\Catalog\Product;
use App\Traits\BelongsToCompany;
// use App\Traits\HasAudit;
use Illuminate\Database\Eloquent\Model;

class StockTransferItem extends Model
{
    // use BelongsToCompany /* , HasAudit */;

    //
    protected $fillable = ['stock_transfer_id', 'product_id', 'quantity', 'received_quantity', 'shortage_action'];

    protected $casts = [
        'quantity' => 'float',
        'received_quantity' => 'float',
    ];

    /**
     * O que ainda vem a caminho de um produto, em SQL (para somar em consultas): o enviado menos o já
     * recebido, ou nada se a diferença já foi resolvida (perda ou devolução). Só faz sentido em
     * transferências em trânsito.
     */
    public const REMAINING_SQL = 'CASE WHEN stock_transfer_items.shortage_action IS NULL THEN stock_transfer_items.quantity - COALESCE(stock_transfer_items.received_quantity, 0) ELSE 0 END';

    /** O que ainda vem a caminho deste produto (o mesmo cálculo de REMAINING_SQL). */
    public function getRemainingAttribute(): float
    {
        if ($this->shortage_action !== null) {
            return 0.0;
        }

        return max(0.0, round((float) $this->quantity - (float) ($this->received_quantity ?? 0), 3));
    }

    public function transfer()
    {
        return $this->belongsTo(StockTransfer::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
