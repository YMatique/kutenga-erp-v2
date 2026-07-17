<?php

namespace App\Models\Billing;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomerContact extends Model
{
    protected $table = 'customer_contacts';
    protected $fillable = ['customer_id', 'name', 'role', 'phone', 'email'];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }
}
