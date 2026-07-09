<?php

namespace App\Models;

use App\Traits\BelongsToCompany;
use App\Traits\HasAudit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

use Spatie\Activitylog\Models\Concerns\LogsActivity;
use Spatie\Activitylog\Support\LogOptions;

class Product extends Model
{
    use SoftDeletes, HasAudit, BelongsToCompany, LogsActivity;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logAll()
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    protected $fillable = [
        'company_id',
        'category_id',
        'unit_id',
        'brand_id',
        'name',
        'slug',
        'sku',
        'barcode',
        'description',
        'type',
        'track_stock',
        'min_stock',
        'weight',
        'price',
        'cost',
        'tax_rate',
        'tax_is_exempt',
        'tax_exemption_reason',
        'internal_notes',
        'image_path',
        'status',
    ];

    protected $casts = [
        'tax_is_exempt' => 'boolean',
        'track_stock' => 'boolean',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }
    public function stocks()
{
    return $this->hasMany(ProductStock::class);
}

    public function stockMovements()
    {
        return $this->hasMany(StockMovement::class);
    }
}
