<?php

namespace App\Models\Billing;

use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Payment extends Model
{
    use BelongsToCompany;

    protected $table = 'payments';
    protected $fillable = ['company_id', 'customer_id', 'payment_method', 'amount', 'amount_tendered', 'change_given', 'payment_date', 'reference', 'notes', 'created_by', 'updated_by'];

    public function allocations(): HasMany
    {
        return $this->hasMany(PaymentAllocation::class, 'payment_id');
    }
}
