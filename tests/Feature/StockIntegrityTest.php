<?php

namespace Tests\Feature;

use App\Exceptions\BusinessRuleException;
use App\Exceptions\InsufficientStockException;
use App\Models\Catalog\Branch;
use App\Models\Catalog\Product;
use App\Models\Company;
use App\Models\Inventory\InventoryClosing;
use App\Models\Inventory\ProductStock;
use App\Models\Inventory\StockAdjustment;
use App\Models\Inventory\StockTransfer;
use App\Models\Inventory\Warehouse;
use App\Models\Role;
use App\Models\User;
use App\Services\Inventory\InventoryClosingService;
use App\Services\Inventory\StockAdjustmentService;
use App\Services\Inventory\StockService;
use App\Services\Inventory\StockTransferService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

/**
 * O stock nunca fica negativo por saídas simultâneas e transferências/ajustes só se aplicam uma vez.
 */
class StockIntegrityTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;

    private User $admin;

    private Warehouse $w1;

    private Warehouse $w2;

    private Product $pen;

    private Product $ink;

    private StockService $stock;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::create([
            'name' => 'Empresa', 'nuit' => '123456789', 'address' => 'Maputo', 'phone' => '840000000',
            'subscription_plan' => 'empresarial',
        ]);

        $branch = Branch::create(['company_id' => $this->company->id, 'name' => 'Sede', 'code' => 'S', 'status' => 'active']);

        $this->admin = User::create([
            'company_id' => $this->company->id, 'branch_id' => $branch->id,
            'name' => 'Admin', 'email' => 'admin@test.test', 'password' => bcrypt('password'),
        ]);

        $permissions = ['inventory.view', 'inventory.adjust', 'inventory.transfer', 'catalog.view', 'catalog.edit'];
        foreach ($permissions as $permission) {
            Permission::findOrCreate($permission, 'web');
        }
        $role = Role::findOrCreate('Admin', 'web');
        $role->syncPermissions($permissions);
        $this->admin->assignRole($role);

        $warehouse = fn (string $code) => Warehouse::create(['company_id' => $this->company->id, 'name' => "Armazém $code", 'code' => $code, 'is_active' => true]);
        $this->w1 = $warehouse('W1');
        $this->w2 = $warehouse('W2');

        $product = fn (string $name) => Product::create([
            'company_id' => $this->company->id, 'name' => $name, 'slug' => strtolower($name), 'sku' => strtoupper($name),
            'price' => '10.00', 'tax_rate' => '16.00', 'type' => 'product', 'track_stock' => true, 'status' => 'active',
        ]);
        $this->pen = $product('Caneta');
        $this->ink = $product('Tinta');

        $this->stock = app(StockService::class);
    }

    private function qty(Product $product, Warehouse $warehouse): float
    {
        return (float) DB::table('product_stocks')
            ->where('product_id', $product->id)->where('warehouse_id', $warehouse->id)->value('quantity');
    }

    private function transfer(string $status, array $items): StockTransfer
    {
        $transfer = StockTransfer::create([
            'company_id' => $this->company->id,
            'from_warehouse_id' => $this->w1->id,
            'to_warehouse_id' => $this->w2->id,
            'status' => $status,
        ]);

        foreach ($items as $productId => $quantity) {
            $transfer->items()->create(['product_id' => $productId, 'quantity' => $quantity]);
        }

        return $transfer;
    }

    // ── Movimentos ──────────────────────────────────────────────────────────

    public function test_out_beyond_the_balance_is_refused_and_leaves_no_trace(): void
    {
        $this->stock->in($this->pen, $this->w1, 5);

        try {
            $this->stock->out($this->pen, $this->w1, 6);
            $this->fail('Devia recusar a saída acima do saldo.');
        } catch (InsufficientStockException $e) {
            $this->assertSame(5.0, $e->available);
        }

        $this->assertSame(5.0, $this->qty($this->pen, $this->w1));
        $this->assertSame(1, DB::table('stock_movements')->count());
    }

    public function test_balance_follows_the_movements(): void
    {
        $this->stock->in($this->pen, $this->w1, 10);
        $this->stock->out($this->pen, $this->w1, 3);
        $this->stock->out($this->pen, $this->w1, 7);

        $this->assertSame(0.0, $this->qty($this->pen, $this->w1));
        $this->assertSame(1, DB::table('product_stocks')->count());
        $this->assertSame(3, DB::table('stock_movements')->count());
    }

    public function test_the_balance_is_updated_in_the_database_not_in_php(): void
    {
        $this->stock->in($this->pen, $this->w1, 10);

        $queries = [];
        DB::listen(function ($query) use (&$queries) {
            $queries[] = $query->sql;
        });

        $this->stock->out($this->pen, $this->w1, 4);

        $this->assertTrue(
            collect($queries)->contains(fn ($sql) => preg_match('/update ["`]product_stocks["`] set ["`]quantity["`] = ["`]quantity["`] [+-]/', $sql) === 1),
            'O saldo devia ser atualizado com quantity = quantity ± delta.'
        );
    }

    public function test_in_and_out_require_a_positive_quantity(): void
    {
        $this->expectException(\InvalidArgumentException::class);

        $this->stock->out($this->pen, $this->w1, 0);
    }

    // ── Transferências ──────────────────────────────────────────────────────

    public function test_transfer_moves_stock_once_even_when_completed_twice_from_stale_instances(): void
    {
        $this->stock->in($this->pen, $this->w1, 10);
        $transfer = $this->transfer('approved', [$this->pen->id => 4]);

        $first = StockTransfer::find($transfer->id);
        $second = StockTransfer::find($transfer->id); // carregada antes de a primeira concluir

        $service = app(StockTransferService::class);
        $service->complete($first);

        try {
            $service->complete($second);
            $this->fail('A segunda conclusão devia ser recusada.');
        } catch (ValidationException) {
            // esperado
        }

        $this->assertSame(6.0, $this->qty($this->pen, $this->w1));
        $this->assertSame(4.0, $this->qty($this->pen, $this->w2));
    }

    public function test_only_approved_transfers_can_be_completed(): void
    {
        $this->stock->in($this->pen, $this->w1, 10);

        foreach (['pending', 'cancelled'] as $status) {
            $transfer = $this->transfer($status, [$this->pen->id => 4]);

            $this->actingAs($this->admin)
                ->post("/inventory/transfers/{$transfer->id}/complete")
                ->assertSessionHas('error');

            $this->assertSame($status, StockTransfer::withoutGlobalScopes()->find($transfer->id)->status);
        }

        $this->assertSame(10.0, $this->qty($this->pen, $this->w1));
    }

    public function test_failed_transfer_is_rolled_back_entirely(): void
    {
        $this->stock->in($this->pen, $this->w1, 10);
        $this->stock->in($this->ink, $this->w1, 1);

        // A caneta (id menor) é movida primeiro; a tinta falha e a caneta tem de voltar atrás
        $transfer = $this->transfer('approved', [$this->pen->id => 4, $this->ink->id => 5]);

        $this->actingAs($this->admin)
            ->post("/inventory/transfers/{$transfer->id}/complete")
            ->assertSessionHas('error');

        $this->assertSame(10.0, $this->qty($this->pen, $this->w1));
        $this->assertSame(0.0, $this->qty($this->pen, $this->w2));
        $this->assertSame('approved', StockTransfer::withoutGlobalScopes()->find($transfer->id)->status);
    }

    public function test_completed_transfer_cannot_be_cancelled_and_does_not_error(): void
    {
        $transfer = $this->transfer('completed', [$this->pen->id => 1]);

        $this->actingAs($this->admin)
            ->post("/inventory/transfers/{$transfer->id}/cancel")
            ->assertRedirect()
            ->assertSessionHas('error');

        $this->assertSame('completed', StockTransfer::withoutGlobalScopes()->find($transfer->id)->status);
    }

    public function test_transfer_lifecycle_through_the_http_flow(): void
    {
        $this->stock->in($this->pen, $this->w1, 10);

        $this->actingAs($this->admin)->post('/inventory/transfers', [
            'from_warehouse_id' => $this->w1->id,
            'to_warehouse_id' => $this->w2->id,
            'items' => [['product_id' => $this->pen->id, 'quantity' => 3]],
        ])->assertSessionHasNoErrors();

        $transfer = StockTransfer::withoutGlobalScopes()->firstOrFail();
        $this->assertSame('pending', $transfer->status);

        $this->post("/inventory/transfers/{$transfer->id}/approve")->assertSessionHas('success');
        $this->post("/inventory/transfers/{$transfer->id}/complete")->assertSessionHas('success');

        $this->assertSame(7.0, $this->qty($this->pen, $this->w1));
        $this->assertSame(3.0, $this->qty($this->pen, $this->w2));
    }

    public function test_transfer_creation_is_validated(): void
    {
        $other = Company::create(['name' => 'Outra', 'nuit' => '999', 'address' => 'x', 'phone' => '1']);
        $foreign = Warehouse::create(['company_id' => $other->id, 'name' => 'Alheio', 'code' => 'X', 'is_active' => true]);

        $valid = ['product_id' => $this->pen->id, 'quantity' => 1];

        $cases = [
            'mesmo armazém' => [['from_warehouse_id' => $this->w1->id, 'to_warehouse_id' => $this->w1->id, 'items' => [$valid]], 'to_warehouse_id'],
            'armazém de outra empresa' => [['from_warehouse_id' => $this->w1->id, 'to_warehouse_id' => $foreign->id, 'items' => [$valid]], 'to_warehouse_id'],
            'quantidade zero' => [['from_warehouse_id' => $this->w1->id, 'to_warehouse_id' => $this->w2->id, 'items' => [['product_id' => $this->pen->id, 'quantity' => 0]]], 'items.0.quantity'],
            'quantidade negativa' => [['from_warehouse_id' => $this->w1->id, 'to_warehouse_id' => $this->w2->id, 'items' => [['product_id' => $this->pen->id, 'quantity' => -5]]], 'items.0.quantity'],
            'sem itens' => [['from_warehouse_id' => $this->w1->id, 'to_warehouse_id' => $this->w2->id], 'items'],
            'produto repetido' => [['from_warehouse_id' => $this->w1->id, 'to_warehouse_id' => $this->w2->id, 'items' => [$valid, $valid]], 'items.0.product_id'],
        ];

        foreach ($cases as [$payload, $errorKey]) {
            $this->actingAs($this->admin)->post('/inventory/transfers', $payload)->assertSessionHasErrors($errorKey);
        }

        $this->assertSame(0, StockTransfer::withoutGlobalScopes()->count());
    }

    // ── Ajustes ─────────────────────────────────────────────────────────────

    private function adjustment(string $status = 'draft'): StockAdjustment
    {
        $adjustment = StockAdjustment::create([
            'company_id' => $this->company->id,
            'warehouse_id' => $this->w1->id,
            'reason' => 'correction',
            'status' => $status,
            'created_by' => $this->admin->id,
        ]);

        $adjustment->items()->create([
            'product_id' => $this->pen->id,
            'old_quantity' => 0,
            'new_quantity' => 5,
            'difference' => 5,
        ]);

        return $adjustment;
    }

    public function test_adjustment_is_applied_once_even_when_completed_twice_from_stale_instances(): void
    {
        $adjustment = $this->adjustment();
        $first = StockAdjustment::find($adjustment->id);
        $second = StockAdjustment::find($adjustment->id);

        $service = app(StockAdjustmentService::class);
        $service->complete($first);

        try {
            $service->complete($second);
            $this->fail('A segunda conclusão devia ser recusada.');
        } catch (ValidationException) {
            // esperado
        }

        $this->assertSame(5.0, $this->qty($this->pen, $this->w1));
    }

    public function test_cancelled_adjustment_cannot_be_completed(): void
    {
        $adjustment = $this->adjustment('cancelled');

        $this->actingAs($this->admin)
            ->post("/inventory/adjustments/{$adjustment->id}/complete")
            ->assertSessionHas('error');

        $this->assertSame(0, DB::table('product_stocks')->count());
    }

    public function test_completed_adjustment_cannot_be_cancelled(): void
    {
        $adjustment = $this->adjustment();

        $this->actingAs($this->admin)->post("/inventory/adjustments/{$adjustment->id}/complete")->assertSessionHas('success');
        $this->post("/inventory/adjustments/{$adjustment->id}/cancel")->assertSessionHas('error');

        $this->assertSame('completed', StockAdjustment::withoutGlobalScopes()->find($adjustment->id)->status);
        $this->assertSame(5.0, $this->qty($this->pen, $this->w1));
    }

    public function test_adjustment_targets_the_balance_at_completion_not_at_draft_time(): void
    {
        $this->stock->in($this->pen, $this->w1, 10);

        $adjustment = StockAdjustment::create([
            'company_id' => $this->company->id, 'warehouse_id' => $this->w1->id,
            'reason' => 'physical_count', 'status' => 'draft', 'created_by' => $this->admin->id,
        ]);
        $item = $adjustment->items()->create(['product_id' => $this->pen->id, 'old_quantity' => 10, 'new_quantity' => 8, 'difference' => -2]);

        // Venda feita depois de o rascunho ser criado
        $this->stock->out($this->pen, $this->w1, 3);

        app(StockAdjustmentService::class)->complete($adjustment);

        $this->assertSame(8.0, $this->qty($this->pen, $this->w1));
        $item->refresh();
        $this->assertEquals(7, $item->old_quantity);
        $this->assertEquals(1, $item->difference);
    }

    // ── Fecho de inventário ─────────────────────────────────────────────────

    private function closing(bool $blocks = false, ?Warehouse $warehouse = null): InventoryClosing
    {
        $closing = InventoryClosing::create([
            'company_id' => $this->company->id,
            'warehouse_id' => $warehouse?->id,
            'created_by' => $this->admin->id,
            'reference_date' => now()->toDateString(),
            'status' => 'draft',
            'blocks_movements' => $blocks,
        ]);

        foreach (ProductStock::withoutGlobalScopes()->where('company_id', $this->company->id)->when($warehouse, fn ($q) => $q->where('warehouse_id', $warehouse->id))->get() as $row) {
            $closing->items()->create([
                'product_id' => $row->product_id,
                'warehouse_id' => $row->warehouse_id,
                'quantity_expected' => $row->quantity,
            ]);
        }

        return $closing;
    }

    public function test_completing_a_closing_applies_the_counted_differences_once(): void
    {
        $this->stock->in($this->pen, $this->w1, 10);
        $this->stock->in($this->ink, $this->w1, 4);

        $closing = $this->closing();
        $closing->items()->where('product_id', $this->pen->id)->update(['quantity_counted' => 8]);
        // Tinta sem contagem: não é alterada

        // Venda depois do snapshot: a diferença (-2) aplica-se sobre o saldo atual
        $this->stock->out($this->pen, $this->w1, 1);

        $service = app(InventoryClosingService::class);
        $this->assertSame(1, $service->complete($closing));

        $this->assertSame(7.0, $this->qty($this->pen, $this->w1));
        $this->assertSame(4.0, $this->qty($this->ink, $this->w1));
        $this->assertSame('completed', $closing->fresh()->status);

        try {
            $service->complete(InventoryClosing::find($closing->id));
            $this->fail('O segundo fecho devia ser recusado.');
        } catch (ValidationException) {
            // esperado
        }

        $this->assertSame(7.0, $this->qty($this->pen, $this->w1));
    }

    public function test_closing_difference_cannot_push_the_balance_below_zero(): void
    {
        $this->stock->in($this->pen, $this->w1, 5);
        $closing = $this->closing();
        $closing->items()->update(['quantity_counted' => 0]);

        $this->stock->out($this->pen, $this->w1, 4);

        try {
            app(InventoryClosingService::class)->complete($closing);
            $this->fail('A diferença devia ser recusada.');
        } catch (ValidationException) {
            // esperado
        }

        $this->assertSame(1.0, $this->qty($this->pen, $this->w1));
        $this->assertSame('draft', $closing->fresh()->status);
    }

    public function test_completed_blocking_closing_freezes_stock_movements_of_its_warehouse(): void
    {
        $this->stock->in($this->pen, $this->w1, 10);
        $this->stock->in($this->pen, $this->w2, 10);

        $closing = $this->closing(blocks: true, warehouse: $this->w1);
        $closing->items()->update(['quantity_counted' => 9]);

        // Os ajustes do próprio fecho não são bloqueados por ele
        app(InventoryClosingService::class)->complete($closing);
        $this->assertSame(9.0, $this->qty($this->pen, $this->w1));

        try {
            $this->stock->out($this->pen, $this->w1, 1);
            $this->fail('O movimento devia ser bloqueado.');
        } catch (BusinessRuleException) {
            // esperado
        }

        $this->assertSame(9.0, $this->qty($this->pen, $this->w1));

        // Outro armazém não é afetado
        $this->stock->out($this->pen, $this->w2, 1);
        $this->assertSame(9.0, $this->qty($this->pen, $this->w2));
    }

    public function test_completed_closing_without_blocking_does_not_freeze_stock(): void
    {
        $this->stock->in($this->pen, $this->w1, 10);
        $closing = $this->closing();

        app(InventoryClosingService::class)->complete($closing);

        $this->stock->out($this->pen, $this->w1, 1);
        $this->assertSame(9.0, $this->qty($this->pen, $this->w1));
    }

    // ── Armazéns ────────────────────────────────────────────────────────────

    public function test_warehouse_update_ignores_company_id_from_the_request(): void
    {
        $foreign = Company::create(['name' => 'Outra', 'nuit' => '987654321', 'address' => 'Beira', 'phone' => '850000000']);

        $this->actingAs($this->admin)
            ->put("/inventory/warehouses/{$this->w1->id}", ['name' => 'Renomeado', 'company_id' => $foreign->id])
            ->assertSessionHasNoErrors();

        $warehouse = Warehouse::withoutGlobalScopes()->find($this->w1->id);
        $this->assertSame('Renomeado', $warehouse->name);
        $this->assertSame($this->company->id, $warehouse->company_id);
    }

    public function test_only_one_warehouse_is_the_default(): void
    {
        $this->actingAs($this->admin)->put("/inventory/warehouses/{$this->w1->id}", ['name' => 'W1', 'is_default' => true]);
        $this->put("/inventory/warehouses/{$this->w2->id}", ['name' => 'W2', 'is_default' => true]);
        $this->post('/inventory/warehouses', ['name' => 'W3']);

        $defaults = Warehouse::withoutGlobalScopes()->where('is_default', true)->pluck('id')->all();
        $this->assertSame([$this->w2->id], $defaults);
    }

    public function test_warehouse_with_stock_or_pending_documents_cannot_be_deleted(): void
    {
        $this->stock->in($this->pen, $this->w1, 3);

        $this->actingAs($this->admin)->delete("/inventory/warehouses/{$this->w1->id}")->assertSessionHas('error');
        $this->assertNull(Warehouse::withoutGlobalScopes()->find($this->w1->id)->deleted_at);

        $this->stock->out($this->pen, $this->w1, 3);
        $this->transfer('pending', [$this->pen->id => 1]);
        $this->delete("/inventory/warehouses/{$this->w1->id}")->assertSessionHas('error');

        StockTransfer::withoutGlobalScopes()->update(['status' => 'cancelled']);
        $this->delete("/inventory/warehouses/{$this->w1->id}")->assertSessionHas('success');
        $this->assertNotNull(Warehouse::withoutGlobalScopes()->withTrashed()->find($this->w1->id)->deleted_at);
    }

    // ── Stock inicial ───────────────────────────────────────────────────────

    public function test_opening_stock_is_defined_once_and_must_be_positive(): void
    {
        $payload = ['product_id' => $this->pen->id, 'warehouse_id' => $this->w1->id, 'quantity' => 6];

        $this->actingAs($this->admin)->post('/inventory/opening', $payload)->assertSessionHas('success');
        $this->assertSame(6.0, $this->qty($this->pen, $this->w1));

        // Segunda definição: aviso ao utilizador, saldo intacto
        $this->post('/inventory/opening', $payload)->assertSessionHas('error');
        $this->assertSame(6.0, $this->qty($this->pen, $this->w1));

        // Zero não gasta a única oportunidade de definir o stock inicial
        $this->post('/inventory/opening', ['product_id' => $this->ink->id, 'warehouse_id' => $this->w1->id, 'quantity' => 0])
            ->assertSessionHasErrors('quantity');
        $this->assertFalse($this->stock->openingExists($this->ink, $this->w1));
    }

    public function test_opening_stock_is_refused_for_inactive_warehouses_and_untracked_products(): void
    {
        $inactive = Warehouse::create(['company_id' => $this->company->id, 'name' => 'Inativo', 'code' => 'X', 'is_active' => false]);
        $service = Product::create([
            'company_id' => $this->company->id, 'name' => 'Serviço', 'slug' => 'servico', 'sku' => 'SRV',
            'price' => '10.00', 'tax_rate' => '16.00', 'type' => 'service', 'track_stock' => false, 'status' => 'active',
        ]);

        $this->actingAs($this->admin)
            ->post('/inventory/opening', ['product_id' => $this->pen->id, 'warehouse_id' => $inactive->id, 'quantity' => 1])
            ->assertSessionHasErrors('warehouse_id');
        $this->post('/inventory/opening', ['product_id' => $service->id, 'warehouse_id' => $this->w1->id, 'quantity' => 1])
            ->assertSessionHasErrors('product_id');

        $this->assertSame(0, DB::table('stock_movements')->count());
    }

    public function test_adjustment_creation_is_validated(): void
    {
        $inactive = Warehouse::create(['company_id' => $this->company->id, 'name' => 'Inativo', 'code' => 'X', 'is_active' => false]);
        $service = Product::create([
            'company_id' => $this->company->id, 'name' => 'Serviço', 'slug' => 'servico', 'sku' => 'SRV',
            'price' => '10.00', 'tax_rate' => '16.00', 'type' => 'service', 'track_stock' => false, 'status' => 'active',
        ]);

        $item = ['product_id' => $this->pen->id, 'new_quantity' => 5];
        $valid = ['warehouse_id' => $this->w1->id, 'reason' => 'correction', 'items' => [$item]];

        $cases = [
            'motivo desconhecido' => [['reason' => 'porque sim'], 'reason'],
            'armazém inativo' => [['warehouse_id' => $inactive->id], 'warehouse_id'],
            'produto sem controlo de stock' => [['items' => [['product_id' => $service->id, 'new_quantity' => 1]]], 'items.0.product_id'],
            'produto repetido' => [['items' => [$item, $item]], 'items.0.product_id'],
        ];

        foreach ($cases as [$override, $errorKey]) {
            $this->actingAs($this->admin)->post('/inventory/adjustments', array_merge($valid, $override))->assertSessionHasErrors($errorKey);
        }

        $this->assertSame(0, StockAdjustment::withoutGlobalScopes()->count());

        $this->post('/inventory/adjustments', $valid)->assertSessionHasNoErrors();
        $this->assertSame(1, StockAdjustment::withoutGlobalScopes()->count());
    }

    // ── Movimentos ──────────────────────────────────────────────────────────

    public function test_movements_list_keeps_deleted_products_and_counts_adjustments_in_the_totals(): void
    {
        $this->stock->in($this->pen, $this->w1, 10);
        $this->stock->out($this->pen, $this->w1, 2);
        $this->stock->adjust($this->pen, $this->w1, 3);
        $this->stock->adjust($this->pen, $this->w1, -1);
        $this->stock->in($this->ink, $this->w1, 4);

        $this->ink->delete();

        $this->actingAs($this->admin)->get('/inventory/movements')->assertInertia(fn (Assert $page) => $page
            ->component('inventory/movements/index')
            ->where('kpis.total', 5)
            ->where('kpis.in', 17) // 10 + 4 de entradas + 3 de ajuste positivo
            ->where('kpis.out', 3) // 2 de saída + 1 de ajuste negativo
            ->has('movements.data', 5)
        );

        $this->get('/inventory/movements?search=Tinta')->assertInertia(fn (Assert $page) => $page
            ->has('movements.data', 1)
            ->where('movements.data.0.product.name', 'Tinta')
        );
    }

    // ── Produtos com stock ──────────────────────────────────────────────────

    public function test_product_with_stock_cannot_be_deleted_or_stop_tracking_stock(): void
    {
        $this->stock->in($this->pen, $this->w1, 3);

        $this->actingAs($this->admin)->delete("/products/{$this->pen->id}")->assertSessionHas('error');
        $this->assertNull(Product::withoutGlobalScopes()->find($this->pen->id)->deleted_at);

        $payload = [
            'name' => 'Caneta', 'type' => 'product', 'track_stock' => false, 'min_stock' => 0,
            'price' => 10, 'cost' => 5, 'tax_rate' => 16, 'tax_is_exempt' => false,
        ];
        $this->put("/products/{$this->pen->id}", $payload)->assertSessionHasErrors('track_stock');
        $this->assertTrue((bool) $this->pen->fresh()->track_stock);

        // Sem saldo, ambas as operações são permitidas
        $this->stock->out($this->pen, $this->w1, 3);
        $this->put("/products/{$this->pen->id}", $payload)->assertSessionHasNoErrors();
        $this->assertFalse((bool) $this->pen->fresh()->track_stock);

        $this->delete("/products/{$this->pen->id}")->assertSessionHas('success');
        $this->assertNotNull(Product::withoutGlobalScopes()->withTrashed()->find($this->pen->id)->deleted_at);
    }

    // ── Precisão ────────────────────────────────────────────────────────────

    public function test_fractional_quantities_keep_three_decimals_and_balance_matches_the_movements(): void
    {
        $this->stock->in($this->pen, $this->w1, 1);
        $this->stock->out($this->pen, $this->w1, 0.125);
        $this->stock->out($this->pen, $this->w1, 0.125);
        $this->stock->in($this->pen, $this->w1, 0.333);

        $movements = DB::table('stock_movements')->where('product_id', $this->pen->id)->get();
        $net = $movements->sum(fn ($m) => $m->type === 'out' ? -(float) $m->quantity : (float) $m->quantity);

        $this->assertEqualsWithDelta(1.083, $this->qty($this->pen, $this->w1), 0.00001);
        $this->assertEqualsWithDelta($net, $this->qty($this->pen, $this->w1), 0.00001);
        $this->assertEquals(0.125, (float) $movements->firstWhere('type', 'out')->quantity);
    }

    public function test_fractional_adjustment_and_closing_difference_are_applied_exactly(): void
    {
        $this->stock->in($this->pen, $this->w1, 2);
        $this->stock->in($this->ink, $this->w1, 2);

        $adjustment = StockAdjustment::create([
            'company_id' => $this->company->id, 'warehouse_id' => $this->w1->id,
            'reason' => 'physical_count', 'status' => 'draft', 'created_by' => $this->admin->id,
        ]);
        $adjustment->items()->create(['product_id' => $this->pen->id, 'old_quantity' => 2, 'new_quantity' => 1.875, 'difference' => -0.125]);
        app(StockAdjustmentService::class)->complete($adjustment);

        $this->assertEqualsWithDelta(1.875, $this->qty($this->pen, $this->w1), 0.00001);

        $closing = $this->closing();
        $closing->items()->where('product_id', $this->ink->id)->update(['quantity_counted' => 1.999]);
        app(InventoryClosingService::class)->complete($closing);

        $this->assertEqualsWithDelta(1.999, $this->qty($this->ink, $this->w1), 0.00001);
    }

    // ── Reserva de stock em transferências ──────────────────────────────────

    public function test_an_approved_transfer_reserves_stock_and_only_the_available_can_be_used(): void
    {
        $this->stock->in($this->pen, $this->w1, 10);
        $transfer = $this->transfer('pending', [$this->pen->id => 8]);

        // Pendente ainda não reserva
        $this->assertSame(10.0, $this->stock->getAvailable($this->pen, $this->w1));

        app(StockTransferService::class)->approve($transfer);

        $this->assertSame(10.0, $this->stock->getStock($this->pen, $this->w1));
        $this->assertSame(8.0, $this->stock->getReserved($this->pen, $this->w1));
        $this->assertSame(2.0, $this->stock->getAvailable($this->pen, $this->w1));
        // O armazém de destino não é afetado
        $this->assertSame(0.0, $this->stock->getReserved($this->pen, $this->w2));

        try {
            $this->stock->out($this->pen, $this->w1, 3);
            $this->fail('O que está reservado não se pode vender.');
        } catch (InsufficientStockException $e) {
            $this->assertSame(2.0, $e->available);
        }

        $this->stock->out($this->pen, $this->w1, 2);
        $this->assertSame(8.0, $this->qty($this->pen, $this->w1));
    }

    public function test_a_transfer_cannot_be_approved_beyond_the_available_stock(): void
    {
        $this->stock->in($this->pen, $this->w1, 10);
        $first = $this->transfer('pending', [$this->pen->id => 8]);
        $second = $this->transfer('pending', [$this->pen->id => 5]);

        $service = app(StockTransferService::class);
        $service->approve($first);

        try {
            $service->approve($second);
            $this->fail('A segunda aprovação excede o disponível.');
        } catch (ValidationException $e) {
            $this->assertStringContainsString('Disponível: 2', $e->errors()['stock'][0]);
        }

        $this->assertSame('pending', $second->fresh()->status);

        // Cancelar a primeira liberta a reserva e a segunda já passa
        $service->cancel($first);
        $this->assertSame(10.0, $this->stock->getAvailable($this->pen, $this->w1));
        $service->approve($second);
        $this->assertSame('approved', $second->fresh()->status);
    }

    public function test_approval_is_refused_through_the_http_flow_with_a_warning(): void
    {
        $this->stock->in($this->pen, $this->w1, 3);
        $transfer = $this->transfer('pending', [$this->pen->id => 5]);

        $this->actingAs($this->admin)->post("/inventory/transfers/{$transfer->id}/approve")->assertSessionHas('error');
        $this->assertSame('pending', $transfer->fresh()->status);
    }

    public function test_completing_a_transfer_uses_its_own_reservation_and_releases_it(): void
    {
        $this->stock->in($this->pen, $this->w1, 10);
        $service = app(StockTransferService::class);

        $first = $this->transfer('pending', [$this->pen->id => 8]);
        $second = $this->transfer('pending', [$this->pen->id => 2]);
        $service->approve($first);
        $service->approve($second);
        $this->assertSame(0.0, $this->stock->getAvailable($this->pen, $this->w1));

        // O stock todo está reservado e, mesmo assim, cada transferência consegue concluir-se
        $service->complete($first);
        $this->assertSame(2.0, $this->qty($this->pen, $this->w1));
        $this->assertSame(8.0, $this->qty($this->pen, $this->w2));
        $this->assertSame(0.0, $this->stock->getAvailable($this->pen, $this->w1));

        $service->complete($second);
        $this->assertSame(0.0, $this->qty($this->pen, $this->w1));
        $this->assertSame(10.0, $this->qty($this->pen, $this->w2));
        $this->assertSame(0.0, $this->stock->getReserved($this->pen, $this->w1));
    }

    public function test_a_physical_loss_below_the_reserved_quantity_makes_the_transfer_fail_cleanly(): void
    {
        $this->stock->in($this->pen, $this->w1, 10);
        $service = app(StockTransferService::class);
        $transfer = $this->transfer('pending', [$this->pen->id => 8]);
        $service->approve($transfer);

        // Perda física (ajuste) deixa o saldo abaixo do reservado
        $this->stock->adjust($this->pen, $this->w1, -5);

        try {
            $service->complete($transfer);
            $this->fail('Não há stock físico para concluir.');
        } catch (ValidationException) {
            // esperado
        }

        $this->assertSame(5.0, $this->qty($this->pen, $this->w1));
        $this->assertSame(0.0, $this->qty($this->pen, $this->w2));
        $this->assertSame('approved', $transfer->fresh()->status);
    }

    public function test_stock_list_shows_reserved_and_available_per_warehouse(): void
    {
        $this->stock->in($this->pen, $this->w1, 10);
        $this->stock->in($this->pen, $this->w2, 4);
        app(StockTransferService::class)->approve($this->transfer('pending', [$this->pen->id => 6]));

        $this->actingAs($this->admin)->get('/inventory/stocks')->assertInertia(fn (Assert $page) => $page
            ->has('stocks.data', 2)
            ->where('stocks.data.0.warehouse_id', $this->w1->id)
            ->where('stocks.data.0.reserved', 6)
            ->where('stocks.data.0.available', 4)
            ->where('stocks.data.1.reserved', 0)
            ->where('stocks.data.1.available', 4)
        );
    }

    public function test_transfer_page_shows_the_stock_available_at_the_origin(): void
    {
        $this->stock->in($this->pen, $this->w1, 10);
        $service = app(StockTransferService::class);
        $first = $this->transfer('pending', [$this->pen->id => 6]);
        $second = $this->transfer('pending', [$this->pen->id => 3]);
        $service->approve($first);

        // Para a pendente, o disponível desconta a reserva da outra; para a aprovada, não desconta a sua
        $this->actingAs($this->admin)->get("/inventory/transfers/{$second->id}")->assertInertia(fn (Assert $page) => $page
            ->where('transfer.items.0.available', 4)
        );
        $this->get("/inventory/transfers/{$first->id}")->assertInertia(fn (Assert $page) => $page
            ->where('transfer.items.0.available', 10)
        );
    }
}
