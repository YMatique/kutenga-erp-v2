<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Session;

trait BelongsToCompany
{
    protected static function bootBelongsToCompany()
    {
        static::creating(function ($model) {
            if (!$model->company_id && Session::has('current_company_id')) {
                $model->company_id = Session::get('current_company_id');
            }
        });

        static::addGlobalScope('company', function (Builder $builder) {
            if (Session::has('current_company_id')) {
                $builder->where('company_id', Session::get('current_company_id'));
            }
        });
    }
}
