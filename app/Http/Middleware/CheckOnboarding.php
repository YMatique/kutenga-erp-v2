<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckOnboarding
{
    /**
     * Obriga quem ainda não tem empresa (ou cuja empresa está incompleta) a passar pelo onboarding.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // O super admin gere a plataforma e não pertence a nenhuma empresa
        if (! $user || $user->isSuperAdmin()) {
            return $next($request);
        }

        $needsOnboarding = false;

        if (! $user->company_id) {
            $needsOnboarding = true;
        } else {
            // Se a empresa existir mas estiver incompleta
            $company = $user->company;
            if ($company && (empty($company->nuit) || empty($company->address) || empty($company->phone))) {
                $needsOnboarding = true;
            }
        }

        // Evita ciclos de redirecionamento se já estiver nas rotas do onboarding
        if ($needsOnboarding && ! $request->is('onboarding*') && ! $request->is('logout')) {
            return redirect()->route('onboarding.index');
        }

        return $next($request);
    }
}
