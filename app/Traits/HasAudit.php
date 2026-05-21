<?php

namespace App\Traits;

use Illuminate\Support\Facades\Auth;

trait HasAudit
{
    protected static function bootHasAudit()
    {
        static::creating(function ($model) {
            if (Auth::check()) {
                $model->created_by = Auth::id();
            }
        });

        static::updating(function ($model) {
            if (Auth::check()) {
                $model->updated_by = Auth::id();
            }
        });

        if (method_exists(static::class, 'bootSoftDeletes')) {
            static::deleting(function ($model) {
                if (Auth::check() && $model->isForceDeleting() === false) {
                    $model->deleted_by = Auth::id();
                    $model->save();
                }
            });
        }
    }
}
