<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Session;

trait BelongsToBranch
{
    protected static function bootBelongsToBranch()
    {
        static::creating(function ($model) {
            if (!$model->company_id && Session::has('current_company_id')) {
                $model->company_id = Session::get('current_company_id');
            }
            if (!$model->branch_id && Session::has('current_branch_id')) {
                $model->branch_id = Session::get('current_branch_id');
            }
        });

        static::addGlobalScope('branch', function (Builder $builder) {
            if (Session::has('current_company_id')) {
                $builder->where($builder->getQuery()->from . '.company_id', Session::get('current_company_id'));
            }
            if (Session::has('current_branch_id')) {
                $builder->where($builder->getQuery()->from . '.branch_id', Session::get('current_branch_id'));
            }
        });
    }
}
