<?php

namespace App\Models;

use App\Traits\BelongsToCompany;
use App\Traits\HasAudit;
use Illuminate\Database\Eloquent\Model;

class StockAdjustmentItem extends Model
{
    protected $fillable = ['stock_adjustment_id', 'product_id', 'old_quantity', 'new_quantity', 'difference'];
}
