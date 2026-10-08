<?php

namespace App\Models\Billing;

use App\Traits\BelongsToCompany;
use App\Traits\HasAudit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Models\Concerns\LogsActivity;
use Spatie\Activitylog\Support\LogOptions;

class Customer extends Model
{
    use BelongsToCompany, HasAudit, LogsActivity, SoftDeletes;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logAll()
            ->logOnlyDirty()
            ->dontLogEmptyChanges();
    }

    protected $table = 'customers';

    protected $fillable = [
        'company_id',
        'name',
        'nuit',
        'email',
        'phone',
        'address',
        'credit_limit',
        'balance',
        'is_active',
    ];

    public function contacts(): HasMany
    {
        return $this->hasMany(CustomerContact::class);
    }

    public function addresses(): HasMany
    {
        return $this->hasMany(CustomerAddress::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }
}
