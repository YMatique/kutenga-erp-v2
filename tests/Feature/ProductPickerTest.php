<?php

namespace Tests\Feature;

use App\Models\Catalog\Product;
use App\Models\Catalog\Unit;
use App\Models\Company;
use App\Models\Inventory\StockTransfer;
use App\Models\Inventory\Warehouse;
use App\Models\User;
use App\Services\Inventory\StockService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

/** Pesquisa de produtos dos formulários de stock: só os primeiros resultados, e não o catálogo inteiro. */
class ProductPickerTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;

    private User $user;

    private Warehouse $main;

    private Warehouse $store;

    private StockService $stock;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::create(['name' => 'Empresa', 'nuit' => '123456789', 'address' => 'Maputo', 'phone' => '840000000']);
        $this->main = Warehouse::create(['company_id' => $this->company->id, 'name' => 'Central', 'code' => 'C', 'is_active' => true]);
        $this->store = Warehouse::create(['company_id' => $this->company->id, 'name' => 'Loja', 'code' => 'L', 'is_active' => true]);

        foreach (['inventory.view', 'inventory.adjust', 'inventory.transfer'] as $permission) {
            Permission::findOrCreate($permission, 'web');
        }
        $this->user = $this->userWith(['inventory.view', 'inventory.adjust']);
        $this->actingAs($this->user);

        $this->stock = app(StockService::class);
    }

    private function userWith(array $permissions): User
    {
        $user = User::create(['company_id' => $this->company->id, 'name' => 'U', 'email' => uniqid().'@x.test', 'password' => bcrypt('password')]);
        $user->givePermissionTo($permissions);

        return $user;
    }

    private function product(string $name, array $extra = [], ?Company $company = null): Product
    {
        $company ??= $this->company;

        return Product::create(array_merge([
            'company_id' => $company->id, 'name' => $name, 'slug' => str($name)->slug().'-'.uniqid(),
            'sku' => strtoupper(substr(md5($name), 0, 6)), 'price' => 10, 'track_stock' => true, 'status' => 'active',
        ], $extra));
    }

    private function names(string $query = ''): array
    {
        return collect($this->getJson('/inventory/products/search'.$query)->assertOk()->json('data'))->pluck('name')->all();
    }

    public function test_it_finds_tracked_products_of_the_company_by_name_sku_or_barcode(): void
    {
        $this->product('Caneta Azul', ['sku' => 'CAN-AZ', 'barcode' => '5601234567890']);
        $this->product('Caderno', ['sku' => 'CAD-1']);
        $this->product('Consultoria', ['type' => 'service', 'track_stock' => false]); // não controla stock
        $other = Company::create(['name' => 'Outra', 'nuit' => '999999999', 'address' => 'Beira', 'phone' => '820000000']);
        $this->product('Caneta Alheia', [], $other);

        $this->assertSame(['Caderno', 'Caneta Azul'], $this->names()); // ordenado por nome, sem o serviço nem a empresa alheia
        $this->assertSame(['Caneta Azul'], $this->names('?q=azul'));
        $this->assertSame(['Caneta Azul'], $this->names('?q=CAN-AZ'));
        $this->assertSame(['Caneta Azul'], $this->names('?q=5601234'));
        $this->assertSame([], $this->names('?q=alheia'));
    }

    public function test_results_are_limited_and_say_when_there_are_more(): void
    {
        foreach (range(1, 25) as $i) {
            $this->product(sprintf('Produto %02d', $i));
        }

        $response = $this->getJson('/inventory/products/search')->assertOk();
        $this->assertCount(20, $response->json('data'));
        $this->assertTrue($response->json('has_more'));
        $this->assertSame('Produto 01', $response->json('data.0.name'));

        $narrow = $this->getJson('/inventory/products/search?q=Produto 2')->assertOk();
        $this->assertCount(6, $narrow->json('data')); // 20 a 25
        $this->assertFalse($narrow->json('has_more'));
    }

    public function test_exact_mode_is_for_scanned_codes_and_never_matches_part_of_a_code(): void
    {
        $this->product('Caneta', ['sku' => 'CAN-1', 'barcode' => '5601234567890']);
        $this->product('Caneta Grande', ['sku' => 'CAN-10', 'barcode' => '56012345678901']);

        $this->assertSame(['Caneta'], $this->names('?q=5601234567890&exact=1'));
        $this->assertSame(['Caneta'], $this->names('?q=CAN-1&exact=1')); // CAN-10 tem o prefixo, mas não é o mesmo código
        $this->assertSame([], $this->names('?q=560123&exact=1'));
    }

    public function test_with_a_warehouse_each_result_carries_the_stock_there_and_what_is_still_available(): void
    {
        $pen = $this->product('Caneta');
        $this->stock->in($pen, $this->main, 10);
        $this->stock->in($pen, $this->store, 3);
        $transfer = StockTransfer::create(['company_id' => $this->company->id, 'from_warehouse_id' => $this->main->id, 'to_warehouse_id' => $this->store->id, 'status' => 'approved']);
        $transfer->items()->create(['product_id' => $pen->id, 'quantity' => 4]); // reservadas na Central

        $central = $this->getJson("/inventory/products/search?warehouse_id={$this->main->id}")->json('data.0');
        $this->assertEquals(10, $central['stock']);
        $this->assertEquals(6, $central['available']);

        $shop = $this->getJson("/inventory/products/search?warehouse_id={$this->store->id}")->json('data.0');
        $this->assertEquals(3, $shop['stock']);
        $this->assertEquals(3, $shop['available']);

        // Sem armazém não há números de stock
        $this->assertNull($this->getJson('/inventory/products/search')->json('data.0.stock'));
    }

    public function test_in_stock_only_lists_products_that_have_stock_in_that_warehouse(): void
    {
        $this->stock->in($this->product('Na Central'), $this->main, 5);
        $this->stock->in($this->product('Na Loja'), $this->store, 5);
        $this->product('Sem stock');

        $this->assertSame(['Na Central'], $this->names("?in_stock=1&warehouse_id={$this->main->id}"));
        $this->assertSame(['Na Loja'], $this->names("?in_stock=1&warehouse_id={$this->store->id}"));
        $this->assertSame(['Na Central', 'Na Loja'], $this->names('?in_stock=1')); // em qualquer armazém
        $this->assertCount(3, $this->names()); // sem o filtro vêm todos
    }

    public function test_results_say_whether_the_unit_accepts_fractions(): void
    {
        $each = Unit::create(['company_id' => $this->company->id, 'name' => 'Unidade', 'short_name' => 'UN', 'allow_decimals' => false]);
        $this->product('Caneta', ['unit_id' => $each->id]);
        $this->product('Avulso');

        $rows = collect($this->getJson('/inventory/products/search')->json('data'))->keyBy('name');

        $this->assertFalse($rows['Caneta']['allow_decimals']);
        $this->assertSame('UN', $rows['Caneta']['unit']);
        $this->assertTrue($rows['Avulso']['allow_decimals']); // sem unidade: sem restrição
    }

    public function test_a_warehouse_of_another_company_is_refused(): void
    {
        $other = Company::create(['name' => 'Outra', 'nuit' => '999999999', 'address' => 'Beira', 'phone' => '820000000']);
        $foreign = Warehouse::create(['company_id' => $other->id, 'name' => 'Deles', 'code' => 'D', 'is_active' => true]);

        $this->getJson("/inventory/products/search?warehouse_id={$foreign->id}")->assertStatus(422)->assertJsonValidationErrors('warehouse_id');
    }

    public function test_only_who_can_adjust_or_transfer_may_search(): void
    {
        $this->product('Caneta');

        $this->actingAs($this->userWith(['inventory.view']))->getJson('/inventory/products/search')->assertForbidden();
        $this->actingAs($this->userWith(['inventory.transfer']))->getJson('/inventory/products/search')->assertOk();
        $this->actingAs($this->userWith(['inventory.adjust']))->getJson('/inventory/products/search')->assertOk();
    }

    public function test_the_forms_no_longer_receive_the_whole_catalog(): void
    {
        $this->actingAs($this->userWith(['inventory.view', 'inventory.adjust', 'inventory.transfer']));
        $this->stock->in($this->product('Caneta'), $this->main, 5);

        foreach (['/inventory/opening', '/inventory/adjustments/create', '/inventory/transfers/create'] as $url) {
            $this->get($url)->assertOk()->assertInertia(fn (Assert $page) => $page->has('warehouses')->missing('products'));
        }
    }
}
