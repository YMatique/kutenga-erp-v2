<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckOnboarding
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // If the user is authenticated but has no company_id, they must complete onboarding
        if ($request->user() && !$request->user()->company_id) {
            // Avoid redirect loops if they are already on the onboarding routes
            if (!$request->is('onboarding*') && !$request->is('logout')) {
                return redirect()->route('onboarding.index');
            }
        }

        return $next($request);
    }
}
