<?php

namespace Tests\Feature;

use App\Models\Billing\Customer;
use App\Models\Billing\Document;
use App\Models\Billing\DocumentSeries;
use App\Models\Catalog\Branch;
use App\Models\Company;
use App\Models\Inventory\Warehouse;
use App\Models\Role;
use App\Models\User;
use App\Services\Billing\BillingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

/**
 * Limite mensal de documentos do plano: conta os documentos emitidos (não os rascunhos),
 * deixa emitir exatamente o número contratado e nunca trava o recibo de um pagamento.
 */
class DocumentLimitTest extends TestCase
{
    use RefreshDatabase;

    private const LIMIT = 3;

    private Company $company;

    private User $admin;

    private BillingService $billing;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::create([
            'name' => 'Empresa', 'nuit' => '123456789', 'address' => 'Maputo', 'phone' => '840000000',
            'subscription_plan' => 'empresarial',
            'limits_override' => ['documents_month' => self::LIMIT],
        ]);

        $branch = Branch::create(['company_id' => $this->company->id, 'name' => 'Sede', 'code' => 'S', 'status' => 'active']);

        $this->admin = User::create([
            'company_id' => $this->company->id, 'branch_id' => $branch->id,
            'name' => 'Admin', 'email' => 'admin@test.test', 'password' => bcrypt('password'),
        ]);

        foreach (['invoice.create', 'invoice.view'] as $permission) {
            Permission::findOrCreate($permission, 'web');
        }
        $role = Role::findOrCreate('Admin', 'web');
        $role->syncPermissions(['invoice.create', 'invoice.view']);
        $this->admin->assignRole($role);

        DocumentSeries::create([
            'company_id' => $this->company->id, 'code' => 'A', 'name' => 'Série', 'year' => (int) date('Y'),
            'next_number' => 1, 'is_active' => true, 'created_by' => $this->admin->id,
        ]);

        // O cancelamento procura um armazém para reverter movimentos de stock
        Warehouse::create(['company_id' => $this->company->id, 'name' => 'Armazém', 'code' => 'W1', 'is_active' => true]);

        $this->actingAs($this->admin);
        $this->billing = app(BillingService::class);
    }

    private function draft(): Document
    {
        return $this->billing->createDraft([
            'customer_name' => 'Cliente',
            'customer_nuit' => '999999999',
            'document_type' => 'FT',
            'items' => [['product_name' => 'Serviço', 'quantity' => 1, 'unit_price' => 100, 'tax_rate' => 16]],
        ], $this->company->id);
    }

    private function emit(): Document
    {
        return $this->billing->confirmAndEmit($this->draft()->id);
    }

    public function test_exactly_the_contracted_number_of_documents_can_be_emitted(): void
    {
        for ($i = 0; $i < self::LIMIT; $i++) {
            $this->emit();
        }

        $this->assertSame(self::LIMIT, $this->company->getCurrentMonthDocumentsCount());

        $this->expectExceptionMessage('Limite de faturamento atingido');
        $this->emit();
    }

    public function test_drafts_do_not_count_towards_the_limit(): void
    {
        for ($i = 0; $i < self::LIMIT + 2; $i++) {
            $this->draft();
        }

        $this->assertSame(0, $this->company->getCurrentMonthDocumentsCount());

        for ($i = 0; $i < self::LIMIT; $i++) {
            $this->emit();
        }

        $this->assertSame(self::LIMIT, $this->company->getCurrentMonthDocumentsCount());
    }

    public function test_cancelled_documents_still_count_because_they_used_a_number(): void
    {
        $first = $this->emit();
        $this->emit();
        $this->emit();

        $this->billing->cancel($first->id);

        $this->assertSame(self::LIMIT, $this->company->getCurrentMonthDocumentsCount());
        $this->expectExceptionMessage('Limite de faturamento atingido');
        $this->emit();
    }

    public function test_payment_receipt_is_never_blocked_by_the_limit(): void
    {
        $customer = new Customer;
        $customer->forceFill([
            'company_id' => $this->company->id, 'name' => 'Cliente', 'nuit' => '555555555',
            'is_active' => true, 'created_by' => $this->admin->id,
        ])->save();

        for ($i = 0; $i < self::LIMIT; $i++) {
            $this->emit();
        }

        $payment = $this->billing->registerPayment($customer->id, 50, 'cash');

        $this->assertStringContainsString('Recibo:', $payment->fresh()->reference);
        // O recibo foi emitido mas não consome o limite
        $this->assertSame(self::LIMIT, $this->company->getCurrentMonthDocumentsCount());
    }

    public function test_creating_documents_is_blocked_once_the_limit_is_reached(): void
    {
        $payload = [
            'customer_name' => 'Cliente',
            'customer_nuit' => '999999999',
            'issue_date' => now()->toDateString(),
            'due_date' => now()->toDateString(),
            'items' => [['product_name' => 'Serviço', 'quantity' => 1, 'unit_price' => 100, 'tax_rate' => 16]],
        ];

        // Com 2 emitidos há margem para criar mais um
        $this->emit();
        $this->emit();
        $this->post('/billing/invoices', $payload)->assertSessionHasNoErrors();

        // Com 3 emitidos já não se criam novos
        $this->emit();
        $this->post('/billing/invoices', $payload)->assertSessionHasErrors('subscription');
    }

    public function test_usage_shown_to_the_user_matches_the_enforced_count(): void
    {
        $this->emit();
        $this->draft();

        $this->assertSame(1, $this->company->usage('documents_month'));
    }
}
