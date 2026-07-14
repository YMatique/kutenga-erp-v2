<?php

namespace App\Models;

use App\Traits\BelongsToCompany;
// use App\Traits\HasAudit;
use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\Models\Concerns\LogsActivity;
use Spatie\Activitylog\Support\LogOptions;

class StockTransfer extends Model
{
    use BelongsToCompany /* , HasAudit */, LogsActivity;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logAll()
            ->logOnlyDirty()
            ->dontLogEmptyChanges();
    }

    //
    public $fillable = [
        'company_id',
        'from_warehouse_id',
        'to_warehouse_id',
        'status',
        'notes',
        'created_by',
    ];

    public function items(): HasMany
    {
        return $this->hasMany(StockTransferItem::class);
    }

    public function fromWarehouse()
    {
        return $this->belongsTo(
            Warehouse::class,
            'from_warehouse_id'
        );
    }

    public function toWarehouse()
    {
        return $this->belongsTo(
            Warehouse::class,
            'to_warehouse_id'
        );
    }
}
