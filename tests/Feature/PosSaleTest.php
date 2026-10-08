<?php

namespace Tests\Feature;

use App\Models\Billing\Customer;
use App\Models\Billing\DocumentSeries;
use App\Models\Catalog\Branch;
use App\Models\Catalog\Product;
use App\Models\Company;
use App\Models\Inventory\Warehouse;
use App\Models\Pos\CashRegister;
use App\Models\Pos\PosShift;
use App\Models\User;
use App\Services\Inventory\StockService;
use App\Services\Printing\EscPos;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class PosSaleTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected Company $company;

    protected Branch $branch;

    protected Warehouse $warehouse;

    protected Product $product;

    protected DocumentSeries $series;

    protected PosShift $shift;

    protected CashRegister $register;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::create([
            'name' => 'Kutenga Test Company',
            'nuit' => '123456789',
            'address' => 'Maputo, Moçambique',
            'phone' => '+258840000000',
            'subscription_plan' => 'crescimento',
        ]);

        $this->branch = Branch::create([
            'company_id' => $this->company->id,
            'name' => 'Main Branch',
            'code' => 'BR01',
            'status' => 'active',
        ]);

        $this->user = User::create([
            'company_id' => $this->company->id,
            'branch_id' => $this->branch->id,
            'name' => 'Admin User',
            'email' => 'admin@kutenga.test',
            'password' => bcrypt('password'),
        ]);

        Permission::findOrCreate('sales.create', 'web');
        Permission::findOrCreate('sales.view', 'web');
        $this->user->givePermissionTo(['sales.create', 'sales.view']);

        $this->actingAs($this->user);

        $this->warehouse = Warehouse::create([
            'company_id' => $this->company->id,
            'name' => 'Main Warehouse',
            'code' => 'MW01',
            'is_active' => true,
        ]);

        $this->product = Product::create([
            'company_id' => $this->company->id,
            'name' => 'Test Product',
            'slug' => 'test-product',
            'sku' => 'PROD-001',
            'price' => '100.00',
            'tax_rate' => '16.00',
            'track_stock' => true,
            'status' => 'active',
        ]);

        // Initialize stock
        $stockService = app(StockService::class);
        $stockService->opening($this->product, $this->warehouse, 10.00);

        $this->series = DocumentSeries::create([
            'company_id' => $this->company->id,
            'code' => 'A',
            'name' => 'Série Geral 2026',
            'year' => 2026,
            'next_number' => 1,
            'is_active' => true,
            'created_by' => $this->user->id,
        ]);

        $this->register = CashRegister::create([
            'company_id' => $this->company->id,
            'branch_id' => $this->branch->id,
            'name' => 'Caixa 1',
        ]);

        $this->shift = PosShift::create([
            'company_id' => $this->company->id,
            'branch_id' => $this->branch->id,
            'cash_register_id' => $this->register->id,
            'user_id' => $this->user->id,
            'status' => 'open',
            'opened_at' => now(),
            'starting_cash' => 1000.00,
        ]);
    }

    public function test_pos_sale_processes_correctly_with_nuit()
    {
        $payload = [
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'product_name' => $this->product->name,
                    'quantity' => 2,
                    'unit_price' => 100.00,
                    'tax_rate' => 16.00,
                    'discount_percent' => 0,
                ],
            ],
            'payment_method' => 'cash',
            'amount_paid' => 232.00, // 200 + 32 tax
        ];

        $response = $this->postJson(route('pos.sales.store'), $payload);
        $response->assertStatus(200);
        $response->assertJsonPath('message', 'Venda concluída com sucesso');

        // Check customer was created with correct nuit
        $this->assertDatabaseHas('customers', [
            'company_id' => $this->company->id,
            'name' => 'Consumidor Final',
            'nuit' => '999999999',
        ]);

        // Check document was created with correct customer details
        $this->assertDatabaseHas('documents', [
            'company_id' => $this->company->id,
            'customer_nuit' => '999999999',
            'customer_name' => 'Consumidor Final',
            'document_type' => 'FR',
        ]);
    }

    private function salePayload(string $method = 'cash', float $paid = 116.00): array
    {
        return [
            'items' => [[
                'product_id' => $this->product->id,
                'product_name' => $this->product->name,
                'quantity' => 1,
                'unit_price' => 100.00,
                'tax_rate' => 16.00,
                'discount_percent' => 0,
            ]],
            'payment_method' => $method,
            'amount_paid' => $paid,
        ];
    }

    public function test_cash_sale_with_insufficient_amount_is_rejected(): void
    {
        $this->postJson(route('pos.sales.store'), $this->salePayload('cash', 50.00))
            ->assertStatus(422);

        $this->assertDatabaseCount('documents', 0);
    }

    public function test_cash_sale_returns_change(): void
    {
        $this->postJson(route('pos.sales.store'), $this->salePayload('cash', 200.00))
            ->assertOk()
            ->assertJsonPath('change', 84);
    }

    public function test_closing_shift_expects_only_cash_and_stores_difference(): void
    {
        $this->postJson(route('pos.sales.store'), $this->salePayload('cash', 116.00))->assertOk();
        $this->postJson(route('pos.sales.store'), $this->salePayload('card', 116.00))->assertOk();

        $this->post(route('pos.shifts.close', $this->shift), ['ending_cash' => 1100.00])
            ->assertRedirect();

        $this->shift->refresh();
        // 1000 de fundo + 116 em dinheiro (o cartão não entra na gaveta)
        $this->assertEquals(1116.00, (float) $this->shift->expected_cash);
        $this->assertEquals(-16.00, (float) $this->shift->cash_difference);
        $this->assertEquals(116.00, $this->shift->payment_totals['card']);
    }

    public function test_register_cannot_have_two_open_shifts(): void
    {
        $other = User::create([
            'company_id' => $this->company->id,
            'branch_id' => $this->branch->id,
            'name' => 'Operador 2',
            'email' => 'op2@kutenga.test',
            'password' => bcrypt('password'),
        ]);
        $other->givePermissionTo('sales.create');

        $this->actingAs($other)
            ->post(route('pos.shifts.store'), [
                'starting_cash' => 0,
                'cash_register_id' => $this->register->id,
            ])
            ->assertSessionHasErrors('cash_register_id');

        $this->assertEquals(1, PosShift::where('status', 'open')->count());
    }

    public function test_default_register_is_created_when_company_has_none(): void
    {
        $this->shift->update(['status' => 'closed', 'closed_at' => now()]);
        $this->register->forceDelete();

        $this->post(route('pos.shifts.store'), ['starting_cash' => 50])
            ->assertRedirect(route('pos.index'));

        $this->assertDatabaseHas('cash_registers', ['company_id' => $this->company->id, 'name' => 'Caixa Principal']);
        $this->assertEquals(1, PosShift::where('status', 'open')->count());
    }

    public function test_receipt_shows_fiscal_number_payment_and_change(): void
    {
        $id = $this->postJson(route('pos.sales.store'), $this->salePayload('cash', 200.00))
            ->assertOk()
            ->json('document.id');

        $this->get(route('pos.receipts.show', $id))
            ->assertOk()
            ->assertSee('FR P'.$this->register->id.'/', false)->assertSee('Venda a Dinheiro')
            ->assertSee('IVA (16%)')
            ->assertSee('Entregue')
            ->assertSee('84,00')
            ->assertSee('Caixa 1');
    }

    public function test_receipt_respects_company_paper_width(): void
    {
        $this->company->update(['thermal_paper_width' => 58]);

        $id = $this->postJson(route('pos.sales.store'), $this->salePayload())->json('document.id');

        $this->get(route('pos.receipts.show', $id))->assertOk()->assertSee('58mm', false);
    }

    public function test_shift_summary_and_day_reports_render(): void
    {
        $this->postJson(route('pos.sales.store'), $this->salePayload('cash', 116.00))->assertOk();
        $this->postJson(route('pos.sales.store'), $this->salePayload('card', 116.00))->assertOk();

        $this->get(route('pos.shifts.print.summary', $this->shift))
            ->assertOk()->assertSee('Dinheiro esperado')->assertSee('1.116,00', false);

        $this->get(route('pos.shifts.print.sales', $this->shift))->assertOk()->assertSee('2 vendas');
        $this->get(route('pos.print.day'))->assertOk()->assertSee('Vendas do Dia');
    }

    public function test_cash_register_limit_of_the_plan_is_enforced(): void
    {
        Permission::findOrCreate('pos.manage', 'web');
        $this->user->givePermissionTo('pos.manage');

        // Plano Crescimento: máximo 2 caixas (já existe 1)
        $payload = ['name' => 'Nova', 'branch_id' => $this->branch->id, 'printer_driver' => 'browser'];

        $this->post(route('pos.registers.store'), $payload + ['name' => 'Caixa 2'])->assertSessionHasNoErrors();
        $this->post(route('pos.registers.store'), $payload + ['name' => 'Caixa 3'])->assertSessionHasErrors('subscription');

        $this->assertEquals(2, $this->company->getCashRegistersCount());
    }

    public function test_pos_sales_use_the_register_series_not_the_billing_series(): void
    {
        $this->postJson(route('pos.sales.store'), $this->salePayload())->assertOk();
        $this->postJson(route('pos.sales.store'), $this->salePayload())->assertOk();

        $posSeries = DocumentSeries::where('scope', 'pos')->first();

        $this->assertNotNull($posSeries);
        $this->assertEquals('P'.$this->register->id, $posSeries->code);
        $this->assertEquals(3, $posSeries->next_number);
        $this->assertEquals($posSeries->id, $this->register->fresh()->series_id);

        // A série de faturação não foi consumida
        $this->assertEquals(1, $this->series->fresh()->next_number);
        $this->assertDatabaseHas('documents', ['document_number' => 'FR P'.$this->register->id.'/'.date('Y').'/00001']);
    }

    public function test_print_job_for_browser_driver_returns_the_html_url(): void
    {
        $id = $this->postJson(route('pos.sales.store'), $this->salePayload())->json('document.id');

        $this->getJson(route('pos.print.job', ['type' => 'receipt', 'id' => $id]))
            ->assertOk()
            ->assertJsonPath('driver', 'browser')
            ->assertJsonPath('url', '/pos/receipts/'.$id);
    }

    public function test_print_job_for_qz_driver_returns_escpos_bytes(): void
    {
        $this->register->update(['printer_driver' => 'qz', 'printer_name' => 'EPSON TM-T20', 'open_drawer' => true]);

        $id = $this->postJson(route('pos.sales.store'), $this->salePayload('cash', 200.00))->json('document.id');

        $job = $this->getJson(route('pos.print.job', ['type' => 'receipt', 'id' => $id]))
            ->assertOk()
            ->assertJsonPath('driver', 'qz')
            ->assertJsonPath('printer', 'EPSON TM-T20')
            ->json();

        $bytes = base64_decode($job['data']);

        $this->assertStringStartsWith('@', $bytes);           // inicialização
        $this->assertStringContainsString('p ', $bytes);    // gaveta (venda em dinheiro)
        $this->assertStringContainsString('TOTAL', $bytes);
        $this->assertStringContainsString('V', $bytes);       // corte
    }

    public function test_escpos_encodes_portuguese_accents_in_cp850(): void
    {
        $esc = (new EscPos(80))->line('Venda à vista - ção');

        $this->assertStringContainsString(mb_convert_encoding('Venda à vista - ção', 'CP850', 'UTF-8'), $esc->bytes());
        $this->assertEquals(48, $esc->columns());
        $this->assertEquals(32, (new EscPos(58))->columns());
    }

    public function test_network_driver_without_host_reports_error_and_fallback(): void
    {
        $this->register->update(['printer_driver' => 'network', 'printer_host' => null]);

        $this->getJson(route('pos.print.job', ['type' => 'shift-summary', 'id' => $this->shift->id]))
            ->assertStatus(502)
            ->assertJsonPath('driver', 'network')
            ->assertJsonStructure(['error', 'fallback_url']);
    }

    public function test_billing_series_listing_excludes_pos_series(): void
    {
        $this->postJson(route('pos.sales.store'), $this->salePayload())->assertOk();

        $billing = DocumentSeries::where('company_id', $this->company->id)->where('scope', 'billing')->pluck('code');

        $this->assertEquals(['A'], $billing->all());
    }
}
