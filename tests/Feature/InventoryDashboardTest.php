<?php

namespace Tests\Feature;

use App\Models\Catalog\Product;
use App\Models\Company;
use App\Models\Inventory\ProductStock;
use App\Models\Inventory\Warehouse;
use App\Models\User;
use App\Services\Inventory\StockService;
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

    public function test_dashboard_requires_inventory_view(): void
    {
        $user = User::create(['company_id' => $this->company->id, 'name' => 'Sem', 'email' => 'sem@x.test', 'password' => bcrypt('password')]);

        $this->actingAs($user)->get('/inventory')->assertForbidden();
    }
}
