<?php

namespace App\Models;

use App\Traits\HasAudit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Customer extends Model
{
   use SoftDeletes, HasAudit;

    protected $table = 'customers';
    protected $fillable = [
        'company_id', 'name', 'nuit', 'email', 'phone', 'address', 'credit_limit', 'balance', 'is_active'
    ];

    public function contacts(): HasMany
    {
        return $this->hasMany(CustomerContact::class);
    }

    public function addresses(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(CustomerAddress::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }
}
