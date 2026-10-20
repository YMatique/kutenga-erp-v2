<?php

namespace Tests\Feature;

use App\Models\Billing\Customer;
use App\Models\Billing\DocumentSeries;
use App\Models\Company;
use App\Models\User;
use App\Services\Billing\BillingService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/** A aplicação corre em UTC, mas "hoje" para o negócio é o dia de Maputo (UTC+2). */
class BusinessTimezoneTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    public function test_default_dates_follow_the_business_day_not_utc(): void
    {
        // 23:30 em UTC já é 01:30 de 1 de novembro em Maputo
        Carbon::setTestNow('2026-10-31 23:30:00');

        $company = Company::create(['name' => 'Empresa', 'nuit' => '123456789', 'address' => 'Maputo', 'phone' => '840000000', 'subscription_plan' => 'empresarial']);
        $user = User::create(['company_id' => $company->id, 'name' => 'Admin', 'email' => 'a@x.test', 'password' => bcrypt('password')]);
        $this->actingAs($user);
        DocumentSeries::create(['company_id' => $company->id, 'code' => 'A', 'name' => 'Série', 'year' => 2026, 'next_number' => 1, 'is_active' => true, 'created_by' => $user->id]);
        $customer = Customer::create(['company_id' => $company->id, 'name' => 'Cliente', 'nuit' => '111111111', 'balance' => 0, 'credit_limit' => 999999, 'is_active' => true]);

        $billing = app(BillingService::class);
        $draft = $billing->createDraft([
            'customer_id' => $customer->id, 'customer_name' => 'Cliente', 'customer_nuit' => '111111111',
            'document_type' => 'FT', 'items' => [['product_name' => 'Serviço', 'quantity' => 1, 'unit_price' => 100, 'tax_rate' => 0]],
        ], $company->id);

        $this->assertSame('2026-11-01', $draft->issue_date->toDateString());
        $this->assertSame('2026-11-01', $draft->due_date->toDateString());

        $billing->confirmAndEmit($draft->id);
        $billing->registerPayment($customer->id, 40, 'cash');

        $this->assertSame('2026-11-01', Carbon::parse(DB::table('payments')->value('payment_date'))->toDateString());
    }
}
