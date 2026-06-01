<?php

namespace App\Models;

use App\Traits\BelongsToCompany;
use App\Traits\HasAudit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StockTransfer extends Model
{
    use BelongsToCompany, HasAudit;
    //
    public $fillable = [
        'company_id',
        'from_warehouse_id',
        'to_warehouse_id',
        'status',
        'notes',
        'created_by'
    ];

    public function items(): HasMany
    {
        return $this->hasMany(StockTransferItem::class);
    }
}
