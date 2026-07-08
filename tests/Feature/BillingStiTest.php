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
            'slug' => 'test-product',
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

    public function test_invoice_payment_and_cancellation_status_transitions()
    {
        // 1. Criar fatura rascunho e confirmar
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
                    'quantity' => 1,
                    'unit_price' => 100.00,
                    'tax_rate' => 16.00,
                ]
            ]
        ], $this->company->id);

        $confirmed = $this->billingService->confirmAndEmit($invoice->id, $this->warehouse);
        $this->assertEquals('confirmed', $confirmed->status);
        $this->assertEquals('unpaid', $confirmed->payment_status);

        // 2. Registar pagamento parcial
        $paymentPartial = $this->billingService->registerPayment(
            $this->customer->id,
            50.00,
            'Cash',
            'REF-123'
        );
        
        $confirmed->refresh();
        $this->assertEquals('partial', $confirmed->status);
        $this->assertEquals('partial', $confirmed->payment_status);

        // 3. Registar pagamento restante (Total é 116.00. 116.00 - 50.00 = 66.00)
        $paymentFull = $this->billingService->registerPayment(
            $this->customer->id,
            66.00,
            'Cash',
            'REF-124'
        );

        $confirmed->refresh();
        $this->assertEquals('paid', $confirmed->status);
        $this->assertEquals('paid', $confirmed->payment_status);

        // 4. Testar cancelamento de documento confirmado/pago
        $cancelled = $this->billingService->cancel($confirmed->id);
        $this->assertEquals('cancelled', $cancelled->status);

        // 5. Testar que alteração de campos protegidos (ex: grand_total) em documento confirmado joga exceção
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage("Regra de Imutabilidade Fiscal");
        $cancelled->grand_total = 200.00;
        $cancelled->save();
    }

    public function test_check_document_status_command()
    {
        \Illuminate\Support\Facades\Mail::fake();

        // 1. Criar Fatura que venceu ontem (vencida) com email do cliente
        $invoice = $this->billingService->createDraft([
            'customer_id' => $this->customer->id,
            'customer_name' => $this->customer->name,
            'customer_nuit' => $this->customer->nuit,
            'customer_email' => 'client@example.com',
            'document_type' => 'FT',
            'series_id' => $this->series->id,
            'issue_date' => now()->subDays(5)->toDateString(),
            'due_date' => now()->subDays(1)->toDateString(), // vencido
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'product_name' => $this->product->name,
                    'quantity' => 1,
                    'unit_price' => 100.00,
                    'tax_rate' => 16.00,
                ]
            ]
        ], $this->company->id);
        $invoiceConfirmed = $this->billingService->confirmAndEmit($invoice->id, $this->warehouse);
        $this->assertEquals('confirmed', $invoiceConfirmed->status);

        // 2. Criar Cotação que venceu ontem (vencida)
        $quote = $this->billingService->createDraft([
            'customer_id' => $this->customer->id,
            'customer_name' => $this->customer->name,
            'customer_nuit' => $this->customer->nuit,
            'document_type' => 'CT',
            'series_id' => $this->series->id,
            'issue_date' => now()->subDays(5)->toDateString(),
            'due_date' => now()->subDays(1)->toDateString(), // vencido
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'product_name' => $this->product->name,
                    'quantity' => 1,
                    'unit_price' => 100.00,
                    'tax_rate' => 16.00,
                ]
            ]
        ], $this->company->id);
        $quoteConfirmed = $this->billingService->confirmAndEmit($quote->id, $this->warehouse);
        $this->assertEquals('confirmed', $quoteConfirmed->status);

        // 3. Rodar o comando do agendador
        $this->artisan('app:check-document-status')
            ->assertExitCode(0);

        // 4. Verificar se ambos foram atualizados para 'overdue' (Em Atraso)
        $invoiceConfirmed->refresh();
        $quoteConfirmed->refresh();

        $this->assertEquals('overdue', $invoiceConfirmed->status);
        $this->assertEquals('overdue', $quoteConfirmed->status);

        // 5. Verificar se as notificações no sistema foram geradas
        $this->assertDatabaseHas('system_notifications', [
            'company_id' => $this->company->id,
            'type' => 'invoice_overdue',
            'title' => 'Fatura em Atraso',
        ]);
        $this->assertDatabaseHas('system_notifications', [
            'company_id' => $this->company->id,
            'type' => 'quote_expired',
            'title' => 'Cotação Expirada',
        ]);

        // 6. Verificar se o e-mail foi enfileirado para o cliente
        \Illuminate\Support\Facades\Mail::assertQueued(\App\Mail\InvoiceOverdueMail::class, function ($mail) use ($invoiceConfirmed) {
            return $mail->hasTo('client@example.com') && $mail->document->id === $invoiceConfirmed->id;
        });
    }
}
