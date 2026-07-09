<?php

namespace App\Models;

use Spatie\Activitylog\Models\Activity as SpatieActivity;

class Activity extends SpatieActivity
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'log_name',
        'description',
        'subject_type',
        'subject_id',
        'causer_type',
        'causer_id',
        'properties',
        'batch_uuid',
        'event',
        'company_id',
    ];

    /**
     * Boot the model.
     */
    protected static function booted()
    {
        parent::booted();

        static::creating(function ($activity) {
            // Se houver um utilizador logado e com empresa associada, grava o company_id no log.
            if (auth()->check() && auth()->user()->company_id && empty($activity->company_id)) {
                $activity->company_id = auth()->user()->company_id;
            }
        });
    }

    /**
     * Get the company that owns the activity.
     */
    public function company()
    {
        return $this->belongsTo(Company::class);
    }
}
