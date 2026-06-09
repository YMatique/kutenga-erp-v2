<?php

namespace App\Models;

use App\Traits\BelongsToCompany;
use App\Traits\HasAudit;
use Illuminate\Database\Eloquent\Model;

class StockTransferItem extends Model
{
    // use BelongsToCompany, HasAudit;

    //
    protected $fillable = ['stock_transfer_id', 'product_id', 'quantity'];

    public function transfer()
    {
        return $this->belongsTo(StockTransfer::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
