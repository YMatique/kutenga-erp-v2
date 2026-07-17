<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Activity;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        // Autorização: Apenas owner ou quem tiver a permissão audits.view
        if (!$request->user()->hasRole('owner') && !$request->user()->hasPermissionTo('audits.view')) {
            abort(403, 'Acesso Negado: Não tens permissão para ver auditorias.');
        }

        $companyId = $request->user()->company_id;

        $query = Activity::with(['causer'])
            ->where('company_id', $companyId);

        // Filter by action
        if ($request->filled('action')) {
            $query->where('description', $request->action);
        }

        // Filter by subject type
        if ($request->filled('subject')) {
            $subject = $request->subject;
            $query->where(function ($q) use ($subject) {
                $q->where('subject_type', 'like', "%\\{$subject}")
                  ->orWhere('subject_type', $subject);
            });
        }

        // Filter by dates
        if ($request->filled('date_start')) {
            $query->whereDate('created_at', '>=', $request->date_start);
        }
        if ($request->filled('date_end')) {
            $query->whereDate('created_at', '<=', $request->date_end);
        }

        // Filter by search query
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                  ->orWhere('subject_type', 'like', "%{$search}%")
                  ->orWhere('subject_id', 'like', "%{$search}%")
                  ->orWhereHas('causer', function ($userQuery) use ($search) {
                      $userQuery->where('name', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        // Buscar logs com paginação, ordenados do mais recente para o mais antigo
        $activities = $query->latest()
            ->paginate(15)
            ->withQueryString()
            ->through(function ($activity) {
                return [
                    'id' => $activity->id,
                    'log_name' => $activity->log_name,
                    'description' => $activity->description,
                    'subject_type' => class_basename($activity->subject_type),
                    'subject_id' => $activity->subject_id,
                    'causer_name' => $activity->causer ? $activity->causer->name : 'Sistema',
                    'causer_email' => $activity->causer ? $activity->causer->email : null,
                    'properties' => $activity->attribute_changes && $activity->attribute_changes->isNotEmpty()
                        ? $activity->attribute_changes
                        : $activity->properties,
                    'created_at' => $activity->created_at->format('Y-m-d H:i:s'),
                    'created_at_human' => $activity->created_at->diffForHumans(),
                ];
            });

        return Inertia::render('settings/audits', [
            'activities' => $activities,
            'filters' => $request->only(['search', 'action', 'subject', 'date_start', 'date_end'])
        ]);
    }
}
