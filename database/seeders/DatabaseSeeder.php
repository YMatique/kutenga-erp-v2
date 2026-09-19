<?php

namespace Database\Seeders;

use Database\Seeders\Demo\DemoDataSeeder;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * Essenciais (papéis/permissões e super-admin) + dados de demonstração
     * (empresas, catálogo, armazéns, stock, clientes). Os dados de demo são
     * ignorados em produção.
     */
    public function run(): void
    {
        $this->call([
            RoleAndPermissionSeeder::class,
            SuperAdminSeeder::class,
            DemoDataSeeder::class,
        ]);
    }
}
