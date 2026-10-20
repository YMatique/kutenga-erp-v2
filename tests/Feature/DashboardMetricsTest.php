<?php

namespace Tests\Feature;

use App\Models\Billing\Customer;
use App\Models\Billing\Document;
use App\Models\Billing\DocumentSeries;
use App\Models\Catalog\Product;
use App\Models\Company;
use App\Models\Inventory\Warehouse;
use App\Models\Role;
use App\Models\User;
use App\Services\Billing\BillingService;
use App\Services\Inventory\StockService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

/** Números do dashboard principal: faturado líquido, a receber, vencido, recebido e o gráfico mensal. */
class DashboardMetricsTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;

    private User $owner;

    private Customer $customer;

    private BillingService $billing;

    protected function setUp(): void
    {
        parent::setUp();

        Carbon::setTestNow('2026-10-20 10:00:00');

        $this->company = Company::create(['name' => 'Empresa', 'nuit' => '123456789', 'address' => 'Maputo', 'phone' => '840000000', 'subscription_plan' => 'empresarial']);
        $this->owner = User::create(['company_id' => $this->company->id, 'name' => 'Dono', 'email' => 'dono@x.test', 'password' => bcrypt('password')]);
        $this->owner->assignRole(Role::findOrCreate('owner', 'web'));
        $this->actingAs($this->owner);

        DocumentSeries::create([
            'company_id' => $this->company->id, 'code' => 'A', 'name' => 'Série', 'year' => 2026,
            'next_number' => 1, 'is_active' => true, 'created_by' => $this->owner->id,
        ]);

        $this->customer = $this->customer('Cliente A', '111111111');
        $this->billing = app(BillingService::class);
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    private function customer(string $name, string $nuit): Customer
    {
        return Customer::create(['company_id' => $this->company->id, 'name' => $name, 'nuit' => $nuit, 'balance' => 0, 'credit_limit' => 999999, 'is_active' => true]);
    }

    /** Emite um documento de serviços (sem IVA, para os totais serem redondos). */
    private function issue(string $type, float $price, string $issued, ?string $due = null, ?Customer $customer = null, array $extra = [], string $item = 'Serviço'): Document
    {
        $customer ??= $this->customer;

        $draft = $this->billing->createDraft($extra + [
            'customer_id' => $customer->id, 'customer_name' => $customer->name, 'customer_nuit' => $customer->nuit,
            'document_type' => $type, 'issue_date' => $issued, 'due_date' => $due ?? $issued,
            'items' => [['product_name' => $item, 'quantity' => 1, 'unit_price' => $price, 'tax_rate' => 0]],
        ], $this->company->id);

        return $this->billing->confirmAndEmit($draft->id);
    }

    private function props(): array
    {
        return $this->get('/dashboard')->assertOk()->viewData('page')['props'];
    }

    public function test_receivables_discount_partial_payments_and_credit_notes_and_split_out_the_overdue(): void
    {
        $a = $this->issue('FT', 1000, '2026-10-01', '2026-10-05'); // vencida
        $this->billing->registerPayment($this->customer->id, 400, 'cash'); // só a A existe: fica com 600 em dívida

        $this->issue('FT', 500, '2026-10-10', '2026-11-05'); // ainda no prazo
        $c = $this->issue('FT', 300, '2026-09-20', '2026-10-01'); // vencida, mas anulada por uma nota de crédito
        $this->issue('NC', 300, '2026-10-12', null, null, ['referenced_document_id' => $c->id]);

        $metrics = $this->props()['metrics'];

        $this->assertSame(1100.0, (float) $metrics['receivables']['value']); // 600 + 500
        $this->assertSame(2, $metrics['receivables']['invoices']);
        $this->assertSame(600.0, (float) $metrics['overdue']['value']);
        $this->assertSame(1, $metrics['overdue']['invoices']);

        // Bate com o saldo do cliente, que a aplicação já mantém
        $this->assertSame(1100.0, (float) $this->customer->fresh()->balance);
        $this->assertSame('partial', $a->fresh()->status);
    }

    public function test_invoices_flagged_overdue_by_the_daily_command_still_count(): void
    {
        $this->issue('FT', 1000, '2026-10-01', '2026-10-05'); // vencida
        $this->issue('FT', 500, '2026-10-02', '2026-11-05'); // no prazo

        // O comando agendado passa as faturas vencidas ao estado "overdue"
        $this->artisan('app:check-document-status')->assertSuccessful();
        $this->assertSame(1, Document::where('status', 'overdue')->count());

        $props = $this->props();

        $this->assertSame(1500.0, (float) $props['metrics']['billed_month']['value']);
        $this->assertSame(1500.0, (float) $props['metrics']['receivables']['value']);
        $this->assertSame(2, $props['metrics']['receivables']['invoices']);
        $this->assertSame(1000.0, (float) $props['metrics']['overdue']['value']);
        $this->assertSame(1, $props['metrics']['overdue']['invoices']);
        $this->assertContains('overdue', collect($props['recent_sales'])->pluck('state')->all());
        $this->assertEqualsCanonicalizing([['name' => 'Cliente A', 'value' => 1500.0]], $props['top_customers']);
    }

    public function test_billed_month_is_net_of_credit_notes_and_compared_with_the_same_days_of_last_month(): void
    {
        $this->issue('FT', 100, '2026-09-05');
        $this->issue('FT', 200, '2026-09-25'); // depois do dia 20: fora da comparação, dentro do mês de setembro
        $invoice = $this->issue('FT', 400, '2026-10-03');
        $this->issue('FR', 100, '2026-10-10');
        $this->issue('NC', 50, '2026-10-12', null, null, ['referenced_document_id' => $invoice->id]);
        $this->issue('FT', 999, '2026-01-15'); // fora dos 6 meses do gráfico

        // Rascunho: não conta
        $this->billing->createDraft([
            'customer_id' => $this->customer->id, 'customer_name' => 'Cliente A', 'customer_nuit' => '111111111',
            'document_type' => 'FT', 'issue_date' => '2026-10-15', 'due_date' => '2026-10-15',
            'items' => [['product_name' => 'Rascunho', 'quantity' => 1, 'unit_price' => 777, 'tax_rate' => 0]],
        ], $this->company->id);

        $props = $this->props();

        $this->assertSame(450.0, (float) $props['metrics']['billed_month']['value']); // 400 + 100 − 50
        $this->assertSame(100.0, (float) $props['metrics']['billed_month']['previous']); // 1 a 20 de setembro
        $this->assertSame(350.0, (float) $props['metrics']['billed_month']['change']);

        $chart = collect($props['chart_data']);
        $this->assertSame(['2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10'], $chart->pluck('month')->all());
        $this->assertSame(300.0, (float) $chart->firstWhere('month', '2026-09')['value']);
        $this->assertSame(450.0, (float) $chart->firstWhere('month', '2026-10')['value']);
        $this->assertTrue($chart->firstWhere('month', '2026-10')['current']);
        $this->assertSame(0.0, (float) $chart->firstWhere('month', '2026-05')['value']);
    }

    public function test_change_is_unknown_when_last_month_had_no_sales(): void
    {
        $this->issue('FT', 100, '2026-10-02');

        $this->assertNull($this->props()['metrics']['billed_month']['change']);
    }

    public function test_months_are_the_right_ones_on_the_31st_and_follow_the_business_timezone(): void
    {
        // 31/03: subtrair um mês a "31 de fevereiro" saltaria para março e repetia-o
        Carbon::setTestNow('2026-03-31 10:00:00');
        $this->assertSame(
            ['2025-10', '2025-11', '2025-12', '2026-01', '2026-02', '2026-03'],
            collect($this->props()['chart_data'])->pluck('month')->all()
        );

        // 23:30 em UTC já é 01:30 do dia 1 de novembro em Maputo: a venda dessa hora é de novembro
        Carbon::setTestNow('2026-10-31 23:30:00');
        $this->issue('FR', 80, '2026-11-01');

        $chart = collect($this->props()['chart_data']);
        $this->assertSame('2026-11', $chart->last()['month']);
        $this->assertSame(80.0, (float) $chart->last()['value']);
        $this->assertSame(6, $chart->pluck('month')->unique()->count());
    }

    public function test_sales_are_placed_by_issue_date_not_by_when_the_record_was_created(): void
    {
        $this->issue('FT', 250, '2026-07-15'); // registada hoje, emitida em julho

        $chart = collect($this->props()['chart_data']);

        $this->assertSame(250.0, (float) $chart->firstWhere('month', '2026-07')['value']);
        $this->assertSame(0.0, (float) $chart->firstWhere('month', '2026-10')['value']);
    }

    public function test_received_this_month_counts_payments_registered_in_the_month(): void
    {
        $this->issue('FT', 1000, '2026-10-01', '2026-10-30');
        $this->billing->registerPayment($this->customer->id, 300, 'cash');
        $this->billing->registerPayment($this->customer->id, 200, 'bank');

        DB::table('payments')->insert([
            'company_id' => $this->company->id, 'customer_id' => $this->customer->id, 'payment_method' => 'cash',
            'amount' => 999, 'payment_date' => '2026-09-30', 'created_by' => $this->owner->id,
            'created_at' => now(), 'updated_at' => now(),
        ]);

        $received = $this->props()['metrics']['received_month'];

        $this->assertSame(500.0, (float) $received['value']);
        $this->assertSame(2, $received['payments']);
    }

    public function test_top_customers_and_products_are_the_net_of_the_month(): void
    {
        $b = $this->customer('Cliente B', '222222222');

        $big = $this->issue('FT', 900, '2026-10-02', null, $this->customer, [], 'Computador');
        $this->issue('FT', 300, '2026-10-03', null, $b, [], 'Cadeira');
        $this->issue('FT', 200, '2026-10-04', null, $b, [], 'Computador');
        $this->issue('NC', 800, '2026-10-05', null, $this->customer, ['referenced_document_id' => $big->id], 'Computador');
        $this->issue('FT', 5000, '2026-09-10', null, $b, [], 'Mês anterior'); // não conta: é do mês passado

        $props = $this->props();

        // A: 900 − 800 = 100; B: 300 + 200 = 500
        $this->assertSame([['name' => 'Cliente B', 'value' => 500.0], ['name' => 'Cliente A', 'value' => 100.0]], $props['top_customers']);
        // Computador: 900 + 200 − 800 = 300; Cadeira: 300
        $this->assertEqualsCanonicalizing(
            [['name' => 'Computador', 'value' => 300.0], ['name' => 'Cadeira', 'value' => 300.0]],
            $props['top_products']
        );
    }

    public function test_recent_sales_show_how_each_one_stands_and_are_ordered_by_issue_date(): void
    {
        $this->issue('FT', 100, '2026-10-01', '2026-10-30'); // por pagar, no prazo
        $this->issue('FT', 100, '2026-09-01', '2026-09-30'); // por pagar, vencida
        $this->issue('FR', 100, '2026-10-15'); // paga no ato
        $partial = $this->issue('FT', 100, '2026-10-18', '2026-10-30');
        Document::whereKey($partial->id)->update(['status' => 'partial', 'payment_status' => 'partial']);

        $sales = collect($this->props()['recent_sales']);

        $this->assertSame(['partial', 'paid', 'unpaid', 'overdue'], $sales->pluck('state')->all());
        $this->assertSame(['2026-10-18', '2026-10-15', '2026-10-01', '2026-09-01'], $sales->pluck('issue_date')->all());
    }

    public function test_a_deleted_product_or_warehouse_in_the_recent_movements_does_not_break_the_page(): void
    {
        $warehouse = Warehouse::create(['company_id' => $this->company->id, 'name' => 'Central', 'code' => 'C', 'is_active' => true]);
        $product = Product::create(['company_id' => $this->company->id, 'name' => 'Caneta', 'slug' => 'caneta', 'sku' => 'CAN', 'price' => 1, 'track_stock' => true, 'status' => 'active']);
        $stock = app(StockService::class);
        $stock->in($product, $warehouse, 5);
        $stock->out($product, $warehouse, 5);

        $product->delete();
        $warehouse->delete();

        $this->get('/dashboard')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->has('recent_activity', 2)
            ->where('recent_activity.0.product_name', 'Caneta')
            ->where('recent_activity.0.warehouse_name', 'Central')
        );
    }

    public function test_stock_alerts_count_the_same_products_as_the_inventory_dashboard(): void
    {
        $warehouse = Warehouse::create(['company_id' => $this->company->id, 'name' => 'Central', 'code' => 'C', 'is_active' => true]);
        $product = fn (string $name, float $min) => Product::create([
            'company_id' => $this->company->id, 'name' => $name, 'slug' => $name, 'sku' => $name, 'price' => 1,
            'track_stock' => true, 'min_stock' => $min, 'status' => 'active',
        ]);

        app(StockService::class)->in($product('Baixo', 5), $warehouse, 3);
        app(StockService::class)->in($product('Bom', 5), $warehouse, 50);
        $product('Esgotado', 5);

        $this->get('/dashboard')->assertInertia(fn (Assert $page) => $page->where('metrics.stock_alerts', 2));
        $this->get('/inventory')->assertInertia(fn (Assert $page) => $page->where('stats.low_stock', 1)->where('stats.out_of_stock', 1));
    }

    public function test_quick_actions_and_links_follow_the_permissions_of_the_user(): void
    {
        foreach (['reports.view', 'invoice.create', 'inventory.view'] as $permission) {
            Permission::findOrCreate($permission, 'web');
        }
        $user = User::create(['company_id' => $this->company->id, 'name' => 'Contab', 'email' => 'c@x.test', 'password' => bcrypt('password')]);
        $user->givePermissionTo(['reports.view', 'invoice.create']);

        $this->actingAs($user)->get('/dashboard')->assertInertia(fn (Assert $page) => $page
            ->where('can.create_invoice', true)
            ->where('can.inventory', false)
            ->where('can.catalog', false)
            ->where('can.pos', false)
            ->where('can.create_customer', false)
        );
    }
}
