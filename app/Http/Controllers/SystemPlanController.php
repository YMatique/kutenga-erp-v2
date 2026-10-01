<?php

namespace App\Http\Controllers;

use App\Models\Plan;
use Illuminate\Http\Request;
use Inertia\Inertia;

/** Catálogo de planos e limites — apenas super admin (middleware IsSuperAdmin). */
class SystemPlanController extends Controller
{
    public function index()
    {
        return Inertia::render('system/plans', [
            'plans' => Plan::orderBy('sort_order')->get(),
            'limitLabels' => Plan::LIMIT_KEYS,
            'featureLabels' => Plan::FEATURE_KEYS,
        ]);
    }

    public function update(Request $request, Plan $plan)
    {
        $limitRules = collect(array_keys(Plan::LIMIT_KEYS))
            ->mapWithKeys(fn ($key) => ["limits.$key" => 'nullable|integer|min:0'])
            ->all();

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'description' => 'nullable|string|max:255',
            'price_label' => 'nullable|string|max:100',
            'is_active' => 'boolean',
            'limits' => 'required|array',
            'features' => 'nullable|array',
        ] + $limitRules);

        // Só as chaves conhecidas; vazio/null = ilimitado
        $limits = [];
        foreach (array_keys(Plan::LIMIT_KEYS) as $key) {
            $value = $validated['limits'][$key] ?? null;
            $limits[$key] = $value === null || $value === '' ? null : (int) $value;
        }

        $features = [];
        foreach (array_keys(Plan::FEATURE_KEYS) as $key) {
            $features[$key] = (bool) ($validated['features'][$key] ?? false);
        }

        $plan->update([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'price_label' => $validated['price_label'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
            'limits' => $limits,
            'features' => $features,
        ]);

        return back()->with('success', "Plano {$plan->name} atualizado. As alterações aplicam-se a todas as empresas deste plano.");
    }
}
