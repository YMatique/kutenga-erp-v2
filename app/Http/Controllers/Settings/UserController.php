<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $companyId = $request->user()->company_id;
        
        $users = User::with('roles')
            ->where('company_id', $companyId)
            ->latest()
            ->paginate(10);
            
        $roles = Role::whereNull('company_id')
            ->orWhere('company_id', $companyId)
            ->get();

        return Inertia::render('settings/users/index', [
            'users' => $users,
            'roles' => $roles,
        ]);
    }

    public function store(Request $request)
    {
        $companyId = $request->user()->company_id;

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role' => 'required|string|exists:roles,name',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'company_id' => $companyId,
        ]);

        $user->assignRole($validated['role']);

        return back()->with('success', 'Utilizador criado com sucesso.');
    }

    public function update(Request $request, User $user)
    {
        abort_if($user->company_id !== $request->user()->company_id, 403);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:8',
            'role' => 'required|string|exists:roles,name',
        ]);

        $user->name = $validated['name'];
        $user->email = $validated['email'];
        
        if (!empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }
        
        $user->save();

        $user->syncRoles([$validated['role']]);

        return back()->with('success', 'Utilizador atualizado com sucesso.');
    }

    public function destroy(Request $request, User $user)
    {
        abort_if($user->company_id !== $request->user()->company_id, 403);
        abort_if($user->id === $request->user()->id, 400, 'Não podes apagar o teu próprio utilizador.');

        $user->delete();

        return back()->with('success', 'Utilizador removido com sucesso.');
    }
}
