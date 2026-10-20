<?php

namespace Tests\Feature;

use App\Models\Catalog\Product;
use App\Models\Company;
use App\Models\Inventory\ProductStock;
use App\Models\Inventory\StockTransfer;
use App\Models\Inventory\Warehouse;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class InventoryStockIndexTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;

    private Warehouse $main;

    private Warehouse $store;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::create(['name' => 'Empresa', 'nuit' => '123456789', 'address' => 'Maputo', 'phone' => '840000000']);
        $this->main = Warehouse::create(['company_id' => $this->company->id, 'name' => 'Central', 'code' => 'C1', 'is_active' => true]);
        $this->store = Warehouse::create(['company_id' => $this->company->id, 'name' => 'Loja', 'code' => 'L1', 'is_active' => true]);

        Permission::findOrCreate('inventory.view', 'web');
        $user = User::create(['company_id' => $this->company->id, 'name' => 'U', 'email' => 'u@x.test', 'password' => bcrypt('password')]);
        $user->givePermissionTo('inventory.view');
        $this->actingAs($user);
    }

    private function stock(string $name, float $quantity, float $min = 5, ?Warehouse $warehouse = null, ?Company $company = null): ProductStock
    {
        $company ??= $this->company;

        $product = Product::create([
            'company_id' => $company->id, 'name' => $name, 'slug' => str($name)->slug().'-'.uniqid(),
            'sku' => strtoupper(substr(md5($name), 0, 6)), 'price' => 10, 'track_stock' => true, 'min_stock' => $min, 'status' => 'active',
        ]);

        return ProductStock::create([
            'company_id' => $company->id, 'product_id' => $product->id,
            'warehouse_id' => ($warehouse ?? $this->main)->id, 'quantity' => $quantity,
        ]);
    }

    public function test_stock_list_is_paginated(): void
    {
        foreach (range(1, 25) as $i) {
            $this->stock(sprintf('Produto %02d', $i), 10);
        }

        $this->get('/inventory/stocks')->assertInertia(fn (Assert $page) => $page
            ->component('inventory/stocks/index')
            ->has('stocks.data', 20)
            ->where('stocks.total', 25)
            ->where('stocks.last_page', 2)
            ->where('stocks.data.0.product.name', 'Produto 01') // ordenado por nome
        );

        $this->get('/inventory/stocks?page=2')->assertInertia(fn (Assert $page) => $page->has('stocks.data', 5));
    }

    public function test_filters_by_search_warehouse_and_status(): void
    {
        $this->stock('Arroz', 100);                  // normal
        $this->stock('Feijão', 3, 5);                // baixo (3 <= 5)
        $this->stock('Óleo', 0);                     // esgotado
        $this->stock('Arroz da Loja', 50, 5, $this->store);

        $names = fn (string $query) => collect($this->get("/inventory/stocks?{$query}")->viewData('page')['props']['stocks']['data'])
            ->pluck('product.name')->sort()->values()->all();

        $this->assertSame(['Arroz', 'Arroz da Loja'], $names('search=Arroz'));
        $this->assertSame(['Arroz da Loja'], $names('warehouse_id='.$this->store->id));
        $this->assertSame(['Feijão'], $names('status=low'));
        $this->assertSame(['Óleo'], $names('status=out_of_stock'));
        $this->assertSame(['Arroz', 'Arroz da Loja'], $names('status=in_stock'));
    }

    public function test_other_companies_stock_is_never_listed(): void
    {
        $other = Company::create(['name' => 'Outra', 'nuit' => '999999999', 'address' => 'Beira', 'phone' => '820000000']);
        $otherWarehouse = Warehouse::create(['company_id' => $other->id, 'name' => 'Deles', 'code' => 'D1', 'is_active' => true]);

        $this->stock('Meu produto', 10);
        $this->stock('Produto alheio', 10, 5, $otherWarehouse, $other);

        $this->get('/inventory/stocks')->assertInertia(fn (Assert $page) => $page->has('stocks.data', 1)->where('stocks.data.0.product.name', 'Meu produto'));
    }

    private function csv(string $uri): array
    {
        $response = $this->get($uri)->assertOk();

        $this->assertStringContainsString('text/csv', $response->headers->get('Content-Type'));
        $this->assertStringContainsString('attachment', $response->headers->get('Content-Disposition'));

        // Sem o BOM UTF-8 (que o Excel exige) e sem linhas vazias
        $content = preg_replace('/^\xEF\xBB\xBF/', '', $response->streamedContent());
        $lines = array_filter(preg_split('/\r?\n/', $content), fn ($line) => $line !== '');

        return array_map('str_getcsv', array_values($lines));
    }

    public function test_stock_export_respects_filters_and_exports_numbers(): void
    {
        $this->stock('Arroz', 100);
        $this->stock('Feijão', 3, 5);
        $this->stock('Óleo', 0);

        $rows = $this->csv('/inventory/stocks/export?format=csv&status=low');

        $this->assertSame('Produto', $rows[0][0]);
        $this->assertCount(2, $rows); // cabeçalho + Feijão
        $this->assertSame('Feijão', $rows[1][0]);
        $this->assertSame('Stock baixo', $rows[1][array_search('Estado', $rows[0])]);
        $this->assertSame('3', $rows[1][array_search('Quantidade', $rows[0])]);

        $all = $this->csv('/inventory/stocks/export?format=csv');
        $this->assertCount(4, $all); // sem filtros: tudo, mesmo havendo mais de uma página de ecrã
    }

    public function test_stock_export_is_not_limited_to_one_screen_page(): void
    {
        foreach (range(1, 45) as $i) {
            $this->stock(sprintf('Produto %02d', $i), 10);
        }

        $this->assertCount(46, $this->csv('/inventory/stocks/export?format=csv'));
    }

    public function test_stock_export_defaults_to_xlsx(): void
    {
        $this->stock('Arroz', 100);

        $response = $this->get('/inventory/stocks/export')->assertOk();

        $this->assertStringContainsString('.xlsx', $response->headers->get('Content-Disposition'));
        $this->assertStringStartsWith('PK', $response->streamedContent()); // xlsx é um zip
    }

    public function test_stock_export_never_includes_other_companies(): void
    {
        $other = Company::create(['name' => 'Outra', 'nuit' => '999999999', 'address' => 'Beira', 'phone' => '820000000']);
        $otherWarehouse = Warehouse::create(['company_id' => $other->id, 'name' => 'Deles', 'code' => 'D1', 'is_active' => true]);

        $this->stock('Meu produto', 10);
        $this->stock('Produto alheio', 10, 5, $otherWarehouse, $other);

        $content = $this->get('/inventory/stocks/export?format=csv')->streamedContent();

        $this->assertStringContainsString('Meu produto', $content);
        $this->assertStringNotContainsString('Produto alheio', $content);
    }

    public function test_inventory_report_has_one_column_per_warehouse(): void
    {
        $product = $this->stock('Arroz', 100)->product;
        ProductStock::create(['company_id' => $this->company->id, 'product_id' => $product->id, 'warehouse_id' => $this->store->id, 'quantity' => 20]);

        $rows = $this->csv('/inventory/export?format=csv');

        $this->assertSame(['Produto', 'SKU', 'Categoria', 'Central', 'Loja', 'Total'], array_slice($rows[0], 0, 6));
        $this->assertSame(['Arroz'], array_slice($rows[1], 0, 1));
        $this->assertSame(['100', '20', '120'], array_slice($rows[1], 3, 3));
    }

    public function test_exports_include_reserved_and_available_stock(): void
    {
        $arroz = $this->stock('Arroz', 10);
        ProductStock::create(['company_id' => $this->company->id, 'product_id' => $arroz->product_id, 'warehouse_id' => $this->store->id, 'quantity' => 5]);

        // 4 unidades da Central prometidas a uma transferência aprovada
        $transfer = StockTransfer::create(['company_id' => $this->company->id, 'from_warehouse_id' => $this->main->id, 'to_warehouse_id' => $this->store->id, 'status' => 'approved']);
        $transfer->items()->create(['product_id' => $arroz->product_id, 'quantity' => 4]);
        // Uma pendente não reserva
        $pending = StockTransfer::create(['company_id' => $this->company->id, 'from_warehouse_id' => $this->main->id, 'to_warehouse_id' => $this->store->id, 'status' => 'pending']);
        $pending->items()->create(['product_id' => $arroz->product_id, 'quantity' => 3]);

        $rows = $this->csv('/inventory/stocks/export?format=csv&warehouse_id='.$this->main->id);
        $header = $rows[0];
        $this->assertSame(['10', '4', '6'], [
            $rows[1][array_search('Quantidade', $header)],
            $rows[1][array_search('Reservado', $header)],
            $rows[1][array_search('Disponível', $header)],
        ]);

        // O relatório consolidado soma os armazéns: 15 em stock, 4 reservados, 11 disponíveis
        $summary = $this->csv('/inventory/export?format=csv');
        $this->assertSame(['Total', 'Reservado', 'Disponível'], array_slice($summary[0], 5, 3));
        $this->assertSame(['15', '4', '11'], array_slice($summary[1], 5, 3));
    }

    public function test_warehouse_page_paginates_and_searches_on_the_server_with_totals_for_the_whole_warehouse(): void
    {
        foreach (range(1, 20) as $i) {
            $this->stock(sprintf('Produto %02d', $i), 10);
        }
        $this->stock('Noutro armazém', 5, 5, $this->store);

        $this->get("/inventory/warehouses/{$this->main->id}")->assertInertia(fn (Assert $page) => $page
            ->has('stocks.data', 15)
            ->where('stocks.total', 20)
            ->where('stocks.last_page', 2)
            ->where('stocks.data.0.product.name', 'Produto 01') // ordenado por nome
            ->where('totals.products', 20) // os totais são do armazém, não da página
            ->where('totals.quantity', 200)
        );

        $this->get("/inventory/warehouses/{$this->main->id}?page=2")->assertInertia(fn (Assert $page) => $page->has('stocks.data', 5));

        $this->get("/inventory/warehouses/{$this->main->id}?search=Produto 07")->assertInertia(fn (Assert $page) => $page
            ->has('stocks.data', 1)
            ->where('stocks.data.0.product.name', 'Produto 07')
            ->where('totals.products', 1)
            ->where('totals.quantity', 10)
            ->where('filters.search', 'Produto 07')
        );
    }

    public function test_warehouse_page_ignores_stock_lines_of_deleted_products(): void
    {
        $this->stock('Ativo', 4);
        $this->stock('Apagado', 0)->product->delete();

        $this->get("/inventory/warehouses/{$this->main->id}")->assertInertia(fn (Assert $page) => $page
            ->has('stocks.data', 1)
            ->where('stocks.data.0.product.name', 'Ativo')
            ->where('totals.products', 1)
        );
    }

    public function test_export_requires_inventory_permission(): void
    {
        $user = User::create(['company_id' => $this->company->id, 'name' => 'Sem', 'email' => 'sem@x.test', 'password' => bcrypt('password')]);

        $this->actingAs($user)->get('/inventory/stocks/export')->assertForbidden();
        $this->actingAs($user)->get('/inventory/export')->assertForbidden();
    }
}
