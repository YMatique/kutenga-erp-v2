<?php

namespace App\Models\Billing;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Payment extends Model
{
    protected $table = 'payments';
    protected $fillable = ['company_id', 'customer_id', 'payment_method', 'amount', 'payment_date', 'reference', 'notes', 'created_by', 'updated_by'];

    public function allocations(): HasMany
    {
        return $this->hasMany(PaymentAllocation::class, 'payment_id');
    }
}
