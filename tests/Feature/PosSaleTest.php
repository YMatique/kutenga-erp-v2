<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Catalog\Branch;
use App\Models\Billing\Customer;
use App\Models\Billing\DocumentSeries;
use App\Models\Pos\PosShift;
use App\Models\Catalog\Product;
use App\Models\User;
use App\Models\Inventory\Warehouse;
use App\Services\Inventory\StockService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PosSaleTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Company $company;
    protected Branch $branch;
    protected Warehouse $warehouse;
    protected Product $product;
    protected DocumentSeries $series;
    protected PosShift $shift;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::create([
            'name' => 'Kutenga Test Company',
            'nuit' => '123456789',
            'address' => 'Maputo, Moçambique',
            'phone' => '+258840000000',
        ]);

        $this->branch = Branch::create([
            'company_id' => $this->company->id,
            'name' => 'Main Branch',
            'code' => 'BR01',
            'status' => 'active',
        ]);

        $this->user = User::create([
            'company_id' => $this->company->id,
            'branch_id' => $this->branch->id,
            'name' => 'Admin User',
            'email' => 'admin@kutenga.test',
            'password' => bcrypt('password'),
        ]);

        $this->actingAs($this->user);

        $this->warehouse = Warehouse::create([
            'company_id' => $this->company->id,
            'name' => 'Main Warehouse',
            'code' => 'MW01',
            'is_active' => true,
        ]);

        $this->product = Product::create([
            'company_id' => $this->company->id,
            'name' => 'Test Product',
            'slug' => 'test-product',
            'sku' => 'PROD-001',
            'price' => '100.00',
            'tax_rate' => '16.00',
            'track_stock' => true,
            'status' => 'active',
        ]);

        // Initialize stock
        $stockService = app(StockService::class);
        $stockService->opening($this->product, $this->warehouse, 10.00);

        $this->series = DocumentSeries::create([
            'company_id' => $this->company->id,
            'code' => 'A',
            'name' => 'Série Geral 2026',
            'year' => 2026,
            'next_number' => 1,
            'is_active' => true,
            'created_by' => $this->user->id,
        ]);

        $this->shift = PosShift::create([
            'company_id' => $this->company->id,
            'branch_id' => $this->branch->id,
            'user_id' => $this->user->id,
            'status' => 'open',
            'opened_at' => now(),
            'starting_cash' => 1000.00,
        ]);
    }

    public function test_pos_sale_processes_correctly_with_nuit()
    {
        $payload = [
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'product_name' => $this->product->name,
                    'quantity' => 2,
                    'unit_price' => 100.00,
                    'tax_rate' => 16.00,
                    'discount_percent' => 0,
                ]
            ],
            'payment_method' => 'cash',
            'amount_paid' => 232.00, // 200 + 32 tax
        ];

        $response = $this->postJson(route('pos.sales.store'), $payload);
        $response->assertStatus(200);
        $response->assertJsonPath('message', 'Venda concluída com sucesso');

        // Check customer was created with correct nuit
        $this->assertDatabaseHas('customers', [
            'company_id' => $this->company->id,
            'name' => 'Consumidor Final',
            'nuit' => '999999999',
        ]);

        // Check document was created with correct customer details
        $this->assertDatabaseHas('documents', [
            'company_id' => $this->company->id,
            'customer_nuit' => '999999999',
            'customer_name' => 'Consumidor Final',
            'document_type' => 'FR',
        ]);
    }
}
