<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckSubscription
{
    /** Rotas que continuam acessíveis com a subscrição bloqueada ou em tolerância. */
    private const ALWAYS_ALLOWED = [
        'settings/subscription*',
        'logout',
        'onboarding*',
        'subscription/expired*',
        'lock-screen',
        'unlock-screen',
        'notifications/*',
        'context/switch',
    ];

    /** POST que criam recursos sujeitos a limite do plano: caminho => [limite, descrição]. */
    private const CREATION_LIMITS = [
        'products' => ['products', 'artigos'],
        'inventory/warehouses' => ['warehouses', 'armazéns'],
        'pos/registers' => ['cash_registers', 'caixas'],
        'settings/users' => ['users', 'utilizadores'],
        'billing/invoices' => ['documents_month', 'documentos por mês'],
        'billing/quotes' => ['documents_month', 'documentos por mês'],
        'billing/receipts' => ['documents_month', 'documentos por mês'],
        'billing/credit-notes' => ['documents_month', 'documentos por mês'],
        'billing/debit-notes' => ['documents_month', 'documentos por mês'],
        'pos/sales' => ['documents_month', 'documentos por mês'],
    ];

    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = auth()->user();
        $company = $user?->company;

        if (! $company) {
            return $next($request);
        }

        $allowed = $request->is(self::ALWAYS_ALLOWED);

        // 1. Bloqueio total (expirada ou suspensa)
        if ($company->isSubscriptionExpired() && ! $allowed) {
            $suspended = $company->subscriptionState() === 'suspended';
            $message = $suspended
                ? 'A subscrição da sua empresa foi suspensa. Contacte o suporte para regularizar.'
                : 'A subscrição da sua empresa expirou. Por favor, renove ou atualize o seu plano para continuar.';

            if ($request->expectsJson()) {
                return response()->json(['error' => $message], 403);
            }

            if ($user->hasRole('Admin') || $user->hasRole('owner')) {
                return redirect()->route('settings.subscription.edit')->with('error', $message);
            }

            return redirect()->route('subscription.expired');
        }

        // 2. Tolerância: só leitura (consultar sim, criar/emitir/alterar não)
        if ($company->isSubscriptionReadOnly() && ! $allowed && ! $request->isMethodSafe()) {
            $message = 'A subscrição terminou. Até '.$company->graceEndsAt()->format('d/m/Y')
                .' só pode consultar dados; renove o plano para voltar a criar ou emitir documentos.';

            return $request->expectsJson()
                ? response()->json(['error' => $message], 403)
                : redirect()->back()->with('error', $message);
        }

        // 3. Acesso ao POS depende do plano
        if ($request->is('pos*') && ! $company->can('pos')) {
            return $request->expectsJson()
                ? response()->json(['error' => 'O Ponto de Venda (POS) não está incluído no seu plano atual.'], 403)
                : redirect()->route('dashboard')
                    ->with('error', 'O Ponto de Venda (POS) não está incluído no seu plano atual. Por favor, faça o upgrade.');
        }

        // 4. Limites do plano na criação de recursos
        if ($request->isMethod('POST')) {
            foreach (self::CREATION_LIMITS as $path => [$limitKey, $label]) {
                if ($request->is($path) && ! $company->withinLimit($limitKey)) {
                    $message = 'Limite do plano atingido! O seu plano atual permite apenas '.$company->limit($limitKey).' '.$label.'.';

                    return $request->expectsJson()
                        ? response()->json(['error' => $message], 403)
                        : redirect()->back()->withErrors(['subscription' => $message])->with('error', $message);
                }
            }
        }

        return $next($request);
    }
}
