<?php

namespace App\Models\Inventory;

use App\Models\User;
use App\Models\Company;


use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InventoryClosing extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'company_id',
        'warehouse_id',
        'created_by',
        'reference_date',
        'status',
        'notes',
        'blocks_movements',
        'completed_at',
    ];

    protected $casts = [
        'reference_date'   => 'date',
        'completed_at'     => 'datetime',
        'blocks_movements' => 'boolean',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(InventoryClosingItem::class, 'closing_id');
    }

    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    public function isDraft(): bool
    {
        return $this->status === 'draft';
    }

    /**
     * Verifica se este fecho bloqueia um dado movimento de stock.
     * Usado quando blocks_movements = true para validar movimentos retroativos.
     */
    public function blocksMovementOnDate(\Carbon\Carbon $date): bool
    {
        return $this->blocks_movements
            && $this->isCompleted()
            && $date->lte($this->reference_date);
    }
}
