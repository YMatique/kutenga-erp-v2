<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetCompanyContext
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (auth()->check()) {
            $user = auth()->user();

            // Prioridade: Request Header > Session > User Default
            $companyId = $request->header('X-Company-Id') 
                ?? session('current_company_id') 
                ?? $user->company_id;

            $branchId = $request->header('X-Branch-Id') 
                ?? session('current_branch_id') 
                ?? $user->branch_id;

            if ($companyId) {
                session(['current_company_id' => (int) $companyId]);
            }

            if ($branchId) {
                session(['current_branch_id' => (int) $branchId]);
            }
        }

        return $next($request);
    }
}
