<?php

namespace Database\Seeders\Demo;

use Database\Seeders\RoleAndPermissionSeeder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Seeder;

/**
 * Dados de demonstração para apreciação e testes manuais.
 *
 * É idempotente: pode ser executado várias vezes sem duplicar registos.
 *
 *   php artisan db:seed --class="Database\Seeders\Demo\DemoDataSeeder"
 */
class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        if (app()->isProduction()) {
            $this->command?->error('DemoDataSeeder não corre em produção.');

            return;
        }

        // Sem eventos: evita encher o registo de auditoria (activity_log) com "criações" dos dados demo.
        Model::withoutEvents(function () {
            $this->call([
                RoleAndPermissionSeeder::class,
                DemoCompanySeeder::class,
                DemoCatalogSeeder::class,
                DemoInventorySeeder::class,
                DemoBillingSeeder::class,
            ]);
        });

        $this->printCredentials();
    }

    private function printCredentials(): void
    {
        if (! $this->command) {
            return;
        }

        $password = DemoCompanySeeder::PASSWORD;

        $rows = [];
        foreach (DemoCompanySeeder::companies() as $data) {
            foreach ($data['users'] as $user) {
                $rows[] = [$data['company']['name'], $user['role'], $user['email'], $password];
            }
        }

        $this->command->newLine();
        $this->command->info('Dados de demonstração criados. Contas disponíveis:');
        $this->command->table(['Empresa', 'Papel', 'Email', 'Password'], $rows);
    }
}
