<?php

namespace App\Models\Catalog;

use App\Models\Company;
use App\Models\User;
use App\Traits\BelongsToCompany;
// use App\Traits\HasAudit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Branch extends Model
{
    use BelongsToCompany /* , HasAudit */, SoftDeletes;

    protected $fillable = [
        'company_id',
        'name',
        'code',
        'address',
        'phone',
        'status',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }
}
