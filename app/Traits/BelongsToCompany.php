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
            // if (!$model->company_id) {
            //     if (Session::has('current_company_id')) {
            //         $model->company_id = Session::get('current_company_id');
            //     } else {
            //         // Se a sessão estiver vazia, a aplicação vai parar aqui e dar-te um erro claro
            //         throw new \Exception("Kutenga Erro: 'current_company_id' não foi encontrado na sessão no momento de criar o produto.");
            //     }
            // }
        });

        static::addGlobalScope('company', function (Builder $builder) {
            if (Session::has('current_company_id')) {
                // $builder->where('company_id', Session::get('current_company_id'));
                $builder->where($builder->getQuery()->from . '.company_id', Session::get('current_company_id'));
            }
        });
    }
}
