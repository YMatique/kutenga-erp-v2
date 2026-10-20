<?php

namespace Tests\Feature;

use App\Models\Catalog\Product;
use App\Models\Company;
use App\Models\Inventory\InventoryClosing;
use App\Models\Inventory\ProductStock;
use App\Models\Inventory\StockAdjustment;
use App\Models\Inventory\StockTransfer;
use App\Models\Inventory\Warehouse;
use App\Models\User;
use App\Services\Inventory\StockService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

/** Dashboard de inventário: números calculados na base de dados e lista de atenção limitada aos mais urgentes. */
class InventoryDashboardTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;

    private Warehouse $main;

    private Warehouse $store;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::create(['name' => 'Empresa', 'nuit' => '123456789', 'address' => 'Maputo', 'phone' => '840000000']);
        $this->main = Warehouse::create(['company_id' => $this->company->id, 'name' => 'Central', 'code' => 'C1', 'is_active' => true, 'is_default' => true]);
        $this->store = Warehouse::create(['company_id' => $this->company->id, 'name' => 'Loja', 'code' => 'L1', 'is_active' => true]);

        Permission::findOrCreate('inventory.view', 'web');
        $user = User::create(['company_id' => $this->company->id, 'name' => 'Operador', 'email' => 'u@x.test', 'password' => bcrypt('password')]);
        $user->givePermissionTo('inventory.view');
        $this->actingAs($user);
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    private function product(string $name, float $min = 5, float $cost = 0, array $extra = [], ?Company $company = null): Product
    {
        $company ??= $this->company;

        return Product::create(array_merge([
            'company_id' => $company->id, 'name' => $name, 'slug' => str($name)->slug().'-'.uniqid(),
            'sku' => strtoupper(substr(md5($name.uniqid()), 0, 6)), 'price' => 10, 'cost' => $cost,
            'track_stock' => true, 'min_stock' => $min, 'status' => 'active',
        ], $extra));
    }

    private function stockAt(Product $product, Warehouse $warehouse, float $quantity): void
    {
        ProductStock::create(['company_id' => $product->company_id, 'product_id' => $product->id, 'warehouse_id' => $warehouse->id, 'quantity' => $quantity]);
    }

    public function test_stats_and_warehouse_summary_come_from_the_stock(): void
    {
        $low = $this->product('Feijão', min: 5, cost: 10);
        $this->stockAt($low, $this->main, 2);
        $this->stockAt($low, $this->store, 1); // 3 no total, abaixo do mínimo de 5

        $healthy = $this->product('Arroz', min: 5, cost: 2);
        $this->stockAt($healthy, $this->main, 100);

        $this->product('Óleo'); // sem linhas de stock: esgotado

        $this->product('Consultoria', 0, 0, ['type' => 'service', 'track_stock' => false]);

        $gone = $this->product('Apagado', min: 5, cost: 50);
        $this->stockAt($gone, $this->main, 1000);
        $gone->delete();

        $other = Company::create(['name' => 'Outra', 'nuit' => '999999999', 'address' => 'Beira', 'phone' => '820000000']);
        $foreign = $this->product('Alheio', 5, 100, [], $other);
        $otherWarehouse = Warehouse::create(['company_id' => $other->id, 'name' => 'Deles', 'code' => 'D', 'is_active' => true]);
        $this->stockAt($foreign, $otherWarehouse, 500);

        Warehouse::create(['company_id' => $this->company->id, 'name' => 'Inativo', 'code' => 'X', 'is_active' => false]);

        $this->get('/inventory')->assertInertia(fn (Assert $page) => $page
            ->component('inventory/dashboard/index')
            ->where('stats.products', 3) // só os que controlam stock e não foram apagados
            ->where('stats.warehouses', 2) // o inativo não conta
            ->where('stats.total_stock', 103)
            ->where('stats.inventory_value', 230) // 3 × 10 + 100 × 2
            ->where('stats.low_stock', 1)
            ->where('stats.out_of_stock', 1)
            ->has('warehouseSummary', 2)
            ->where('warehouseSummary.0.name', 'Central') // o predefinido primeiro
            ->where('warehouseSummary.0.is_default', true)
            ->where('warehouseSummary.0.products', 2)
            ->where('warehouseSummary.0.value', 220) // 2 × 10 + 100 × 2
            ->where('warehouseSummary.0.share', 95.7)
            ->where('warehouseSummary.1.name', 'Loja')
            ->where('warehouseSummary.1.value', 10)
        );
    }

    public function test_a_selected_warehouse_scopes_the_numbers_to_that_warehouse(): void
    {
        $bean = $this->product('Feijão', min: 5, cost: 10);
        $this->stockAt($bean, $this->main, 2);
        $this->stockAt($bean, $this->store, 1);
        $rice = $this->product('Arroz', min: 5, cost: 2);
        $this->stockAt($rice, $this->main, 100);
        $soup = $this->product('Sopa', min: 5, cost: 3);
        $this->stockAt($soup, $this->store, 10);
        $this->product('Óleo'); // sem linhas de stock em nenhum armazém

        // Sem filtro: tudo, com o total de todos os armazéns
        $this->get('/inventory')->assertInertia(fn (Assert $page) => $page
            ->where('filters.warehouse_id', null)
            ->where('stats.products', 4)
            ->where('stats.out_of_stock', 1) // o Óleo
            ->where('stats.low_stock', 1) // o Feijão, com 3 no total
        );

        // A Loja: só os produtos que lá têm linha; o Óleo não "esgotou" na Loja, não existe lá
        $this->get("/inventory?warehouse_id={$this->store->id}")->assertInertia(fn (Assert $page) => $page
            ->where('filters.warehouse_id', $this->store->id)
            ->where('stats.products', 2)
            ->where('stats.out_of_stock', 0)
            ->where('stats.low_stock', 1) // o Feijão tem 1 na Loja
            ->where('stats.total_stock', 11)
            ->where('stats.inventory_value', 40) // 1 × 10 + 10 × 3
            ->has('attentionProducts', 1)
            ->where('attentionProducts.0.name', 'Feijão')
            ->where('attentionProducts.0.total_stock', 1)
            ->has('warehouseSummary', 2) // a lista de armazéns, e o seu peso, não muda
            ->where('warehouseSummary.0.share', 84.6) // Central: 220 de 260
        );

        $this->get("/inventory?warehouse_id={$this->main->id}")->assertInertia(fn (Assert $page) => $page
            ->where('stats.products', 2)
            ->where('stats.low_stock', 1) // o Feijão tem 2 na Central
            ->where('stats.inventory_value', 220)
        );
    }

    public function test_a_warehouse_of_another_company_or_that_does_not_exist_is_ignored(): void
    {
        $other = Company::create(['name' => 'Outra', 'nuit' => '999999999', 'address' => 'Beira', 'phone' => '820000000']);
        $foreign = Warehouse::create(['company_id' => $other->id, 'name' => 'Deles', 'code' => 'D', 'is_active' => true]);
        $this->stockAt($this->product('Arroz', cost: 2), $this->main, 10);

        foreach ([$foreign->id, 99999] as $id) {
            $this->get("/inventory?warehouse_id={$id}")->assertInertia(fn (Assert $page) => $page
                ->where('filters.warehouse_id', null)
                ->where('stats.inventory_value', 20)
            );
        }
    }

    public function test_the_warehouse_filter_also_scopes_movements_activity_and_the_work_queue(): void
    {
        $product = $this->product('Arroz', cost: 10);
        $stock = app(StockService::class);
        $stock->in($product, $this->main, 3);
        $stock->in($product, $this->store, 2);

        $transfer = fn (int $from, int $to) => StockTransfer::create(['company_id' => $this->company->id, 'from_warehouse_id' => $from, 'to_warehouse_id' => $to, 'status' => 'pending']);
        $third = Warehouse::create(['company_id' => $this->company->id, 'name' => 'Terceiro', 'code' => 'T', 'is_active' => true]);
        $transfer($this->main->id, $this->store->id);
        $transfer($this->store->id, $third->id);
        $transfer($this->main->id, $third->id);

        $adjustment = fn (int $warehouse) => StockAdjustment::create(['company_id' => $this->company->id, 'warehouse_id' => $warehouse, 'reason' => 'correction', 'status' => 'draft']);
        $adjustment($this->main->id);
        $adjustment($this->store->id);

        $closing = fn (?int $warehouse) => InventoryClosing::create(['company_id' => $this->company->id, 'warehouse_id' => $warehouse, 'reference_date' => now()->toDateString(), 'status' => 'draft']);
        $closing(null); // de todos os armazéns: conta em qualquer um
        $closing($this->store->id);

        $this->get("/inventory?warehouse_id={$this->store->id}")->assertInertia(fn (Assert $page) => $page
            ->has('recentMovements', 1)
            ->where('recentMovements.0.warehouse.name', 'Loja')
            ->where('activity.29.entries', 20) // só a entrada da Loja: 2 × 10
            ->where('queue.transfers_pending', 2) // main→store e store→third
            ->where('queue.adjustments_draft', 1)
            ->where('queue.closings_open', 2) // o geral e o da Loja
        );

        $this->get('/inventory')->assertInertia(fn (Assert $page) => $page
            ->has('recentMovements', 2)
            ->where('activity.29.entries', 50)
            ->where('queue.transfers_pending', 3)
            ->where('queue.adjustments_draft', 2)
            ->where('queue.closings_open', 2)
        );
    }

    public function test_attention_list_shows_the_most_urgent_first_and_is_limited(): void
    {
        // 10 produtos em alerta: 2 esgotados e 8 abaixo do mínimo, uns mais graves que outros
        $this->product('Esgotado B');
        $this->product('Esgotado A');

        foreach (range(1, 8) as $i) {
            $product = $this->product("Baixo {$i}", min: 10);
            $this->stockAt($product, $this->main, $i); // 1 de 10 é mais grave do que 8 de 10
        }

        $this->get('/inventory')->assertInertia(fn (Assert $page) => $page
            ->where('stats.out_of_stock', 2)
            ->where('stats.low_stock', 8) // os números contam todos, a lista só mostra os mais urgentes
            ->has('attentionProducts', 8)
            ->where('attentionProducts.0.name', 'Esgotado A')
            ->where('attentionProducts.0.status', 'out_of_stock')
            ->where('attentionProducts.1.name', 'Esgotado B')
            ->where('attentionProducts.2.name', 'Baixo 1')
            ->where('attentionProducts.2.status', 'low')
            ->where('attentionProducts.2.total_stock', 1)
            ->where('attentionProducts.2.min_stock', 10)
            ->where('attentionProducts.7.name', 'Baixo 6')
        );
    }

    public function test_recent_movements_carry_the_user_and_the_note(): void
    {
        $product = $this->product('Arroz');
        app(StockService::class)->in($product, $this->main, 10, null, null, 'Compra ao fornecedor');

        $this->get('/inventory')->assertInertia(fn (Assert $page) => $page
            ->has('recentMovements', 1)
            ->where('recentMovements.0.product.name', 'Arroz')
            ->where('recentMovements.0.notes', 'Compra ao fornecedor')
            ->where('recentMovements.0.user.name', 'Operador')
        );
    }

    public function test_activity_values_entries_and_exits_per_day_at_the_current_cost(): void
    {
        Carbon::setTestNow('2026-10-20 12:00:00');

        $product = $this->product('Arroz', cost: 10);
        $stock = app(StockService::class);

        $stock->opening($product, $this->main, 100); // carga inicial: não é atividade
        $stock->in($product, $this->main, 4); // entrada de 40
        $stock->out($product, $this->main, 3); // saída de 30
        $stock->adjust($product, $this->main, 2); // ajuste positivo: entrada de 20
        $stock->adjust($product, $this->main, -1); // ajuste negativo: saída de 10

        // Fora da janela de 30 dias e no primeiro dia dela
        $stock->in($product, $this->main, 50)->forceFill(['created_at' => now()->subDays(40)])->save();
        $stock->in($product, $this->main, 1)->forceFill(['created_at' => now()->subDays(29)])->save();

        // De outra empresa: não conta
        $other = Company::create(['name' => 'Outra', 'nuit' => '999999999', 'address' => 'Beira', 'phone' => '820000000']);
        $foreign = $this->product('Alheio', 5, 100, [], $other);
        $otherWarehouse = Warehouse::create(['company_id' => $other->id, 'name' => 'Deles', 'code' => 'D', 'is_active' => true]);
        $stock->in($foreign, $otherWarehouse, 9);

        $this->get('/inventory')->assertInertia(fn (Assert $page) => $page
            ->has('activity', 30)
            ->where('activity.0.date', now()->subDays(29)->toDateString())
            ->where('activity.0.entries', 10)
            ->where('activity.0.exits', 0)
            ->where('activity.0.movements', 1)
            ->where('activity.29.date', now()->toDateString())
            ->where('activity.29.entries', 60)
            ->where('activity.29.exits', 40)
            ->where('activity.29.movements', 4)
            ->where('activity.15.movements', 0) // os dias sem movimentos também vêm, a zero
        );
    }

    public function test_activity_days_are_business_days_not_utc_days(): void
    {
        Carbon::setTestNow('2026-10-31 23:30:00'); // já é 1 de novembro em Maputo

        $product = $this->product('Arroz', cost: 10);
        $stock = app(StockService::class);

        $stock->in($product, $this->main, 3); // 23:30 UTC = 01:30 de 1/11 em Maputo: entrada de 30
        $earlier = $stock->in($product, $this->main, 2); // 21:00 UTC = 23:00 de 31/10 em Maputo: entrada de 20
        $earlier->forceFill(['created_at' => '2026-10-31 21:00:00'])->save();
        $first = $stock->in($product, $this->main, 1); // 21:59 UTC = 23:59 de 3/10: primeiro dia da janela
        $first->forceFill(['created_at' => '2026-10-03 21:59:00'])->save();

        $this->get('/inventory')->assertInertia(fn (Assert $page) => $page
            ->where('activity.0.date', '2026-10-03')
            ->where('activity.0.entries', 10)
            ->where('activity.28.date', '2026-10-31')
            ->where('activity.28.entries', 20)
            ->where('activity.28.movements', 1)
            ->where('activity.29.date', '2026-11-01')
            ->where('activity.29.entries', 30)
            ->where('activity.29.movements', 1)
        );
    }

    public function test_work_queue_counts_what_is_waiting_to_be_handled(): void
    {
        $transfer = fn (string $status) => StockTransfer::create([
            'company_id' => $this->company->id, 'from_warehouse_id' => $this->main->id,
            'to_warehouse_id' => $this->store->id, 'status' => $status,
        ]);
        $transfer('pending');
        $transfer('pending');
        $transfer('approved');
        $transfer('completed');
        $transfer('cancelled');

        $adjustment = fn (string $status) => StockAdjustment::create([
            'company_id' => $this->company->id, 'warehouse_id' => $this->main->id, 'reason' => 'correction', 'status' => $status,
        ]);
        $adjustment('draft');
        $adjustment('completed');

        $closing = fn (string $status) => InventoryClosing::create([
            'company_id' => $this->company->id, 'reference_date' => now()->toDateString(), 'status' => $status,
        ]);
        $closing('draft');
        $closing('draft');
        $closing('completed');

        $this->get('/inventory')->assertInertia(fn (Assert $page) => $page
            ->where('queue.transfers_pending', 2)
            ->where('queue.transfers_approved', 1)
            ->where('queue.adjustments_draft', 1)
            ->where('queue.closings_open', 2)
        );
    }

    public function test_quick_actions_follow_the_permissions_of_the_user(): void
    {
        $this->get('/inventory')->assertInertia(fn (Assert $page) => $page
            ->where('can.adjust', false)
            ->where('can.transfer', false)
            ->where('can.catalog', false)
        );

        foreach (['inventory.transfer', 'catalog.edit'] as $permission) {
            Permission::findOrCreate($permission, 'web');
            auth()->user()->givePermissionTo($permission);
        }

        $this->get('/inventory')->assertInertia(fn (Assert $page) => $page
            ->where('can.adjust', false)
            ->where('can.transfer', true)
            ->where('can.catalog', true)
        );
    }

    public function test_dashboard_requires_inventory_view(): void
    {
        $user = User::create(['company_id' => $this->company->id, 'name' => 'Sem', 'email' => 'sem@x.test', 'password' => bcrypt('password')]);

        $this->actingAs($user)->get('/inventory')->assertForbidden();
    }
}
