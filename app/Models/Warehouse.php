<?php

namespace App\Models;

use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Warehouse extends Model
{
    use BelongsToCompany, SoftDeletes;

    protected $fillable = [
        'company_id',
        'name',
        'code',
        'address',
        'description',
        'is_default',
        'is_active',
    ];

    protected $casts = ['is_default' => 'boolean', 'is_active' => 'boolean'];

    public function stockMovements()
    {
        return $this->hasMany(StockMovement::class);
    }

    public function incomingTransfers()
    {
        return $this->hasMany(
            StockTransfer::class,
            'to_warehouse_id'
        );
    }

    public function outgoingTransfers()
    {
        return $this->hasMany(
            StockTransfer::class,
            'from_warehouse_id'
        );
    }
    public function stocks()
{
    return $this->hasMany(ProductStock::class);
}
}
