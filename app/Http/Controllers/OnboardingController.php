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
        $user = $request->user();
        $company = $user->company;

        // Se já tiver empresa e estiver tudo preenchido, sai
        if ($company && !empty($company->nuit) && !empty($company->address) && !empty($company->phone)) {
            return redirect()->route('dashboard');
        }

        return Inertia::render('onboarding/index', [
            'existingCompany' => $company
        ]);
    }

    /**
     * Process the onboarding form.
     */
    public function store(Request $request)
    {
        $user = $request->user();
        $company = $user->company;

        // Se já tiver empresa e estiver tudo preenchido, não deve fazer submissões aqui
        if ($company && !empty($company->nuit) && !empty($company->address) && !empty($company->phone)) {
            return redirect()->route('dashboard');
        }

        $companyId = $company ? $company->id : null;

        $validated = $request->validate([
            'company_name' => 'required|string|max:255',
            'nuit' => 'required|string|max:50|unique:companies,nuit' . ($companyId ? ',' . $companyId : ''),
            'email' => 'required|email|max:255|unique:companies,email' . ($companyId ? ',' . $companyId : ''),
            'phone' => 'required|string|max:50',
            'address' => 'required|string',
            'default_currency' => 'required|string|max:3',
        ]);

        DB::beginTransaction();

        try {
            if ($company) {
                // Atualizar empresa existente
                $company->update([
                    'name' => $validated['company_name'],
                    'nuit' => $validated['nuit'],
                    'email' => $validated['email'],
                    'phone' => $validated['phone'],
                    'address' => $validated['address'],
                    'default_currency' => $validated['default_currency'],
                ]);
            } else {
                // Criar a nova empresa
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
                $user->company_id = $company->id;
                $user->save();

                // Atribuir a permissão máxima ao criador (owner)
                if (\Spatie\Permission\Models\Role::where('name', 'owner')->where('company_id', $company->id)->doesntExist()) {
                    \Spatie\Permission\Models\Role::create([
                        'name' => 'owner',
                        'company_id' => $company->id,
                        'guard_name' => 'web'
                    ]);
                }
                $user->assignRole('owner');

                // Enviar email de boas-vindas apenas na criação original
                \Illuminate\Support\Facades\Mail::to($user->email)->send(new \App\Mail\WelcomeToKutenga($user, $company));
            }

            DB::commit();

            return redirect()->route('dashboard')->with('success', 'Perfil da empresa configurado com sucesso!');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Ocorreu um erro ao criar a empresa: ' . $e->getMessage()]);
        }
    }
}
