<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SubscriptionEvent extends Model
{
    protected $fillable = [
        'company_id', 'event_id', 'source', 'previous_plan', 'plan',
        'previous_status', 'status', 'ends_at', 'payload',
    ];

    protected $casts = [
        'ends_at' => 'datetime',
        'payload' => 'array',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }
}
