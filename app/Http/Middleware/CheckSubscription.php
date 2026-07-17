<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckSubscription
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (auth()->check()) {
            $user = auth()->user();
            $company = $user->company;

            if ($company) {
                // 1. Verificar se a subscrição expirou
                if ($company->isSubscriptionExpired()) {
                    // Permitir apenas logout, onboarding e rotas de subscrição
                    if (!$request->is('settings/subscription*') &&
                        !$request->is('logout') &&
                        !$request->is('onboarding*') &&
                        !$request->is('subscription/expired*')) {
                        
                        if ($user->hasRole('Admin') || $user->hasRole('owner')) {
                            return redirect()->route('settings.subscription.edit')
                                ->with('error', 'A subscrição da sua empresa expirou. Por favor, renove ou atualize o seu plano para continuar.');
                        } else {
                            return redirect()->route('subscription.expired');
                        }
                    }
                }

                // 2. Verificar acesso ao POS
                if ($request->is('pos*')) {
                    $limits = $company->getSubscriptionLimits();
                    if (empty($limits['pos_enabled'])) {
                        return redirect()->route('dashboard')
                            ->with('error', 'O Ponto de Venda (POS) não está incluído no seu plano atual (Plano Inicial). Por favor, faça o upgrade.');
                    }
                }

                // 3. Verificar limites em operações de criação (POST)
                if ($request->isMethod('POST')) {
                    $limits = $company->getSubscriptionLimits();

                    // Limite de Artigos/Produtos
                    if ($request->is('products') && $limits['products'] !== null) {
                        if ($company->getProductsCount() >= $limits['products']) {
                            return redirect()->back()->withErrors([
                                'subscription' => 'Limite do plano atingido! O seu plano atual permite apenas ' . $limits['products'] . ' artigos.'
                            ])->with('error', 'Limite do plano atingido! Não é possível criar mais artigos.');
                        }
                    }

                    // Limite de Armazéns
                    if ($request->is('inventory/warehouses') && $limits['warehouses'] !== null) {
                        if ($company->getWarehousesCount() >= $limits['warehouses']) {
                            return redirect()->back()->withErrors([
                                'subscription' => 'Limite do plano atingido! O seu plano atual permite apenas ' . $limits['warehouses'] . ' armazéns.'
                            ])->with('error', 'Limite do plano atingido! Não é possível criar mais armazéns.');
                        }
                    }
                }
            }
        }

        return $next($request);
    }
}
