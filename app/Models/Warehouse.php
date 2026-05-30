<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Warehouse extends Model
{
    protected $fillable = [
        'company_id',
        'name',
        'code',
        'address',
        'is_default',
    ];

    public function stockMovements()
    {
        return $this->hasMany(StockMovement::class);
    }
}
