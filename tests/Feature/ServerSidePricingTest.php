<?php

namespace Tests\Feature;

use App\Mail\UserCreatedMail;
use App\Models\Billing\Document;
use App\Models\Billing\DocumentItem;
use App\Models\Billing\DocumentSeries;
use App\Models\Catalog\Branch;
use App\Models\Catalog\Product;
use App\Models\Company;
use App\Models\Inventory\Warehouse;
use App\Models\Pos\CashRegister;
use App\Models\Pos\PosShift;
use App\Models\Role;
use App\Models\User;
use App\Services\Inventory\StockService;
use Database\Seeders\SuperAdminSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

/**
 * Preço, IVA e nome dos itens de catálogo vêm do produto, nunca do pedido HTTP.
 */
class ServerSidePricingTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;

    private User $admin;

    private Product $product;

    private Product $exempt;

    protected function setUp(): void
    {
        parent::setUp();

        Mail::fake();

        $this->company = Company::create([
            'name' => 'Empresa', 'nuit' => '123456789', 'address' => 'Maputo', 'phone' => '840000000',
            'subscription_plan' => 'empresarial',
        ]);

        $branch = Branch::create(['company_id' => $this->company->id, 'name' => 'Sede', 'code' => 'S', 'status' => 'active']);

        $this->admin = User::create([
            'company_id' => $this->company->id, 'branch_id' => $branch->id,
            'name' => 'Admin', 'email' => 'admin@test.test', 'password' => bcrypt('password'),
        ]);

        foreach (['invoice.create', 'invoice.view', 'sales.create', 'sales.view'] as $permission) {
            Permission::findOrCreate($permission, 'web');
        }
        $role = Role::findOrCreate('Admin', 'web');
        $role->syncPermissions(['invoice.create', 'invoice.view', 'sales.create', 'sales.view']);
        $this->admin->assignRole($role);

        $make = fn (array $attrs) => Product::create($attrs + [
            'company_id' => $this->company->id, 'type' => 'product', 'track_stock' => false, 'status' => 'active',
        ]);

        $this->product = $make(['name' => 'Caneta', 'slug' => 'caneta', 'sku' => 'CAN-1', 'price' => '100.00', 'tax_rate' => '16.00']);
        $this->exempt = $make(['name' => 'Livro', 'slug' => 'livro', 'sku' => 'LIV-1', 'price' => '50.00', 'tax_rate' => '16.00', 'tax_is_exempt' => true]);

        DocumentSeries::create([
            'company_id' => $this->company->id, 'code' => 'A', 'name' => 'Série', 'year' => (int) date('Y'),
            'next_number' => 1, 'is_active' => true, 'created_by' => $this->admin->id,
        ]);
    }

    private function invoiceWith(array $items)
    {
        return $this->actingAs($this->admin)->post('/billing/invoices', [
            'customer_name' => 'Cliente',
            'customer_nuit' => '999999999',
            'issue_date' => now()->toDateString(),
            'due_date' => now()->toDateString(),
            'items' => $items,
        ]);
    }

    public function test_catalog_items_ignore_price_tax_and_name_sent_by_the_client(): void
    {
        $this->invoiceWith([[
            'product_id' => $this->product->id,
            'product_name' => 'Outra coisa',
            'quantity' => 2,
            'unit_price' => 0.01,
            'tax_rate' => 0,
        ]])->assertSessionHasNoErrors();

        $item = DocumentItem::first();
        $this->assertSame('Caneta', $item->product_name);
        $this->assertSame('CAN-1', $item->product_sku);
        $this->assertEquals(100.00, (float) $item->unit_price);
        $this->assertEquals(16.00, (float) $item->tax_rate);

        $document = Document::first();
        $this->assertEquals(232.00, (float) $document->grand_total);
    }

    public function test_tax_exempt_products_get_zero_tax_even_if_the_client_sends_a_rate(): void
    {
        $this->invoiceWith([[
            'product_id' => $this->exempt->id,
            'product_name' => 'Livro',
            'quantity' => 1,
            'unit_price' => 50,
            'tax_rate' => 16,
        ]])->assertSessionHasNoErrors();

        $this->assertEquals(0.0, (float) DocumentItem::first()->tax_rate);
        $this->assertEquals(50.00, (float) Document::first()->grand_total);
    }

    public function test_free_items_without_product_keep_the_values_sent(): void
    {
        $this->invoiceWith([[
            'product_name' => 'Serviço avulso',
            'quantity' => 1,
            'unit_price' => 80,
            'tax_rate' => 16,
        ]])->assertSessionHasNoErrors();

        $item = DocumentItem::first();
        $this->assertSame('Serviço avulso', $item->product_name);
        $this->assertEquals(80.00, (float) $item->unit_price);
    }

    public function test_pos_sale_is_priced_from_the_catalog(): void
    {
        $warehouse = Warehouse::create(['company_id' => $this->company->id, 'name' => 'Armazém', 'code' => 'W1', 'is_active' => true]);
        $register = CashRegister::create(['company_id' => $this->company->id, 'branch_id' => $this->admin->branch_id, 'name' => 'Caixa 1', 'warehouse_id' => $warehouse->id]);
        PosShift::create([
            'company_id' => $this->company->id, 'branch_id' => $this->admin->branch_id, 'cash_register_id' => $register->id,
            'user_id' => $this->admin->id, 'status' => 'open', 'opened_at' => now(), 'starting_cash' => 0,
        ]);

        // Produto com stock para o POS (a venda dá baixa)
        $this->product->update(['track_stock' => true]);
        app(StockService::class)->opening($this->product, $warehouse, 10);

        $this->actingAs($this->admin)->postJson(route('pos.sales.store'), [
            'items' => [[
                'product_id' => $this->product->id,
                'product_name' => 'Adulterado',
                'quantity' => 1,
                'unit_price' => 0.01,
                'tax_rate' => 0,
                'discount_percent' => 0,
            ]],
            'payment_method' => 'cash',
            'amount_paid' => 116,
        ])->assertOk();

        $this->assertEquals(116.00, (float) Document::first()->grand_total);
        $this->assertSame('Caneta', DocumentItem::first()->product_name);
    }

    // ── Email de novo utilizador ────────────────────────────────────────────

    public function test_new_user_email_has_a_set_password_link_and_never_the_password(): void
    {
        Role::findOrCreate('Operator', 'web');

        $this->actingAs($this->admin)->post('/settings/users', [
            'name' => 'Novo',
            'email' => 'novo@test.test',
            'password' => 'Segredo-123456',
            'role' => 'Operator',
        ])->assertSessionHasNoErrors();

        Mail::assertQueued(UserCreatedMail::class, function (UserCreatedMail $mail) {
            $html = $mail->render();

            return str_contains($mail->setPasswordUrl, '/reset-password/')
                && str_contains($html, $mail->setPasswordUrl)
                && ! str_contains($html, 'Segredo-123456');
        });
    }

    // ── Seeder do super admin ───────────────────────────────────────────────

    public function test_super_admin_seeder_has_no_default_password(): void
    {
        putenv('SUPER_ADMIN_PASSWORD');
        unset($_ENV['SUPER_ADMIN_PASSWORD'], $_SERVER['SUPER_ADMIN_PASSWORD']);

        $this->seed(SuperAdminSeeder::class);

        $user = User::where('is_super_admin', true)->firstOrFail();
        $this->assertFalse(Hash::check('Kutenga@SuperAdmin2026!', $user->password));

        // Voltar a correr sem palavra-passe não pode trocar a existente (nem bloquear o acesso)
        $hash = $user->password;
        $this->seed(SuperAdminSeeder::class);
        $this->assertSame($hash, $user->fresh()->password);
    }
}
