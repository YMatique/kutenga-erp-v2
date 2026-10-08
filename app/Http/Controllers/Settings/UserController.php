<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Mail\UserCreatedMail;
use App\Models\Role;
use App\Models\SystemNotification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class UserController extends Controller
{
    /** Papéis que a empresa pode atribuir: os do sistema e os criados por ela. */
    private function roleRule(int $companyId): array
    {
        return [
            'required',
            'string',
            Rule::exists('roles', 'name')->where(
                fn ($q) => $q->whereNull('company_id')->orWhere('company_id', $companyId)
            ),
        ];
    }

    /** Resolve o papel pela instância (nomes iguais podem existir em empresas diferentes). */
    private function resolveRole(string $name, int $companyId): Role
    {
        return Role::where('guard_name', 'web')
            ->where('name', $name)
            ->where(fn ($q) => $q->whereNull('company_id')->orWhere('company_id', $companyId))
            ->orderByRaw('company_id is null') // o da empresa tem prioridade sobre o do sistema
            ->firstOrFail();
    }

    /** O papel 'owner' dá acesso total: só quem já é owner o pode atribuir ou alterar. */
    private function guardOwner(Request $request, Role $role, ?User $target = null): void
    {
        $actorIsOwner = $request->user()->hasRole('owner');

        abort_if($role->name === 'owner' && ! $actorIsOwner, 403, 'Apenas o proprietário pode atribuir o papel de proprietário.');
        abort_if($target && $target->hasRole('owner') && ! $actorIsOwner, 403, 'Apenas o proprietário pode alterar outro proprietário.');
    }

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
            'role' => $this->roleRule($companyId),
        ]);

        $role = $this->resolveRole($validated['role'], $companyId);
        $this->guardOwner($request, $role);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'company_id' => $companyId,
        ]);

        $user->assignRole($role);

        // Create system notification
        SystemNotification::create([
            'company_id' => $companyId,
            'type' => 'user_created',
            'title' => 'Novo Utilizador',
            'message' => "O utilizador {$user->name} ({$user->email}) foi registado com o papel {$validated['role']}.",
            'link' => '/settings/users',
            'is_read' => false,
        ]);

        // Send welcome/credentials email
        try {
            $setPasswordUrl = route('password.reset', [
                'token' => Password::broker()->createToken($user),
                'email' => $user->email,
            ]);

            Mail::to($user->email)->send(new UserCreatedMail($user, $setPasswordUrl));
        } catch (\Exception $e) {
            Log::error("Erro ao enviar email de credenciais para {$user->email}: ".$e->getMessage());
        }

        return back()->with('success', 'Utilizador criado com sucesso.');
    }

    public function update(Request $request, User $user)
    {
        abort_if($user->company_id !== $request->user()->company_id, 403);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,'.$user->id,
            'password' => 'nullable|string|min:8',
            'role' => $this->roleRule($user->company_id),
        ]);

        $role = $this->resolveRole($validated['role'], $user->company_id);
        $this->guardOwner($request, $role, $user);

        $user->name = $validated['name'];
        $user->email = $validated['email'];

        if (! empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }

        $user->save();

        $user->syncRoles([$role]);

        return back()->with('success', 'Utilizador atualizado com sucesso.');
    }

    public function destroy(Request $request, User $user)
    {
        abort_if($user->company_id !== $request->user()->company_id, 403);
        abort_if($user->id === $request->user()->id, 400, 'Não podes apagar o teu próprio utilizador.');
        abort_if($user->hasRole('owner') && ! $request->user()->hasRole('owner'), 403, 'Apenas o proprietário pode remover outro proprietário.');

        $user->delete();

        return back()->with('success', 'Utilizador removido com sucesso.');
    }
}
