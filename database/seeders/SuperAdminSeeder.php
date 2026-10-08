<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        $email = env('SUPER_ADMIN_EMAIL', 'superadmin@kutenga.app');
        $password = env('SUPER_ADMIN_PASSWORD');
        $generated = false;

        $existing = User::where('email', $email)->first();

        if (blank($password) && $existing) {
            // Voltar a correr o seeder sem palavra-passe no .env não pode trocar a que já existe
            $existing->update(['company_id' => null, 'is_super_admin' => true, 'status' => 'active']);
            $this->command->info("Super-admin mantido: {$existing->email} (palavra-passe inalterada)");

            return;
        }

        if (blank($password)) {
            // Nunca existe uma palavra-passe conhecida por omissão: sem ela no .env, gera-se uma aleatória
            $password = Str::password(24);
            $generated = true;
        }

        $user = User::updateOrCreate(
            ['email' => $email],
            [
                'name' => 'Super Admin',
                'password' => Hash::make($password),
                'company_id' => null,
                'is_super_admin' => true,
                'status' => 'active',
            ]
        );

        $this->command->info("Super-admin criado/atualizado: {$user->email}");

        if ($generated) {
            $this->command->warn("SUPER_ADMIN_PASSWORD não definida. Palavra-passe gerada (só é mostrada agora): {$password}");
        } else {
            $this->command->warn('Defina SUPER_ADMIN_EMAIL e SUPER_ADMIN_PASSWORD no .env e guarde a palavra-passe em segurança.');
        }
    }
}
