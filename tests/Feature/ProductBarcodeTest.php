<?php

namespace Tests\Feature;

use App\Models\Catalog\Product;
use App\Models\Company;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

/** Código de barras: único por empresa, normalizado, pesquisável e resolvido pelo endpoint de leitura. */
class ProductBarcodeTest extends TestCase
{
    use RefreshDatabase;

    private Company $a;

    private Company $b;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $make = fn (string $name, string $nuit) => Company::create(['name' => $name, 'nuit' => $nuit, 'address' => 'Maputo', 'phone' => '840000000']);
        $this->a = $make('Empresa A', '111111111');
        $this->b = $make('Empresa B', '222222222');

        foreach (['catalog.view', 'catalog.edit'] as $permission) {
            Permission::findOrCreate($permission, 'web');
        }

        $this->user = $this->userFor($this->a, ['catalog.view', 'catalog.edit']);
        $this->actingAs($this->user);
    }

    private function userFor(Company $company, array $permissions): User
    {
        $user = User::create(['company_id' => $company->id, 'name' => 'U', 'email' => uniqid().'@x.test', 'password' => bcrypt('password')]);
        $user->givePermissionTo($permissions);

        return $user;
    }

    private function product(Company $company, string $name, ?string $barcode, ?string $sku = null, string $status = 'active'): Product
    {
        return Product::create([
            'company_id' => $company->id, 'name' => $name, 'slug' => str($name)->slug().'-'.uniqid(),
            'sku' => $sku, 'barcode' => $barcode, 'price' => 10, 'track_stock' => true, 'status' => $status,
        ]);
    }

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Arroz 1kg', 'type' => 'product', 'track_stock' => true, 'min_stock' => 0,
            'price' => 50, 'cost' => 30, 'tax_rate' => 16, 'tax_is_exempt' => false,
        ], $overrides);
    }

    public function test_lookup_finds_by_barcode_then_sku(): void
    {
        $byBarcode = $this->product($this->a, 'Leite', '5601234567890', 'LEI-1');
        $bySku = $this->product($this->a, 'Pão', null, 'PAO-1');

        $this->getJson('/products/lookup?code=5601234567890')->assertOk()->assertJsonPath('id', $byBarcode->id);
        $this->getJson('/products/lookup?code=PAO-1')->assertOk()->assertJsonPath('id', $bySku->id);
    }

    public function test_lookup_returns_404_for_unknown_inactive_or_other_company(): void
    {
        $this->product($this->b, 'Alheio', '9990001112223');
        $this->product($this->a, 'Inativo', '1112223334445', null, 'inactive');

        $this->getJson('/products/lookup?code=9990001112223')->assertNotFound();
        $this->getJson('/products/lookup?code=1112223334445')->assertNotFound();
        $this->getJson('/products/lookup?code=0000000000000')->assertNotFound();
    }

    public function test_lookup_can_be_restricted_to_stock_tracked_products(): void
    {
        $service = $this->product($this->a, 'Serviço', '7770000000001');
        $service->update(['track_stock' => false]);

        $this->getJson('/products/lookup?code=7770000000001')->assertOk();
        $this->getJson('/products/lookup?code=7770000000001&track_stock=1')->assertNotFound();
    }

    public function test_lookup_requires_a_catalog_pos_or_inventory_permission(): void
    {
        $this->actingAs($this->userFor($this->a, []));

        $this->getJson('/products/lookup?code=123456')->assertForbidden();
    }

    public function test_barcode_must_be_unique_within_the_company(): void
    {
        $this->product($this->a, 'Existente', '5601234567890');

        $this->post('/products', $this->payload(['barcode' => '5601234567890']))->assertSessionHasErrors('barcode');
        $this->assertSame(1, Product::where('barcode', '5601234567890')->count());
    }

    public function test_same_barcode_is_allowed_in_another_company(): void
    {
        $this->product($this->b, 'Da outra empresa', '5601234567890');

        $this->post('/products', $this->payload(['barcode' => '5601234567890']))->assertSessionHasNoErrors();
        $this->assertSame(1, Product::withoutGlobalScopes()->where('company_id', $this->a->id)->where('barcode', '5601234567890')->count());
    }

    public function test_barcode_is_trimmed_and_empty_values_do_not_collide(): void
    {
        $this->post('/products', $this->payload(['name' => 'Um', 'barcode' => '  5601234567890  ']))->assertSessionHasNoErrors();
        $this->post('/products', $this->payload(['name' => 'Dois', 'barcode' => '']))->assertSessionHasNoErrors();
        $this->post('/products', $this->payload(['name' => 'Três', 'barcode' => '   ']))->assertSessionHasNoErrors();

        $this->assertSame('5601234567890', Product::where('name', 'Um')->value('barcode'));
        $this->assertNull(Product::where('name', 'Dois')->value('barcode'));
        $this->assertNull(Product::where('name', 'Três')->value('barcode'));
    }

    public function test_update_keeps_own_barcode_but_rejects_another_products(): void
    {
        $mine = $this->product($this->a, 'Meu', '1111111111111');
        $other = $this->product($this->a, 'Outro', '2222222222222');

        $this->put("/products/{$mine->id}", $this->payload(['barcode' => '1111111111111']))->assertSessionHasNoErrors();
        $this->put("/products/{$mine->id}", $this->payload(['barcode' => $other->barcode]))->assertSessionHasErrors('barcode');
    }

    public function test_products_list_search_matches_barcode(): void
    {
        $this->product($this->a, 'Leite', '5601234567890');
        $this->product($this->a, 'Pão', '1112223334445');

        $this->get('/products?search=5601234567890')
            ->assertInertia(fn (Assert $page) => $page->component('products/index')->has('products.data', 1)->where('products.data.0.name', 'Leite'));
    }
}
