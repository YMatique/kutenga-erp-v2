<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RoleController extends Controller
{
    public function index(Request $request)
    {
        $companyId = $request->user()->company_id;
        
        $roles = Role::with('permissions')
            ->whereNull('company_id')
            ->orWhere('company_id', $companyId)
            ->get();
            
        $permissions = Permission::all();

        return Inertia::render('settings/roles/index', [
            'roles' => $roles,
            'permissions' => $permissions->groupBy(function($item) {
                return explode('.', $item->name)[0]; // group by prefix
            })
        ]);
    }

    public function store(Request $request)
    {
        $companyId = $request->user()->company_id;

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'permissions' => 'array',
            'permissions.*' => 'exists:permissions,name'
        ]);

        if (Role::where('name', $validated['name'])
            ->where(function($q) use ($companyId) {
                $q->whereNull('company_id')->orWhere('company_id', $companyId);
            })->exists()) {
            return back()->withErrors(['name' => 'Já existe um papel com este nome.']);
        }

        $role = new Role();
        $role->name = $validated['name'];
        $role->company_id = $companyId;
        $role->save();

        if (!empty($validated['permissions'])) {
            $role->syncPermissions($validated['permissions']);
        }

        return back()->with('success', 'Papel criado com sucesso.');
    }

    public function update(Request $request, Role $role)
    {
        abort_if($role->company_id === null, 403, 'Não podes editar papéis do sistema.');
        abort_if($role->company_id !== $request->user()->company_id, 403);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'permissions' => 'array',
            'permissions.*' => 'exists:permissions,name'
        ]);

        if (Role::where('name', $validated['name'])
            ->where('id', '!=', $role->id)
            ->where(function($q) use ($request) {
                $q->whereNull('company_id')->orWhere('company_id', $request->user()->company_id);
            })->exists()) {
            return back()->withErrors(['name' => 'Já existe um papel com este nome.']);
        }

        $role->update(['name' => $validated['name']]);

        if (isset($validated['permissions'])) {
            $role->syncPermissions($validated['permissions']);
        } else {
            $role->syncPermissions([]);
        }

        return back()->with('success', 'Papel atualizado com sucesso.');
    }

    public function destroy(Request $request, Role $role)
    {
        abort_if($role->company_id === null, 403, 'Não podes remover papéis do sistema.');
        abort_if($role->company_id !== $request->user()->company_id, 403);

        $role->delete();

        return back()->with('success', 'Papel removido com sucesso.');
    }
}
