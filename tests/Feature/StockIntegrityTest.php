<?php

namespace Tests\Feature;

use App\Exceptions\InsufficientStockException;
use App\Models\Catalog\Branch;
use App\Models\Catalog\Product;
use App\Models\Company;
use App\Models\Inventory\StockAdjustment;
use App\Models\Inventory\StockTransfer;
use App\Models\Inventory\Warehouse;
use App\Models\Role;
use App\Models\User;
use App\Services\Inventory\StockAdjustmentService;
use App\Services\Inventory\StockService;
use App\Services\Inventory\StockTransferService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
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

        $permissions = ['inventory.view', 'inventory.adjust', 'inventory.transfer'];
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
            collect($queries)->contains(fn ($sql) => preg_match('/update "product_stocks" set "quantity" = "quantity" [+-]/', $sql) === 1),
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
}
