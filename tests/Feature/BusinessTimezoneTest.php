<?php

namespace Tests\Feature;

use App\Models\Billing\Customer;
use App\Models\Billing\Document;
use App\Models\Billing\DocumentSeries;
use App\Models\Catalog\Branch;
use App\Models\Company;
use App\Models\Pos\CashRegister;
use App\Models\Pos\PosShift;
use App\Models\Role;
use App\Models\User;
use App\Services\Billing\BillingService;
use App\Services\Printing\PosPrintService;
use App\Support\BusinessTime;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** A aplicação corre em UTC, mas "hoje" para o negócio é o dia de Maputo (UTC+2). */
class BusinessTimezoneTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;

    private User $owner;

    private Customer $customer;

    private BillingService $billing;

    protected function setUp(): void
    {
        parent::setUp();

        // 23:30 em UTC já é 01:30 de 1 de novembro em Maputo
        Carbon::setTestNow('2026-10-31 23:30:00');

        $this->company = Company::create(['name' => 'Empresa', 'nuit' => '123456789', 'address' => 'Maputo', 'phone' => '840000000', 'subscription_plan' => 'empresarial']);
        $this->owner = User::create(['company_id' => $this->company->id, 'name' => 'Dono', 'email' => 'a@x.test', 'password' => bcrypt('password')]);
        $this->owner->assignRole(Role::findOrCreate('owner', 'web'));
        $this->actingAs($this->owner);

        DocumentSeries::create(['company_id' => $this->company->id, 'code' => 'A', 'name' => 'Série', 'year' => 2026, 'next_number' => 1, 'is_active' => true, 'created_by' => $this->owner->id]);
        $this->customer = Customer::create(['company_id' => $this->company->id, 'name' => 'Cliente', 'nuit' => '111111111', 'balance' => 0, 'credit_limit' => 999999, 'is_active' => true]);
        $this->billing = app(BillingService::class);
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    private function issue(float $price, ?string $issued = null, ?string $due = null): Document
    {
        $payload = [
            'customer_id' => $this->customer->id, 'customer_name' => 'Cliente', 'customer_nuit' => '111111111',
            'document_type' => 'FT', 'items' => [['product_name' => 'Serviço', 'quantity' => 1, 'unit_price' => $price, 'tax_rate' => 0]],
        ];

        if ($issued) {
            $payload += ['issue_date' => $issued, 'due_date' => $due ?? $issued];
        }

        return $this->billing->confirmAndEmit($this->billing->createDraft($payload, $this->company->id)->id);
    }

    public function test_the_business_day_is_the_one_in_maputo(): void
    {
        $this->assertSame('2026-11-01', BusinessTime::date());
        $this->assertSame('01:30', BusinessTime::local(Carbon::now())->format('H:i'));
    }

    public function test_default_dates_follow_the_business_day_not_utc(): void
    {
        $draft = $this->billing->createDraft([
            'customer_id' => $this->customer->id, 'customer_name' => 'Cliente', 'customer_nuit' => '111111111',
            'document_type' => 'FT', 'items' => [['product_name' => 'Serviço', 'quantity' => 1, 'unit_price' => 100, 'tax_rate' => 0]],
        ], $this->company->id);

        $this->assertSame('2026-11-01', $draft->issue_date->toDateString());
        $this->assertSame('2026-11-01', $draft->due_date->toDateString());

        $this->billing->confirmAndEmit($draft->id);
        $this->billing->registerPayment($this->customer->id, 40, 'cash');

        $this->assertSame('2026-11-01', Carbon::parse(DB::table('payments')->value('payment_date'))->toDateString());
    }

    public function test_an_invoice_is_overdue_from_the_day_after_its_due_date_in_the_business_timezone(): void
    {
        $dueYesterday = $this->issue(100, '2026-10-01', '2026-10-31'); // em Maputo já é dia 1: venceu ontem
        $dueToday = $this->issue(100, '2026-10-01', '2026-11-01'); // vence hoje: ainda não está em atraso

        $this->artisan('app:check-document-status')->assertSuccessful();

        $this->assertSame('overdue', $dueYesterday->fresh()->status);
        $this->assertNotSame('overdue', $dueToday->fresh()->status);
    }

    public function test_an_inventory_closing_can_be_dated_with_the_business_day(): void
    {
        $payload = ['warehouse_id' => null, 'notes' => null];

        $this->post('/inventory/closings', $payload + ['reference_date' => '2026-11-01'])->assertSessionHasNoErrors();
        $this->assertSame(1, DB::table('inventory_closings')->count());

        // Amanhã (em Maputo) ainda é futuro
        $this->post('/inventory/closings', $payload + ['reference_date' => '2026-11-02'])->assertSessionHasErrors('reference_date');
        $this->assertSame(1, DB::table('inventory_closings')->count());
    }

    public function test_pos_today_and_the_day_report_use_the_business_day_and_clock(): void
    {
        $branch = Branch::create(['company_id' => $this->company->id, 'name' => 'Sede', 'code' => 'S', 'status' => 'active']);
        $register = CashRegister::create(['company_id' => $this->company->id, 'branch_id' => $branch->id, 'name' => 'Caixa 1']);
        $shift = PosShift::create([
            'company_id' => $this->company->id, 'branch_id' => $branch->id, 'cash_register_id' => $register->id,
            'user_id' => $this->owner->id, 'status' => 'open', 'opened_at' => now(), 'starting_cash' => 0,
        ]);

        $today = $this->issue(200); // 1 de novembro (emitida às 01:30 locais)
        $yesterday = $this->issue(50, '2026-10-31');
        Document::whereKey([$today->id, $yesterday->id])->update(['source_module' => 'pos', 'pos_shift_id' => $shift->id]);

        $this->get('/pos/shifts')->assertInertia(fn (Assert $page) => $page
            ->where('stats.today_sales', 200)
            ->where('stats.month_sales', 200) // novembro; a venda de 31 de outubro é do mês anterior
        );

        $report = app(PosPrintService::class)->dayData($this->owner, true);

        $this->assertSame(200.0, (float) $report['summary'][0][1]);
        $this->assertCount(1, $report['rows']);
        $this->assertSame('01:30', $report['rows'][0]['time']); // a hora local, não as 23:30 de UTC
        $this->assertSame('01/11/2026', $report['meta'][0]);
    }
}
