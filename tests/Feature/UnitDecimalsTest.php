<?php

namespace Tests\Feature;

use App\Exceptions\BusinessRuleException;
use App\Models\Billing\Customer;
use App\Models\Billing\DocumentSeries;
use App\Models\Catalog\Product;
use App\Models\Catalog\Unit;
use App\Models\Company;
use App\Models\Inventory\InventoryClosing;
use App\Models\Inventory\StockAdjustment;
use App\Models\Inventory\StockTransfer;
use App\Models\Inventory\Warehouse;
use App\Models\Role;
use App\Models\User;
use App\Services\Billing\BillingService;
use App\Services\Inventory\InventoryClosingService;
use App\Services\Inventory\StockService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/** Unidades que só aceitam quantidades inteiras (unidade, caixa...) e as que aceitam fracionadas (kg, litro...). */
class UnitDecimalsTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;

    private User $owner;

    private Warehouse $w1;

    private Warehouse $w2;

    private Product $pen; // unidade: só inteiras

    private Product $rice; // quilograma: fracionadas

    private Product $loose; // sem unidade

    private StockService $stock;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::create(['name' => 'Empresa', 'nuit' => '123456789', 'address' => 'Maputo', 'phone' => '840000000', 'subscription_plan' => 'empresarial']);
        $this->owner = User::create(['company_id' => $this->company->id, 'name' => 'Dono', 'email' => 'd@x.test', 'password' => bcrypt('password')]);
        $this->owner->assignRole(Role::findOrCreate('owner', 'web'));
        $this->actingAs($this->owner);

        $this->w1 = Warehouse::create(['company_id' => $this->company->id, 'name' => 'W1', 'code' => 'W1', 'is_active' => true]);
        $this->w2 = Warehouse::create(['company_id' => $this->company->id, 'name' => 'W2', 'code' => 'W2', 'is_active' => true]);

        $each = Unit::create(['company_id' => $this->company->id, 'name' => 'Unidade', 'short_name' => 'UN', 'allow_decimals' => false]);
        $kilo = Unit::create(['company_id' => $this->company->id, 'name' => 'Quilograma', 'short_name' => 'KG', 'allow_decimals' => true]);

        $product = fn (string $name, ?Unit $unit) => Product::create([
            'company_id' => $this->company->id, 'name' => $name, 'slug' => strtolower($name), 'sku' => strtoupper($name),
            'unit_id' => $unit?->id, 'price' => 10, 'tax_rate' => 0, 'track_stock' => true, 'status' => 'active',
        ]);
        $this->pen = $product('Caneta', $each);
        $this->rice = $product('Arroz', $kilo);
        $this->loose = $product('Avulso', null);

        $this->stock = app(StockService::class);
    }

    private function qty(Product $product, Warehouse $warehouse): float
    {
        return (float) DB::table('product_stocks')->where('product_id', $product->id)->where('warehouse_id', $warehouse->id)->value('quantity');
    }

    public function test_whole_only_units_refuse_fractions_in_every_stock_movement(): void
    {
        $this->stock->in($this->pen, $this->w1, 10);

        foreach ([
            fn () => $this->stock->in($this->pen, $this->w1, 2.5),
            fn () => $this->stock->out($this->pen, $this->w1, 0.5),
            fn () => $this->stock->opening($this->pen, $this->w2, 1.5),
            fn () => $this->stock->adjustTo($this->pen, $this->w1, 7.25),
        ] as $attempt) {
            try {
                $attempt();
                $this->fail('A fração devia ser recusada.');
            } catch (BusinessRuleException $e) {
                $this->assertStringContainsString('só aceita quantidades inteiras', $e->getMessage());
                $this->assertStringContainsString('Caneta', $e->getMessage());
            }
        }

        // Nada mudou
        $this->assertSame(10.0, $this->qty($this->pen, $this->w1));
        $this->assertSame(1, DB::table('stock_movements')->count());

        // Inteiros, mesmo escritos com casas, passam
        $this->stock->out($this->pen, $this->w1, 3.0);
        $this->assertSame(7.0, $this->qty($this->pen, $this->w1));
    }

    public function test_fractional_units_and_products_without_a_unit_accept_fractions(): void
    {
        $this->stock->in($this->rice, $this->w1, 2.5);
        $this->stock->out($this->rice, $this->w1, 0.125);
        $this->stock->in($this->loose, $this->w1, 1.5);

        $this->assertSame(2.375, $this->qty($this->rice, $this->w1));
        $this->assertSame(1.5, $this->qty($this->loose, $this->w1));
    }

    public function test_an_adjustment_to_a_whole_target_works_even_if_the_old_balance_was_fractional(): void
    {
        // Saldo antigo fracionado (a unidade passou a "só inteiras" depois): acertar para um inteiro tem de funcionar
        DB::table('product_stocks')->insert(['company_id' => $this->company->id, 'product_id' => $this->pen->id, 'warehouse_id' => $this->w1->id, 'quantity' => 2.5, 'created_at' => now(), 'updated_at' => now()]);

        $this->stock->adjustTo($this->pen, $this->w1, 4);

        $this->assertSame(4.0, $this->qty($this->pen, $this->w1));
    }

    public function test_adjustment_and_transfer_forms_refuse_a_fraction_before_creating_anything(): void
    {
        $this->stock->in($this->pen, $this->w1, 10);

        $this->post('/inventory/adjustments', [
            'warehouse_id' => $this->w1->id, 'reason' => 'correction',
            'items' => [['product_id' => $this->pen->id, 'new_quantity' => 7.5]],
        ])->assertSessionHas('error');
        $this->assertSame(0, StockAdjustment::withoutGlobalScopes()->count());

        $this->post('/inventory/transfers', [
            'from_warehouse_id' => $this->w1->id, 'to_warehouse_id' => $this->w2->id,
            'items' => [['product_id' => $this->pen->id, 'quantity' => 1.5]],
        ])->assertSessionHas('error');
        $this->assertSame(0, StockTransfer::withoutGlobalScopes()->count());

        // E a mesma quantidade num produto que aceita fracionadas passa
        $this->stock->in($this->rice, $this->w1, 5);
        $this->post('/inventory/transfers', [
            'from_warehouse_id' => $this->w1->id, 'to_warehouse_id' => $this->w2->id,
            'items' => [['product_id' => $this->rice->id, 'quantity' => 1.5]],
        ])->assertSessionHasNoErrors();
        $this->assertSame(1, StockTransfer::withoutGlobalScopes()->count());
    }

    public function test_opening_stock_form_refuses_a_fraction(): void
    {
        $this->post('/inventory/opening', ['product_id' => $this->pen->id, 'warehouse_id' => $this->w1->id, 'quantity' => 2.5])->assertSessionHas('error');
        $this->assertSame(0, DB::table('stock_movements')->count());
    }

    public function test_a_closing_count_must_respect_the_unit(): void
    {
        $this->stock->in($this->pen, $this->w1, 10);
        $closing = InventoryClosing::create(['company_id' => $this->company->id, 'reference_date' => now()->toDateString(), 'status' => 'draft']);
        $closing->items()->create(['product_id' => $this->pen->id, 'warehouse_id' => $this->w1->id, 'quantity_expected' => 10, 'quantity_counted' => 8.5]);

        try {
            app(InventoryClosingService::class)->complete($closing);
            $this->fail('A contagem fracionada devia ser recusada.');
        } catch (BusinessRuleException) {
            // esperado
        }

        $this->assertSame('draft', $closing->fresh()->status);
        $this->assertSame(10.0, $this->qty($this->pen, $this->w1));
    }

    public function test_selling_a_fraction_of_a_whole_only_product_is_refused_at_issue_time(): void
    {
        DocumentSeries::create(['company_id' => $this->company->id, 'code' => 'A', 'name' => 'S', 'year' => (int) date('Y'), 'next_number' => 1, 'is_active' => true, 'created_by' => $this->owner->id]);
        $customer = Customer::create(['company_id' => $this->company->id, 'name' => 'Cli', 'nuit' => '987654321', 'balance' => 0, 'credit_limit' => 99999, 'is_active' => true]);
        $this->stock->in($this->pen, $this->w1, 10);

        $billing = app(BillingService::class);
        $draft = $billing->createDraft([
            'customer_id' => $customer->id, 'customer_name' => 'Cli', 'customer_nuit' => '987654321', 'document_type' => 'FT',
            'items' => [['product_id' => $this->pen->id, 'product_name' => 'Caneta', 'quantity' => 1.5, 'unit_price' => 10, 'tax_rate' => 0]],
        ], $this->company->id);

        try {
            $billing->confirmAndEmit($draft->id, $this->w1);
            $this->fail('A venda fracionada devia ser recusada.');
        } catch (BusinessRuleException $e) {
            $this->assertStringContainsString('só aceita quantidades inteiras', $e->getMessage());
        }

        $this->assertSame(10.0, $this->qty($this->pen, $this->w1));
        $this->assertSame('draft', $draft->fresh()->status); // a emissão foi toda desfeita
    }

    public function test_the_unit_form_saves_the_setting_and_new_units_default_to_fractions(): void
    {
        $this->post('/units', ['name' => 'Caixa', 'short_name' => 'CX', 'allow_decimals' => false])->assertSessionHasNoErrors();
        $this->post('/units', ['name' => 'Litro', 'short_name' => 'L'])->assertSessionHasNoErrors();

        $this->assertFalse((bool) Unit::where('short_name', 'CX')->value('allow_decimals'));
        $this->assertTrue((bool) Unit::where('short_name', 'L')->value('allow_decimals'));

        $unit = Unit::where('short_name', 'CX')->first();
        $this->put("/units/{$unit->id}", ['name' => 'Caixa', 'short_name' => 'CX', 'allow_decimals' => true])->assertSessionHasNoErrors();
        $this->assertTrue((bool) $unit->fresh()->allow_decimals);
    }
}
