<?php

namespace Database\Seeders\Demo;

use App\Models\Catalog\Branch;
use App\Models\Company;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

/**
 * Empresas, filiais e utilizadores de demonstração.
 *
 * Duas empresas com planos diferentes, para testar o isolamento multi-empresa
 * e os limites de subscrição. Todos os utilizadores usam a password "password".
 */
class DemoCompanySeeder extends Seeder
{
    public const NUIT_KUTENGA = '123456789';
    public const NUIT_NOVA_ESPERANCA = '400987654';

    public const PASSWORD = 'password';

    public static function companies(): array
    {
        return [
            [
                'company' => [
                    'nuit' => self::NUIT_KUTENGA,
                    'name' => 'Kutenga ERP Demo, Lda',
                    'email' => 'admin@kutenga.com',
                    'phone' => '+258 84 000 0001',
                    'address' => 'Av. Julius Nyerere, 1200, Maputo',
                    'subscription_plan' => 'crescimento',
                    'bank_accounts' => [
                        ['bank_name' => 'BCI', 'account_number' => '0001 0000 1234 5678 9', 'iban' => 'MZ59 0008 0000 0012 3456 7890 1'],
                        ['bank_name' => 'Millennium BIM', 'account_number' => '0002 0000 9876 5432 1', 'iban' => 'MZ59 0001 0000 0098 7654 3210 1'],
                    ],
                ],
                'branches' => [
                    ['code' => 'MATRIZ', 'name' => 'Unidade Sede', 'address' => 'Av. Julius Nyerere, 1200, Maputo', 'phone' => '+258 84 000 0001'],
                    ['code' => 'BEIRA', 'name' => 'Filial da Beira', 'address' => 'Rua Correia de Brito, 45, Beira', 'phone' => '+258 84 000 0002'],
                    ['code' => 'NAMPULA', 'name' => 'Filial de Nampula', 'address' => 'Av. Eduardo Mondlane, 310, Nampula', 'phone' => '+258 84 000 0003'],
                ],
                'users' => [
                    ['name' => 'Administrador', 'email' => 'test@example.com', 'role' => 'owner', 'branch' => 'MATRIZ'],
                    ['name' => 'Ana Administradora', 'email' => 'admin@kutenga.demo', 'role' => 'Admin', 'branch' => 'MATRIZ'],
                    ['name' => 'Carlos Gerente', 'email' => 'gerente@kutenga.demo', 'role' => 'Manager', 'branch' => 'MATRIZ'],
                    ['name' => 'Olga Operadora', 'email' => 'operador@kutenga.demo', 'role' => 'Operator', 'branch' => 'MATRIZ'],
                    ['name' => 'Bento da Beira', 'email' => 'beira@kutenga.demo', 'role' => 'Operator', 'branch' => 'BEIRA'],
                ],
            ],
            [
                'company' => [
                    'nuit' => self::NUIT_NOVA_ESPERANCA,
                    'name' => 'Mercearia Nova Esperança',
                    'email' => 'geral@novaesperanca.demo',
                    'phone' => '+258 82 000 0100',
                    'address' => 'Rua da Resistência, 88, Matola',
                    'subscription_plan' => 'inicial',
                    'bank_accounts' => [],
                ],
                'branches' => [
                    ['code' => 'MATRIZ', 'name' => 'Loja Principal', 'address' => 'Rua da Resistência, 88, Matola', 'phone' => '+258 82 000 0100'],
                ],
                'users' => [
                    ['name' => 'Dona Esperança', 'email' => 'dono@novaesperanca.demo', 'role' => 'owner', 'branch' => 'MATRIZ'],
                    ['name' => 'Joaquim Caixa', 'email' => 'caixa@novaesperanca.demo', 'role' => 'Operator', 'branch' => 'MATRIZ'],
                ],
            ],
        ];
    }

    /** @return \Illuminate\Database\Eloquent\Collection<int, Company> */
    public static function demoCompanies()
    {
        return Company::whereIn('nuit', [self::NUIT_KUTENGA, self::NUIT_NOVA_ESPERANCA])->get();
    }

    public function run(): void
    {
        // O papel "owner" é atribuído por nome (Gate::before) e o nome é único por guard.
        Role::findOrCreate('owner', 'web');

        foreach (self::companies() as $data) {
            $company = Company::updateOrCreate(
                ['nuit' => $data['company']['nuit']],
                $data['company'] + [
                    'status' => 'active',
                    'subscription_status' => 'active',
                    'subscription_ends_at' => now()->addYear(),
                    'default_currency' => 'MZN',
                    'default_tax_rate' => 16,
                    'default_due_days' => 30,
                ]
            );

            $branches = [];
            foreach ($data['branches'] as $branch) {
                $branches[$branch['code']] = Branch::updateOrCreate(
                    ['company_id' => $company->id, 'code' => $branch['code']],
                    $branch + ['status' => 'active']
                );
            }

            foreach ($data['users'] as $row) {
                $user = User::updateOrCreate(
                    ['email' => $row['email']],
                    [
                        'name' => $row['name'],
                        'password' => Hash::make(self::PASSWORD),
                        'company_id' => $company->id,
                        'branch_id' => $branches[$row['branch']]->id,
                        'status' => 'active',
                    ]
                );

                if (! $user->email_verified_at) {
                    $user->forceFill(['email_verified_at' => now()])->save();
                }

                $user->syncRoles([$row['role']]);
            }
        }
    }
}
