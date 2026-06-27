<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    /**
     * Exibe a listagem de clientes cadastrados.
     */
    public function index(Request $request): Response
    {
        $companyId = $request->user()->company_id; // Multi-tenant

        $customers = Customer::where('company_id', $companyId)
            ->with(['contacts', 'addresses'])
            ->when($request->search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('nuit', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->orderBy('name', 'asc')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('billing/customers/index', [
            'customers' => $customers,
            'filters' => $request->only(['search'])
        ]);
    }

    /**
     * Regista um novo cliente com múltiplos contactos e endereços de forma transacional.
     */
    public function store(Request $request)
    {
        $companyId = $request->user()->company_id;

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'nuit' => [
                'required',
                'string',
                'size:9', // NUIT em Moçambique tem exatamente 9 dígitos
                "unique:customers,nuit,NULL,id,company_id,{$companyId}"
            ],
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:30',
            'address' => 'nullable|string',
            'credit_limit' => 'nullable|numeric|min:0',
            
            // Validação de múltiplos contactos
            'contacts' => 'nullable|array',
            'contacts.*.name' => 'required|string|max:255',
            'contacts.*.role' => 'nullable|string|max:100',
            'contacts.*.phone' => 'nullable|string|max:30',
            'contacts.*.email' => 'nullable|email|max:255',

            // Validação de múltiplos endereços
            'addresses' => 'nullable|array',
            'addresses.*.type' => 'required|in:billing,delivery',
            'addresses.*.address' => 'required|string',
            'addresses.*.city' => 'required|string|max:100',
        ]);

        DB::transaction(function () use ($validated, $companyId) {
            $customer = Customer::create([
                'company_id' => $companyId,
                'name' => $validated['name'],
                'nuit' => $validated['nuit'],
                'email' => $validated['email'] ?? null,
                'phone' => $validated['phone'] ?? null,
                'address' => $validated['address'] ?? null,
                'credit_limit' => $validated['credit_limit'] ?? 0.00,
                'balance' => 0.00,
                'is_active' => true,
            ]);

            // Guardar os contactos associados
            if (!empty($validated['contacts'])) {
                foreach ($validated['contacts'] as $contact) {
                    $customer->contacts()->create($contact);
                }
            }

            // Guardar os endereços associados
            if (!empty($validated['addresses'])) {
                foreach ($validated['addresses'] as $address) {
                    $customer->addresses()->create($address);
                }
            }
        });

        return redirect()->back()->with('success', 'Cliente registado com sucesso!');
    }

    /**
     * Atualiza os dados de um cliente existente.
     */
    public function update(Request $request, $id)
    {
        $companyId = $request->user()->company_id;
        $customer = Customer::where('company_id', $companyId)->findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'nuit' => [
                'required',
                'string',
                'size:9',
                "unique:customers,nuit,{$customer->id},id,company_id,{$companyId}"
            ],
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:30',
            'address' => 'nullable|string',
            'credit_limit' => 'nullable|numeric|min:0',
            'is_active' => 'required|boolean',
        ]);

        $customer->update($validated);

        return redirect()->back()->with('success', 'Cadastro do cliente atualizado!');
    }

    /**
     * Elimina logicamente um cliente do sistema.
     */
    public function destroy(Request $request, $id)
    {
        $companyId = $request->user()->company_id;
        $customer = Customer::where('company_id', $companyId)->findOrFail($id);

        // Se tiver saldo devedor pendente, bloqueia a eliminação
        if ($customer->balance > 0) {
            return redirect()->back()->withErrors([
                'error' => 'Não é possível eliminar um cliente com saldo corrente devedor pendente.'
            ]);
        }

        $customer->delete();

        return redirect()->back()->with('success', 'Cliente removido com sucesso!');
    }
}
