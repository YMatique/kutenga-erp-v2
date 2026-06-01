<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StockAdjustment extends Model
{
    public $fillable = [

        'company_id',
        'product_id',
        'warehouse_id',
        'reasons',
        'quantity',
        'notes',
        'created_by',
    ];
}
