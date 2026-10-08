<?php

namespace Tests\Feature;

use App\Models\Billing\Document;
use App\Models\Billing\Payment;
use App\Models\Catalog\Branch;
use App\Models\Catalog\Product;
use App\Models\Company;
use App\Models\Inventory\Warehouse;
use App\Models\Pos\CashRegister;
use App\Models\Pos\PosShift;
use App\Models\Role;
use App\Models\User;
use App\Services\Billing\BillingService;
use App\Services\Inventory\StockService;
use App\Services\Printing\PosPrintService;
use App\Support\PrinterHost;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use RuntimeException;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

/**
 * POS: vendas idempotentes, erros sem fugas internas, turnos exclusivos por caixa
 * e impressoras de rede restritas à rede local.
 */
class PosHardeningTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;

    private Branch $branch;

    private User $user;

    private Warehouse $warehouse;

    private CashRegister $register;

    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::create([
            'name' => 'Empresa', 'nuit' => '123456789', 'address' => 'Maputo', 'phone' => '840000000',
            'subscription_plan' => 'empresarial',
        ]);

        $this->branch = Branch::create(['company_id' => $this->company->id, 'name' => 'Sede', 'code' => 'S', 'status' => 'active']);

        $this->user = User::create([
            'company_id' => $this->company->id, 'branch_id' => $this->branch->id,
            'name' => 'Admin', 'email' => 'admin@test.test', 'password' => bcrypt('password'),
        ]);

        foreach (['sales.create', 'sales.view', 'pos.manage'] as $permission) {
            Permission::findOrCreate($permission, 'web');
        }
        $role = Role::findOrCreate('Admin', 'web');
        $role->syncPermissions(['sales.create', 'sales.view', 'pos.manage']);
        $this->user->assignRole($role);

        $this->warehouse = Warehouse::create(['company_id' => $this->company->id, 'name' => 'Armazém', 'code' => 'W1', 'is_active' => true]);

        $this->register = CashRegister::create([
            'company_id' => $this->company->id, 'branch_id' => $this->branch->id,
            'name' => 'Caixa 1', 'warehouse_id' => $this->warehouse->id,
        ]);

        $this->product = Product::create([
            'company_id' => $this->company->id, 'name' => 'Caneta', 'slug' => 'caneta', 'sku' => 'CAN-1',
            'price' => '100.00', 'tax_rate' => '16.00', 'type' => 'product', 'track_stock' => true, 'status' => 'active',
        ]);
        app(StockService::class)->opening($this->product, $this->warehouse, 10);

        $this->actingAs($this->user);
    }

    private function openShift(): PosShift
    {
        return PosShift::create([
            'company_id' => $this->company->id, 'branch_id' => $this->branch->id, 'cash_register_id' => $this->register->id,
            'user_id' => $this->user->id, 'status' => 'open', 'opened_at' => now(), 'starting_cash' => 0,
        ]);
    }

    private function sale(array $overrides = []): array
    {
        return $overrides + [
            'items' => [[
                'product_id' => $this->product->id,
                'product_name' => 'Caneta',
                'quantity' => 1,
                'unit_price' => 100,
                'tax_rate' => 16,
                'discount_percent' => 0,
            ]],
            'payment_method' => 'cash',
            'amount_paid' => 116,
        ];
    }

    private function stockLeft(): float
    {
        return (float) DB::table('product_stocks')->where('product_id', $this->product->id)->value('quantity');
    }

    // ── Idempotência ────────────────────────────────────────────────────────

    public function test_repeating_a_sale_with_the_same_token_returns_the_original_sale(): void
    {
        $this->openShift();
        $payload = $this->sale(['client_token' => 'venda-123']);

        $first = $this->postJson(route('pos.sales.store'), $payload)->assertOk()->assertJsonPath('replayed', false);
        $second = $this->postJson(route('pos.sales.store'), $payload)->assertOk()->assertJsonPath('replayed', true);

        $this->assertSame($first->json('document.id'), $second->json('document.id'));
        $this->assertSame(1, Document::count());
        $this->assertSame(1, Payment::count());
        $this->assertSame(9.0, $this->stockLeft(), 'O stock só pode baixar uma vez');
    }

    public function test_the_replayed_sale_keeps_the_original_change(): void
    {
        $this->openShift();
        $payload = $this->sale(['client_token' => 'venda-troco', 'amount_paid' => 200]);

        $this->postJson(route('pos.sales.store'), $payload)->assertJsonPath('change', 84);
        $this->postJson(route('pos.sales.store'), $payload)
            ->assertJsonPath('replayed', true)
            ->assertJsonPath('change', 84)
            ->assertJsonPath('amount_paid', 200);
    }

    public function test_different_tokens_are_different_sales(): void
    {
        $this->openShift();

        $this->postJson(route('pos.sales.store'), $this->sale(['client_token' => 'a']))->assertOk();
        $this->postJson(route('pos.sales.store'), $this->sale(['client_token' => 'b']))->assertOk();

        $this->assertSame(2, Document::count());
        $this->assertSame(8.0, $this->stockLeft());
    }

    public function test_a_failed_sale_does_not_burn_its_token(): void
    {
        $this->openShift();
        $payload = $this->sale(['client_token' => 'retry', 'amount_paid' => 10]);

        $this->postJson(route('pos.sales.store'), $payload)->assertStatus(422);
        $this->assertSame(0, Document::count());

        // O operador corrige o valor e repete com a mesma chave: a venda é feita normalmente
        $this->postJson(route('pos.sales.store'), ['amount_paid' => 116] + $payload)
            ->assertOk()->assertJsonPath('replayed', false);
        $this->assertSame(1, Document::count());
    }

    // ── Erros ───────────────────────────────────────────────────────────────

    public function test_insufficient_stock_is_a_422_with_a_readable_message(): void
    {
        $this->openShift();
        $items = $this->sale()['items'];
        $items[0]['quantity'] = 50;

        $this->postJson(route('pos.sales.store'), $this->sale(['items' => $items, 'amount_paid' => 99999]))
            ->assertStatus(422)
            ->assertJsonPath('error', 'Stock insuficiente. Disponível: 10');

        $this->assertSame(0, Document::count());
        $this->assertSame(10.0, $this->stockLeft());
    }

    public function test_business_rule_errors_are_422(): void
    {
        $this->openShift();
        // Sem armazém, um produto com stock não pode ser vendido
        $this->register->update(['warehouse_id' => null]);
        $this->warehouse->delete();

        $this->postJson(route('pos.sales.store'), $this->sale())
            ->assertStatus(422)
            ->assertJsonPath('error', 'Um armazém de saída/entrada é obrigatório para confirmar este documento, pois contém itens físicos.');
    }

    public function test_unexpected_errors_do_not_leak_internal_details(): void
    {
        $this->openShift();

        $this->mock(BillingService::class, function ($mock) {
            $mock->shouldReceive('createDraft')->andThrow(new RuntimeException('SQLSTATE[HY000]: tabela secreta xpto'));
        });

        $response = $this->postJson(route('pos.sales.store'), $this->sale())->assertStatus(500);

        $this->assertStringNotContainsString('SQLSTATE', $response->getContent());
        $this->assertStringNotContainsString('xpto', $response->getContent());
        $this->assertSame(0, Document::count());
    }

    public function test_selling_without_an_open_shift_is_a_409(): void
    {
        $this->postJson(route('pos.sales.store'), $this->sale())
            ->assertStatus(409)
            ->assertJsonPath('error', 'Não tem nenhum turno aberto. Abra um turno para vender.');
    }

    public function test_inactive_products_cannot_be_sold(): void
    {
        $this->openShift();
        $this->product->update(['status' => 'inactive']);

        $this->postJson(route('pos.sales.store'), $this->sale())
            ->assertStatus(422)
            ->assertJsonValidationErrors('items.0.product_id');
    }

    // ── Turnos ──────────────────────────────────────────────────────────────

    public function test_opening_page_has_no_side_effects_and_the_default_register_is_created_on_open(): void
    {
        $this->register->forceDelete();
        $this->assertSame(0, CashRegister::count());

        $this->get('/pos/shifts/open')->assertOk();
        $this->assertSame(0, CashRegister::count(), 'Um GET não pode criar caixas');

        $this->post('/pos/shifts/open', ['starting_cash' => 50])->assertRedirect(route('pos.index'));

        $this->assertSame(1, CashRegister::count());
        $this->assertSame(1, PosShift::where('status', 'open')->count());
    }

    public function test_database_allows_only_one_open_shift_per_register(): void
    {
        $this->openShift();

        $other = User::create([
            'company_id' => $this->company->id, 'branch_id' => $this->branch->id,
            'name' => 'Outro', 'email' => 'outro@test.test', 'password' => bcrypt('password'),
        ]);

        $this->expectException(UniqueConstraintViolationException::class);

        PosShift::create([
            'company_id' => $this->company->id, 'branch_id' => $this->branch->id, 'cash_register_id' => $this->register->id,
            'user_id' => $other->id, 'status' => 'open', 'opened_at' => now(), 'starting_cash' => 0,
        ]);
    }

    public function test_database_allows_only_one_open_shift_per_operator(): void
    {
        $this->openShift();

        $second = CashRegister::create(['company_id' => $this->company->id, 'branch_id' => $this->branch->id, 'name' => 'Caixa 2']);

        $this->expectException(UniqueConstraintViolationException::class);

        PosShift::create([
            'company_id' => $this->company->id, 'branch_id' => $this->branch->id, 'cash_register_id' => $second->id,
            'user_id' => $this->user->id, 'status' => 'open', 'opened_at' => now(), 'starting_cash' => 0,
        ]);
    }

    public function test_closing_a_shift_frees_the_register_and_the_operator(): void
    {
        $shift = $this->openShift();
        $this->assertSame($this->register->id, $shift->fresh()->open_register_id);

        $shift->update(['status' => 'closed', 'closed_at' => now()]);

        $this->assertNull($shift->fresh()->open_register_id);
        $this->assertNull($shift->fresh()->open_user_id);

        $this->openShift(); // já pode abrir outro
        $this->assertSame(1, PosShift::where('status', 'open')->count());
    }

    // ── Impressoras de rede ─────────────────────────────────────────────────

    public function test_only_private_network_printer_hosts_are_accepted(): void
    {
        foreach (['192.168.1.50', '10.0.0.5', '172.16.4.9'] as $ok) {
            $this->assertSame($ok, PrinterHost::safeIp($ok));
        }

        foreach (['127.0.0.1', '169.254.169.254', '0.0.0.0', '8.8.8.8', 'localhost', 'não é um host', ''] as $bad) {
            try {
                PrinterHost::safeIp($bad);
                $this->fail("O endereço '$bad' devia ser recusado.");
            } catch (RuntimeException) {
                $this->addToAssertionCount(1);
            }
        }
    }

    public function test_public_hosts_can_be_enabled_but_loopback_and_metadata_never(): void
    {
        config(['pos.allow_public_printer_hosts' => true]);

        $this->assertSame('8.8.8.8', PrinterHost::safeIp('8.8.8.8'));

        $this->expectException(RuntimeException::class);
        PrinterHost::safeIp('169.254.169.254');
    }

    public function test_register_form_rejects_dangerous_printer_settings(): void
    {
        $base = [
            'name' => 'Caixa 1', 'branch_id' => $this->branch->id, 'printer_driver' => 'network',
            'printer_host' => '192.168.1.50', 'printer_port' => 9100,
        ];
        $url = "/pos/registers/{$this->register->id}";

        $this->put($url, ['printer_host' => '169.254.169.254'] + $base)->assertSessionHasErrors('printer_host');
        $this->put($url, ['printer_host' => '127.0.0.1'] + $base)->assertSessionHasErrors('printer_host');
        $this->put($url, ['printer_port' => 22] + $base)->assertSessionHasErrors('printer_port');

        $this->put($url, $base)->assertSessionHasNoErrors();
        $this->assertSame('192.168.1.50', $this->register->fresh()->printer_host);
    }

    public function test_server_refuses_to_connect_to_a_stored_dangerous_host(): void
    {
        $this->register->forceFill(['printer_driver' => 'network', 'printer_host' => '127.0.0.1', 'printer_port' => 9100])->save();

        $this->expectException(RuntimeException::class);
        app(PosPrintService::class)->sendToNetwork($this->register->fresh(), 'x');
    }
}
