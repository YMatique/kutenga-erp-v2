<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SubscriptionController extends Controller
{
    public function edit(Request $request)
    {
        $company = $request->user()->company;
        
        return Inertia::render('settings/subscription', [
            'company' => $company,
            'plans' => \App\Models\Plan::where('is_active', true)->orderBy('sort_order')->get(),
            'limitLabels' => \App\Models\Plan::LIMIT_KEYS,
            'featureLabels' => \App\Models\Plan::FEATURE_KEYS,
        ]);
    }

    public function upgrade(Request $request)
    {
        $company = $request->user()->company;

        // A mudança de plano é uma operação administrativa da plataforma:
        // um administrador da empresa não pode atribuir-se um plano pago.
        abort_unless($request->user()->isSuperAdmin(), 403, 'A alteração de plano é gerida pela Kutenga. Contacte o suporte.');

        $validated = $request->validate([
            'plan' => ['required', 'string', \Illuminate\Validation\Rule::exists('plans', 'code')->where('is_active', true)],
        ]);

        $plan = $validated['plan'];
        $endsAt = match ($plan) {
            'crescimento' => now()->addMonth(),
            'empresarial' => now()->addYear(),
            default => null,
        };

        app(\App\Services\Subscription\SubscriptionService::class)->apply($company, [
            'plan' => $plan,
            'status' => 'active',
            'ends_at' => $endsAt,
        ], 'admin');

        return back()->with('success', 'Plano atualizado com sucesso para ' . ucfirst($plan) . '!');
    }
}
