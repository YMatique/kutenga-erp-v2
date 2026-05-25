<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Company;
use App\Models\Branch;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Criar Empresa
        $company = Company::updateOrCreate(
            ['nuit' => '123456789'],
            ['name' => 'Kutenga ERP Demo', 'email' => 'admin@kutenga.com', 'status' => 'active']
        );

        // 2. Criar Filial Matriz
        $branch = Branch::updateOrCreate(
            ['company_id' => $company->id, 'code' => 'MATRIZ'],
            ['name' => 'Unidade Sede', 'status' => 'active']
        );

        // 3. Criar Usuário Teste vinculado
        User::updateOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Administrador',
                'password' => bcrypt('password'),
                'company_id' => $company->id,
                'branch_id' => $branch->id,
            ]
        );
    }
}
