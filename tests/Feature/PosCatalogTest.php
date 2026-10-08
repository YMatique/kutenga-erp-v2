<?php

namespace Tests\Feature;

use App\Models\Catalog\Category;
use App\Models\Catalog\Product;
use App\Models\Company;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

/** Catálogo do POS paginado no servidor e leitura exacta por código. */
class PosCatalogTest extends TestCase
{
    use RefreshDatabase;

    private Company $a;
    private Company $b;
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $make = fn (string $name, string $nuit) => Company::create(['name' => $name, 'nuit' => $nuit, 'address' => 'Maputo', 'phone' => '840000000', 'subscription_plan' => 'crescimento']);
        $this->a = $make('Empresa A', '111111111');
        $this->b = $make('Empresa B', '222222222');

        foreach (['catalog.view', 'sales.create'] as $permission) {
            Permission::findOrCreate($permission, 'web');
        }

        $this->user = $this->userFor($this->a, ['catalog.view', 'sales.create']);
        $this->actingAs($this->user);
    }

    private function userFor(Company $company, array $permissions): User
    {
        $user = User::create(['company_id' => $company->id, 'name' => 'U', 'email' => uniqid() . '@x.test', 'password' => bcrypt('password')]);
        $user->givePermissionTo($permissions);

        return $user;
    }

    private function product(Company $company, string $name, ?string $barcode = null, array $extra = []): Product
    {
        return Product::create(array_merge([
            'company_id' => $company->id, 'name' => $name, 'slug' => str($name)->slug() . '-' . uniqid(),
            'barcode' => $barcode, 'price' => 10, 'track_stock' => true, 'status' => 'active',
        ], $extra));
    }

    public function test_pos_products_endpoint_paginates_filters_and_is_company_scoped(): void
    {
        $category = Category::create(['company_id' => $this->a->id, 'name' => 'Mercearia', 'slug' => 'mercearia', 'status' => 'active']);

        foreach (range(1, 50) as $i) {
            $this->product($this->a, sprintf('Produto %02d', $i), null, ['category_id' => $i <= 5 ? $category->id : null]);
        }

        $this->product($this->b, 'Produto Alheio');
        $this->product($this->a, 'Produto Inativo', null, ['status' => 'inactive']);

        $first = $this->getJson('/pos/products')->assertOk();
        $this->assertCount(48, $first->json('data'));
        $this->assertTrue($first->json('has_more'));

        $second = $this->getJson('/pos/products?page=2')->assertOk();
        $this->assertCount(2, $second->json('data'));
        $this->assertFalse($second->json('has_more'));

        $this->getJson('/pos/products?search=Produto 07')->assertJsonCount(1, 'data');
        $this->getJson("/pos/products?category_id={$category->id}")->assertJsonCount(5, 'data');
        $this->getJson('/pos/products?search=Alheio')->assertJsonCount(0, 'data');
    }

    public function test_pos_products_code_returns_only_the_exact_match(): void
    {
        $match = $this->product($this->a, 'Leite', '5601234567890', ['sku' => 'LEI-1']);
        $this->product($this->a, 'Leite 2', '5601234567891');

        $this->getJson('/pos/products?code=5601234567890')->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $match->id);
        $this->getJson('/pos/products?code=LEI-1')->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $match->id);
        $this->getJson('/pos/products?code=560123456789')->assertJsonCount(0, 'data');
    }

    public function test_pos_products_requires_sales_create(): void
    {
        $this->actingAs($this->userFor($this->a, ['catalog.view']));

        $this->getJson('/pos/products')->assertForbidden();
    }
}
