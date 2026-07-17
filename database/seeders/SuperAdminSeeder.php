<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        $email = env('SUPER_ADMIN_EMAIL', 'superadmin@kutenga.app');
        $password = env('SUPER_ADMIN_PASSWORD', 'Kutenga@SuperAdmin2026!');

        $user = User::updateOrCreate(
            ['email' => $email],
            [
                'name'           => 'Super Admin',
                'password'       => Hash::make($password),
                'company_id'     => null,
                'is_super_admin' => true,
                'status'         => 'active',
            ]
        );

        $this->command->info("Super-admin criado/atualizado: {$user->email}");
        $this->command->warn("Guarda a password em segurança e define SUPER_ADMIN_EMAIL e SUPER_ADMIN_PASSWORD no .env");
    }
}
