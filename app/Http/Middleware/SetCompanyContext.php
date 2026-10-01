<?php

namespace App\Http\Middleware;

use App\Models\Catalog\Branch;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetCompanyContext
{
    /**
     * A empresa do contexto é SEMPRE a do utilizador autenticado. Nunca vem do pedido
     * nem de valores guardados na sessão: caso contrário um utilizador poderia
     * aceder aos dados de outra empresa (os scopes de empresa leem este valor).
     *
     * A filial pode ser mudada pelo utilizador, mas só entre filiais da sua empresa.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (auth()->check()) {
            $user = auth()->user();

            if ($user->company_id) {
                session(['current_company_id' => (int) $user->company_id]);

                $branchId = session('current_branch_id');

                $valid = $branchId && Branch::withoutGlobalScopes()
                    ->where('company_id', $user->company_id)
                    ->whereKey($branchId)
                    ->exists();

                if ($valid) {
                    session(['current_branch_id' => (int) $branchId]);
                } elseif ($user->branch_id) {
                    session(['current_branch_id' => (int) $user->branch_id]);
                } else {
                    session()->forget('current_branch_id');
                }
            } else {
                // Super admin da plataforma: sem empresa
                session()->forget(['current_company_id', 'current_branch_id']);
            }
        }

        return $next($request);
    }
}
