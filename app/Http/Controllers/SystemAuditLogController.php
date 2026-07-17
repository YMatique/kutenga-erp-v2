<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Activity;

class SystemAuditLogController extends Controller
{
    public function index(Request $request)
    {
        // Apenas super-admin pode aceder — protegido pelo middleware IsSuperAdmin
        $query = Activity::with(['causer'])
            ->where(function ($q) {
                $q->whereNull('company_id')
                  ->orWhereNull('causer_id');
            });

        if ($request->filled('action')) {
            $query->where('description', $request->action);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                  ->orWhere('subject_type', 'like', "%{$search}%");
            });
        }

        if ($request->filled('date_start')) {
            $query->whereDate('created_at', '>=', $request->date_start);
        }
        if ($request->filled('date_end')) {
            $query->whereDate('created_at', '<=', $request->date_end);
        }

        $activities = $query->latest()
            ->paginate(15)
            ->withQueryString()
            ->through(function ($activity) {
                return [
                    'id'               => $activity->id,
                    'log_name'         => $activity->log_name,
                    'description'      => $activity->description,
                    'subject_type'     => class_basename($activity->subject_type),
                    'subject_id'       => $activity->subject_id,
                    'causer_name'      => $activity->causer ? $activity->causer->name : 'Sistema',
                    'causer_email'     => $activity->causer ? $activity->causer->email : null,
                    'properties'       => $activity->attribute_changes && $activity->attribute_changes->isNotEmpty()
                        ? $activity->attribute_changes
                        : $activity->properties,
                    'created_at'       => $activity->created_at->format('Y-m-d H:i:s'),
                    'created_at_human' => $activity->created_at->diffForHumans(),
                ];
            });

        return Inertia::render('system/audits', [
            'activities' => $activities,
            'filters'    => $request->only(['search', 'action', 'date_start', 'date_end']),
        ]);
    }
}
