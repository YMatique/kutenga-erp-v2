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

        // Buscar logs com paginação, ordenados do mais recente para o mais antigo
        $activities = Activity::with(['causer'])
            ->where('company_id', $companyId)
            ->latest()
            ->paginate(15)
            ->through(function ($activity) {
                return [
                    'id' => $activity->id,
                    'log_name' => $activity->log_name,
                    'description' => $activity->description,
                    'subject_type' => class_basename($activity->subject_type),
                    'subject_id' => $activity->subject_id,
                    'causer_name' => $activity->causer ? $activity->causer->name : 'Sistema',
                    'causer_email' => $activity->causer ? $activity->causer->email : null,
                    'properties' => $activity->properties,
                    'created_at' => $activity->created_at->format('Y-m-d H:i:s'),
                    'created_at_human' => $activity->created_at->diffForHumans(),
                ];
            });

        return Inertia::render('settings/audits', [
            'activities' => $activities
        ]);
    }
}
