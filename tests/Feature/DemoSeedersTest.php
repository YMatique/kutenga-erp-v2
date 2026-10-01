<?php

namespace Tests\Feature;

use App\Models\Pos\CashRegister;
use Database\Seeders\Demo\DemoCompanySeeder;
use Database\Seeders\Demo\DemoDataSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Os dados de demonstração têm de respeitar os limites dos planos que eles próprios usam,
 * senão a demo mostra empresas já "acima do limite" e o POS/API não são testáveis.
 */
class DemoSeedersTest extends TestCase
{
    use RefreshDatabase;

    public function test_demo_data_respects_plan_limits_and_is_idempotent(): void
    {
        $this->seed(DemoDataSeeder::class);

        $counts = fn () => [
            \App\Models\Company::count(),
            \App\Models\User::count(),
            CashRegister::count(),
            \App\Models\Catalog\Product::count(),
            \App\Models\Inventory\Warehouse::count(),
        ];
        $first = $counts();

        $this->seed(DemoDataSeeder::class); // segunda execução não duplica nada
        $this->assertSame($first, $counts());

        foreach (DemoCompanySeeder::demoCompanies() as $company) {
            foreach (['users', 'products', 'warehouses', 'cash_registers'] as $key) {
                $limit = $company->limit($key);

                $this->assertTrue(
                    $limit === null || $company->usage($key) <= $limit,
                    "{$company->name}: {$key} = {$company->usage($key)} excede o limite {$limit} do plano {$company->subscription_plan}"
                );
            }
        }
    }

    public function test_demo_companies_have_fixed_external_ids(): void
    {
        $this->seed(DemoDataSeeder::class);

        $ids = DemoCompanySeeder::demoCompanies()->pluck('external_id', 'nuit');

        $this->assertSame(DemoCompanySeeder::EXTERNAL_ID_KUTENGA, $ids[DemoCompanySeeder::NUIT_KUTENGA]);
        $this->assertSame(DemoCompanySeeder::EXTERNAL_ID_NOVA_ESPERANCA, $ids[DemoCompanySeeder::NUIT_NOVA_ESPERANCA]);
    }

    public function test_demo_registers_are_ready_for_pos(): void
    {
        $this->seed(DemoDataSeeder::class);

        $company = DemoCompanySeeder::demoCompanies()->firstWhere('nuit', DemoCompanySeeder::NUIT_KUTENGA);
        $registers = CashRegister::where('company_id', $company->id)->with(['branch', 'warehouse'])->get();

        $this->assertCount(2, $registers);
        $this->assertTrue($company->can('pos'));

        foreach ($registers as $register) {
            $this->assertNotNull($register->branch, "{$register->name} sem filial");
            $this->assertNotNull($register->warehouse, "{$register->name} sem armazém");
            $this->assertSame($company->id, $register->warehouse->company_id);
        }

        // A empresa em plano inicial não tem POS, logo não tem caixas
        $inicial = DemoCompanySeeder::demoCompanies()->firstWhere('nuit', DemoCompanySeeder::NUIT_NOVA_ESPERANCA);
        $this->assertFalse($inicial->can('pos'));
        $this->assertSame(0, CashRegister::where('company_id', $inicial->id)->count());
    }

    public function test_demo_company_is_reachable_through_the_subscription_api(): void
    {
        $this->seed(DemoDataSeeder::class);
        config(['subscription.api.secret' => 'segredo']);

        $ts = (string) time();
        $uri = '/api/internal/companies/' . DemoCompanySeeder::EXTERNAL_ID_KUTENGA . '/subscription';

        $this->call('GET', $uri, [], [], [], [
            'HTTP_X-Kutenga-Timestamp' => $ts,
            'HTTP_X-Kutenga-Signature' => hash_hmac('sha256', $ts . '.', 'segredo'),
        ])->assertOk()->assertJsonPath('plan', 'crescimento')->assertJsonPath('state', 'active');
    }
}
