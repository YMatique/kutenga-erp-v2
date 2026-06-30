<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Customer;
use App\Models\Document;
use App\Models\DocumentSeries;
use App\Models\Invoice;
use App\Models\Product;
use App\Models\Quote;
use App\Models\CreditNote;
use App\Models\Receipt;
use App\Models\User;
use App\Models\Warehouse;
use App\Models\ProductStock;
use App\Services\Billing\BillingService;
use App\Services\Inventory\StockService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Tests\TestCase;

class BillingStiTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Company $company;
    protected Warehouse $warehouse;
    protected Customer $customer;
    protected Product $product;
    protected DocumentSeries $series;
    protected BillingService $billingService;
    protected StockService $stockService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::create([
            'name' => 'Kutenga Test Company',
            'nuit' => '123456789',
        ]);

        $this->user = User::create([
            'company_id' => $this->company->id,
            'name' => 'Admin User',
            'email' => 'admin@kutenga.test',
            'password' => bcrypt('password'),
        ]);

        Auth::login($this->user);

        $this->warehouse = Warehouse::create([
            'company_id' => $this->company->id,
            'name' => 'Main Warehouse',
            'code' => 'MW01',
            'is_active' => true,
        ]);

        $this->customer = Customer::create([
            'company_id' => $this->company->id,
            'name' => 'Test Customer',
            'nuit' => '987654321',
            'balance' => 0.00,
            'credit_limit' => 10000.00,
            'is_active' => true,
        ]);

        $this->product = Product::create([
            'company_id' => $this->company->id,
            'name' => 'Test Product',
            'sku' => 'PROD-001',
            'price' => '100.00',
            'tax_rate' => '16.00',
            'track_stock' => true,
            'status' => 'active',
        ]);

        // Initialize stock
        $this->stockService = app(StockService::class);
        $this->stockService->opening($this->product, $this->warehouse, 10.00);

        $this->series = DocumentSeries::create([
            'company_id' => $this->company->id,
            'code' => 'A',
            'name' => 'Série Geral 2026',
            'year' => 2026,
            'next_number' => 1,
            'is_active' => true,
            'created_by' => $this->user->id,
        ]);

        $this->billingService = app(BillingService::class);
    }

    public function test_document_subclassing_by_type()
    {
        // 1. Create a draft invoice (FT)
        $invoiceDraft = $this->billingService->createDraft([
            'customer_id' => $this->customer->id,
            'customer_name' => $this->customer->name,
            'customer_nuit' => $this->customer->nuit,
            'document_type' => 'FT',
            'series_id' => $this->series->id,
            'issue_date' => '2026-06-30',
            'due_date' => '2026-07-30',
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'product_name' => $this->product->name,
                    'product_sku' => $this->product->sku,
                    'quantity' => 2,
                    'unit_price' => 100.00,
                    'tax_rate' => 16.00,
                ]
            ]
        ], $this->company->id);

        $this->assertInstanceOf(Invoice::class, $invoiceDraft);
        $this->assertEquals(232.00, $invoiceDraft->grand_total); // 2 * 100 * 1.16 = 232.00

        // 2. Create a draft quote (CT)
        $quoteDraft = $this->billingService->createDraft([
            'customer_id' => $this->customer->id,
            'customer_name' => $this->customer->name,
            'customer_nuit' => $this->customer->nuit,
            'document_type' => 'CT',
            'series_id' => $this->series->id,
            'issue_date' => '2026-06-30',
            'due_date' => '2026-07-30',
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'product_name' => $this->product->name,
                    'product_sku' => $this->product->sku,
                    'quantity' => 1,
                    'unit_price' => 100.00,
                    'tax_rate' => 16.00,
                ]
            ]
        ], $this->company->id);

        $this->assertInstanceOf(Quote::class, $quoteDraft);
    }

    public function test_invoice_emission_reduces_stock_and_increases_customer_balance()
    {
        $invoice = $this->billingService->createDraft([
            'customer_id' => $this->customer->id,
            'customer_name' => $this->customer->name,
            'customer_nuit' => $this->customer->nuit,
            'document_type' => 'FT',
            'series_id' => $this->series->id,
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'product_name' => $this->product->name,
                    'quantity' => 3,
                    'unit_price' => 100.00,
                    'tax_rate' => 16.00,
                ]
            ]
        ], $this->company->id);

        $confirmedInvoice = $this->billingService->confirmAndEmit($invoice->id, $this->warehouse);

        // Check customer balance increased by invoice grand total (3 * 100 * 1.16 = 348.00)
        $this->customer->refresh();
        $this->assertEquals(348.00, $this->customer->balance);

        // Check stock reduced from 10 to 7
        $currentStock = $this->stockService->getStock($this->product, $this->warehouse);
        $this->assertEquals(7.00, $currentStock);
    }

    public function test_quote_emission_has_no_stock_or_financial_impact()
    {
        $quote = $this->billingService->createDraft([
            'customer_id' => $this->customer->id,
            'customer_name' => $this->customer->name,
            'customer_nuit' => $this->customer->nuit,
            'document_type' => 'CT',
            'series_id' => $this->series->id,
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'product_name' => $this->product->name,
                    'quantity' => 5,
                    'unit_price' => 100.00,
                    'tax_rate' => 16.00,
                ]
            ]
        ], $this->company->id);

        $confirmedQuote = $this->billingService->confirmAndEmit($quote->id, $this->warehouse);

        // Balance should remain 0
        $this->customer->refresh();
        $this->assertEquals(0.00, $this->customer->balance);

        // Stock should remain 10
        $currentStock = $this->stockService->getStock($this->product, $this->warehouse);
        $this->assertEquals(10.00, $currentStock);
    }

    public function test_credit_note_emission_increases_stock_and_decreases_customer_balance()
    {
        // Setup existing balance by making customer balance positive first
        $this->customer->update(['balance' => 500.00]);

        $creditNote = $this->billingService->createDraft([
            'customer_id' => $this->customer->id,
            'customer_name' => $this->customer->name,
            'customer_nuit' => $this->customer->nuit,
            'document_type' => 'NC',
            'series_id' => $this->series->id,
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'product_name' => $this->product->name,
                    'quantity' => 2,
                    'unit_price' => 100.00,
                    'tax_rate' => 16.00,
                ]
            ]
        ], $this->company->id);

        $this->assertInstanceOf(CreditNote::class, $creditNote);

        $confirmedCreditNote = $this->billingService->confirmAndEmit($creditNote->id, $this->warehouse);

        // Balance should decrease by 232.00 (500 - 232 = 268)
        $this->customer->refresh();
        $this->assertEquals(268.00, $this->customer->balance);

        // Stock should increase from 10 to 12
        $currentStock = $this->stockService->getStock($this->product, $this->warehouse);
        $this->assertEquals(12.00, $currentStock);
    }
}
