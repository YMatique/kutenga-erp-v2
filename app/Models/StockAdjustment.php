<?php

namespace App\Models;

use App\Traits\BelongsToCompany;
use App\Traits\HasAudit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StockAdjustment extends Model
{
    use BelongsToCompany, HasAudit;
    public $fillable = [

        'company_id',
        'warehouse_id',
        'reasons',
        'notes',
        'created_by',
    ];
     public function items(): HasMany
    {
        return $this->hasMany(StockAdjustmentItem::class);
    }
}
