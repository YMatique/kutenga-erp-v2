<?php

namespace Database\Seeders\Demo;

use App\Models\Billing\Customer;
use App\Models\Billing\CustomerAddress;
use App\Models\Billing\CustomerContact;
use App\Models\Billing\DocumentSeries;
use App\Models\Company;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Séries documentais (necessárias para emitir qualquer documento) e clientes.
 *
 * Não cria faturas nem vendas: emite-as na aplicação para testar o fluxo real.
 */
class DemoBillingSeeder extends Seeder
{
    private const CUSTOMERS_LIMIT = [
        DemoCompanySeeder::NUIT_NOVA_ESPERANCA => 3,
    ];

    /** name, nuit, email, phone, address, credit_limit */
    public static function customers(): array
    {
        return [
            // Cliente por omissão usado pelo POS (o PosSaleController procura este NUIT).
            ['Consumidor Final', '999999999', null, null, null, 0],
            ['Mozbuild, Lda', '400111222', 'compras@mozbuild.demo', '+258 84 111 2222', 'Av. 25 de Setembro, 500, Maputo', 150000],
            ['Hotel Costa do Sol', '400333444', 'financeiro@costadosol.demo', '+258 82 333 4444', 'Av. Marginal, 1, Maputo', 250000],
            ['Escola Primária Eduardo Mondlane', '400555666', 'direccao@epem.demo', '+258 86 555 6666', 'Bairro da Polana, Maputo', 50000],
            ['Clínica Vida Nova', '400777888', 'admin@vidanova.demo', '+258 84 777 8888', 'Av. Karl Marx, 92, Maputo', 100000],
            ['Transportes Beira Expresso, SA', '400999000', 'contas@beiraexpresso.demo', '+258 82 999 0000', 'Rua do Chiveve, 12, Beira', 300000],
            ['João Machava', '104123456', 'joao.machava@example.com', '+258 87 123 4567', 'Bairro Central, Nampula', 20000],
            ['Maria Chissano (Cliente Particular)', '104654321', null, '+258 84 654 3210', 'Matola, Maputo', 0],
        ];
    }

    public function run(): void
    {
        foreach (DemoCompanySeeder::demoCompanies() as $company) {
            $ownerId = User::where('company_id', $company->id)->role('owner')->value('id');

            $this->seedSeries($company, $ownerId);
            $this->seedCustomers($company, $ownerId);
        }
    }

    private function seedSeries(Company $company, int $ownerId): void
    {
        DocumentSeries::updateOrCreate(
            ['company_id' => $company->id, 'code' => 'A', 'year' => now()->year],
            ['name' => 'Série Geral '.now()->year, 'is_active' => true, 'created_by' => $ownerId]
        );
    }

    private function seedCustomers(Company $company, int $ownerId): void
    {
        $customers = self::customers();

        if (isset(self::CUSTOMERS_LIMIT[$company->nuit])) {
            $customers = array_slice($customers, 0, self::CUSTOMERS_LIMIT[$company->nuit]);
        }

        foreach ($customers as [$name, $nuit, $email, $phone, $address, $creditLimit]) {
            $customer = Customer::withTrashed()->firstOrNew(['company_id' => $company->id, 'nuit' => $nuit]);

            $customer->forceFill([
                'name' => $name,
                'email' => $email,
                'phone' => $phone,
                'address' => $address,
                'credit_limit' => $creditLimit,
                'is_active' => true,
                'created_by' => $customer->created_by ?? $ownerId,
            ])->save();

            if ($customer->trashed()) {
                $customer->restore();
            }

            // Contacto e morada adicionais apenas para clientes empresariais (com email).
            if ($email && $customer->wasRecentlyCreated) {
                (new CustomerContact)->forceFill([
                    'customer_id' => $customer->id,
                    'name' => 'Departamento Financeiro',
                    'role' => 'Financeiro',
                    'phone' => $phone,
                    'email' => $email,
                    'created_by' => $ownerId,
                ])->save();

                (new CustomerAddress)->forceFill([
                    'customer_id' => $customer->id,
                    'type' => 'billing',
                    'address' => $address,
                    'city' => 'Maputo',
                    'province' => 'Maputo',
                    'country' => 'Moçambique',
                    'created_by' => $ownerId,
                ])->save();
            }
        }
    }
}
