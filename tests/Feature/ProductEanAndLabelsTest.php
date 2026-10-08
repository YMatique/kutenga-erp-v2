<?php

namespace Tests\Feature;

use App\Models\Catalog\Product;
use App\Models\Company;
use App\Models\User;
use App\Services\Catalog\Ean13;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

/** Gerador EAN-13 interno e ecrã/pesquisa de etiquetas. */
class ProductEanAndLabelsTest extends TestCase
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

        foreach (['catalog.view', 'catalog.edit', 'sales.create'] as $permission) {
            Permission::findOrCreate($permission, 'web');
        }

        $this->user = $this->userFor($this->a, ['catalog.view', 'catalog.edit', 'sales.create']);
        $this->actingAs($this->user);
    }

    private function userFor(Company $company, array $permissions): User
    {
        $user = User::create(['company_id' => $company->id, 'name' => 'U', 'email' => uniqid().'@x.test', 'password' => bcrypt('password')]);
        $user->givePermissionTo($permissions);

        return $user;
    }

    private function product(Company $company, string $name, ?string $barcode = null, array $extra = []): Product
    {
        return Product::create(array_merge([
            'company_id' => $company->id, 'name' => $name, 'slug' => str($name)->slug().'-'.uniqid(),
            'barcode' => $barcode, 'price' => 10, 'track_stock' => true, 'status' => 'active',
        ], $extra));
    }

    public function test_check_digit_matches_known_ean13_codes(): void
    {
        $this->assertTrue(Ean13::isValid('5901234123457'));
        $this->assertTrue(Ean13::isValid('4006381333931'));
        $this->assertFalse(Ean13::isValid('5901234123458'));
        $this->assertFalse(Ean13::isValid('590123412345'));
        $this->assertSame(7, Ean13::checkDigit('590123412345'));
    }

    public function test_next_internal_barcode_is_valid_and_sequential(): void
    {
        $first = $this->getJson('/products/barcode/next')->assertOk()->json('barcode');

        $this->assertTrue(Ean13::isValid($first));
        $this->assertStringStartsWith('20', $first);

        $this->product($this->a, 'Pão', $first);
        $second = $this->getJson('/products/barcode/next')->json('barcode');

        $this->assertNotSame($first, $second);
        $this->assertTrue(Ean13::isValid($second));
        $this->assertSame((int) substr($first, 2, 10) + 1, (int) substr($second, 2, 10));
    }

    public function test_next_internal_barcode_skips_soft_deleted_and_ignores_other_companies(): void
    {
        $deleted = $this->product($this->a, 'Apagado', Ean13::nextInternal($this->a->id));
        $deleted->delete();
        $this->product($this->b, 'Outra empresa', Ean13::nextInternal($this->b->id));

        $next = $this->getJson('/products/barcode/next')->json('barcode');

        $this->assertNotSame($deleted->barcode, $next);
        $this->assertSame((int) substr($deleted->barcode, 2, 10) + 1, (int) substr($next, 2, 10));
    }

    public function test_next_barcode_requires_catalog_edit(): void
    {
        $this->actingAs($this->userFor($this->a, ['catalog.view']));

        $this->getJson('/products/barcode/next')->assertForbidden();
    }

    public function test_labels_page_only_shows_products_of_the_company(): void
    {
        $mine = $this->product($this->a, 'Meu', '5601234567890');
        $theirs = $this->product($this->b, 'Alheio', '9990001112223');

        $this->get("/products/labels?ids={$mine->id},{$theirs->id},abc")
            ->assertInertia(fn (Assert $page) => $page
                ->component('products/labels')
                ->has('products', 1)
                ->where('products.0.id', $mine->id));
    }

    public function test_label_search_matches_name_sku_and_barcode_within_the_company(): void
    {
        $this->product($this->a, 'Leite Meio Gordo', '5601234567890', ['sku' => 'LEI-1']);
        $this->product($this->b, 'Leite Alheio', '5601234567891');

        $this->getJson('/products/search?q=Leite')->assertOk()->assertJsonCount(1);
        $this->getJson('/products/search?q=LEI-1')->assertOk()->assertJsonCount(1);
        $this->getJson('/products/search?q=5601234567890')->assertOk()->assertJsonCount(1);
        $this->getJson('/products/search?q=L')->assertOk()->assertJsonCount(0);
    }
}
