<?php

namespace App\Models;

use App\Traits\BelongsToCompany;
// use App\Traits\HasAudit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StockAdjustment extends Model
{
    use BelongsToCompany /* , HasAudit */;

    protected $fillable = [

        'company_id',
        'warehouse_id',
        'reason',
        'status',
        'notes',
        'created_by',
        'completed_by',
        'completed_at',
        'cancelled_by',
        'cancelled_at',
    ];

    public function items(): HasMany
    {
        return $this->hasMany(StockAdjustmentItem::class);
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function completer()
    {
        return $this->belongsTo(User::class, 'completed_by');
    }

    public function canceller()
    {
        return $this->belongsTo(User::class, 'cancelled_by');
    }
}
