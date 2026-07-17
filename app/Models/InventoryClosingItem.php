<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryClosingItem extends Model
{
    protected $fillable = [
        'closing_id',
        'product_id',
        'warehouse_id',
        'quantity_expected',
        'quantity_counted',
    ];

    protected $casts = [
        'quantity_expected' => 'decimal:4',
        'quantity_counted'  => 'decimal:4',
        'variance'          => 'decimal:4',
    ];

    protected $appends = ['variance_value'];

    public function closing(): BelongsTo
    {
        return $this->belongsTo(InventoryClosing::class, 'closing_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    /**
     * Variância calculada no PHP (fallback para DBs que não suportam virtual columns).
     */
    public function getVarianceValueAttribute(): float
    {
        $counted  = $this->quantity_counted ?? $this->quantity_expected;
        $expected = $this->quantity_expected ?? 0;
        return (float) $counted - (float) $expected;
    }
}
