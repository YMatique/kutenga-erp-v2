<?php

namespace App\Models;

use App\Traits\BelongsToCompany;
// use App\Traits\HasAudit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Brand extends Model
{
    use SoftDeletes /* , HasAudit */, BelongsToCompany;

    protected $fillable = [
        'company_id',
        'name',
        'slug',
        'logo_path',
        'status',
    ];

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }
}
