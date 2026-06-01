<?php

namespace App\Models;

use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;

class Warehouse extends Model
{
    use BelongsToCompany;

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
}
