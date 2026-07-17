<?php

namespace App\Models\Billing;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DocumentSeries extends Model
{
    protected $table = 'document_series';
    protected $fillable = ['company_id', 'code', 'name', 'year', 'next_number', 'is_active', 'created_by', 'updated_by'];

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class, 'series_id');
    }
}
