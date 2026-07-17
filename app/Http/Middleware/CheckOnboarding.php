<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckOnboarding
{
    /*
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckOnboarding
{
*/
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()) {
            $user = $request->user();
            $needsOnboarding = false;

            if (!$user->company_id) {
                $needsOnboarding = true;
            } else {
                // Se a empresa existir mas estiver incompleta
                $company = $user->company;
                if ($company && (empty($company->nuit) || empty($company->address) || empty($company->phone))) {
                    $needsOnboarding = true;
                }
            }

            if ($needsOnboarding) {
                // Avoid redirect loops if they are already on the onboarding routes
                if (!$request->is('onboarding*') && !$request->is('logout')) {
                    return redirect()->route('onboarding.index');
                }
            }
        }

        return $next($request);
    }
}
