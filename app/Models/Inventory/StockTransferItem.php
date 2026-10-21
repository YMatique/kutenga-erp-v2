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

    public function transfer()
    {
        return $this->belongsTo(StockTransfer::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
