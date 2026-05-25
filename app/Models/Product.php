<?php

namespace App\Models;

use App\Traits\BelongsToCompany;
use App\Traits\HasAudit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use SoftDeletes, HasAudit, BelongsToCompany;

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
        'internal_notes',
        'image_path',
        'status',
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
}
