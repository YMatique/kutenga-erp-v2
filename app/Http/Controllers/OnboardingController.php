<?php

namespace App\Http\Controllers;

use App\Models\Company;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class OnboardingController extends Controller
{
    /**
     * Show the onboarding form.
     */
    public function index(Request $request)
    {
        // Se já tiver empresa, não precisa de onboarding
        if ($request->user()->company_id) {
            return redirect()->route('dashboard');
        }

        return Inertia::render('onboarding/index');
    }

    /**
     * Process the onboarding form.
     */
    public function store(Request $request)
    {
        if ($request->user()->company_id) {
            return redirect()->route('dashboard');
        }

        $validated = $request->validate([
            'company_name' => 'required|string|max:255',
            'nuit' => 'required|string|max:50|unique:companies,nuit',
            'email' => 'required|email|max:255|unique:companies,email',
            'phone' => 'required|string|max:50',
            'address' => 'required|string',
            'default_currency' => 'required|string|max:3',
        ]);

        DB::beginTransaction();

        try {
            // Criar a empresa
            $company = Company::create([
                'name' => $validated['company_name'],
                'nuit' => $validated['nuit'],
                'email' => $validated['email'],
                'phone' => $validated['phone'],
                'address' => $validated['address'],
                'default_currency' => $validated['default_currency'],
                'status' => 'active',
            ]);

            // Atualizar o utilizador
            $user = $request->user();
            $user->company_id = $company->id;
            $user->save();

            // Atribuir a permissão máxima ao criador (owner)
            // Assumindo que o package Spatie Permission está ativo e a role owner existe, 
            // ou podemos criá-la se não existir.
            if (\Spatie\Permission\Models\Role::where('name', 'owner')->where('company_id', $company->id)->doesntExist()) {
                \Spatie\Permission\Models\Role::create([
                    'name' => 'owner',
                    'company_id' => $company->id,
                    'guard_name' => 'web'
                ]);
            }
            $user->assignRole('owner');

            DB::commit();

            // Enviar email de boas-vindas
            \Illuminate\Support\Facades\Mail::to($user->email)->send(new \App\Mail\WelcomeToKutenga($user, $company));

            return redirect()->route('dashboard')->with('success', 'Bem-vindo ao Kutenga! A tua empresa foi criada com sucesso.');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Ocorreu um erro ao criar a empresa: ' . $e->getMessage()]);
        }
    }
}
