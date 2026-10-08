<?php

namespace App\Models\Billing;

use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DocumentSeries extends Model
{
    use BelongsToCompany;

    protected $table = 'document_series';

    protected $fillable = ['company_id', 'code', 'name', 'scope', 'year', 'next_number', 'is_active', 'created_by', 'updated_by'];

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class, 'series_id');
    }
}
