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
            'company' => $company
        ]);
    }

    public function upgrade(Request $request)
    {
        $company = $request->user()->company;

        $validated = $request->validate([
            'plan' => 'required|string|in:inicial,crescimento,empresarial',
            'simulate_expiration' => 'nullable|boolean'
        ]);

        if (!empty($validated['simulate_expiration'])) {
            $company->update([
                'subscription_status' => 'expired',
                'subscription_ends_at' => now()->subDay(),
            ]);

            // Criar notificação de expiração do plano
            \App\Models\SystemNotification::create([
                'company_id' => $company->id,
                'title' => 'Subscrição Expirada (Simulação)',
                'message' => 'A subscrição do seu plano ' . ucfirst($company->subscription_plan) . ' expirou. Por favor, renove para continuar.',
                'type' => 'error',
                'is_read' => false
            ]);

            return back()->with('success', 'Subscrição expirada com sucesso (Simulação). Navegue no sistema para testar as telas de bloqueio.');
        }

        $plan = $validated['plan'];
        $endsAt = null;

        if ($plan === 'crescimento') {
            $endsAt = now()->addMonth();
        } elseif ($plan === 'empresarial') {
            $endsAt = now()->addYear();
        }

        $company->update([
            'subscription_plan' => $plan,
            'subscription_status' => 'active',
            'subscription_ends_at' => $endsAt,
        ]);

        // Criar notificação de atualização de plano
        \App\Models\SystemNotification::create([
            'company_id' => $company->id,
            'title' => 'Plano Atualizado',
            'message' => 'O plano da sua empresa foi atualizado com sucesso para: ' . ucfirst($plan) . '.',
            'type' => 'success',
            'is_read' => false
        ]);

        return back()->with('success', 'Plano atualizado com sucesso para ' . ucfirst($plan) . '!');
    }
}
