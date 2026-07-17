<?php

namespace App\Models\Billing;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomerAddress extends Model
{
    protected $table = 'customer_addresses';
    protected $fillable = ['customer_id', 'type', 'address', 'city'];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }
}
