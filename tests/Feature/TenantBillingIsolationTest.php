<?php

namespace Tests\Feature;

use App\Models\Billing\Customer;
use App\Models\Billing\Document;
use App\Models\Billing\DocumentSeries;
use App\Models\Catalog\Branch;
use App\Models\Company;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Inertia\Testing\AssertableInertia;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

/**
 * Faturação, POS, papéis e dados da empresa nunca podem atravessar a fronteira entre empresas.
 */
class TenantBillingIsolationTest extends TestCase
{
    use RefreshDatabase;

    private const PERMISSIONS = ['invoice.create', 'invoice.view', 'invoice.cancel', 'sales.create', 'sales.view', 'catalog.view'];

    private Company $a;

    private Company $b;

    private User $adminA;

    private User $adminB;

    private DocumentSeries $seriesA;

    private DocumentSeries $seriesB;

    private Customer $customerB;

    protected function setUp(): void
    {
        parent::setUp();

        Mail::fake();

        foreach (self::PERMISSIONS as $permission) {
            Permission::findOrCreate($permission, 'web');
        }

        Role::findOrCreate('Admin', 'web')->syncPermissions(self::PERMISSIONS);
        Role::findOrCreate('Operator', 'web')->syncPermissions(['sales.view']);

        [$this->a, $this->adminA, $this->seriesA] = $this->makeTenant('A', '111111111');
        [$this->b, $this->adminB, $this->seriesB] = $this->makeTenant('B', '222222222');

        $this->customerB = new Customer;
        $this->customerB->forceFill([
            'company_id' => $this->b->id,
            'name' => 'Cliente da B',
            'nuit' => '333333333',
            'is_active' => true,
            'created_by' => $this->adminB->id,
        ])->save();
    }

    private function makeTenant(string $label, string $nuit): array
    {
        $company = Company::create([
            'name' => "Empresa $label",
            'nuit' => $nuit,
            'email' => strtolower($label).'@empresa.test',
            'address' => 'Maputo',
            'phone' => '840000000',
            'subscription_plan' => 'empresarial',
            'smtp_password' => "segredo-$label",
        ]);

        $branch = Branch::create(['company_id' => $company->id, 'name' => "Filial $label", 'code' => $label, 'status' => 'active']);

        $admin = User::create([
            'company_id' => $company->id,
            'branch_id' => $branch->id,
            'name' => "Admin $label",
            'email' => strtolower($label).'@admin.test',
            'password' => bcrypt('password'),
        ]);
        $admin->assignRole(Role::findOrCreate('Admin', 'web'));

        $series = DocumentSeries::create([
            'company_id' => $company->id,
            'code' => $label,
            'name' => "Série $label",
            'year' => (int) date('Y'),
            'next_number' => 1,
            'is_active' => true,
            'created_by' => $admin->id,
        ]);

        return [$company, $admin, $series];
    }

    private function draftOf(Company $company, DocumentSeries $series, User $author): Document
    {
        $document = new Document;
        $document->forceFill([
            'company_id' => $company->id,
            'series_id' => $series->id,
            'customer_name' => 'Cliente',
            'customer_nuit' => '999999999',
            'document_type' => 'FT',
            'status' => 'draft',
            'issue_date' => now(),
            'due_date' => now(),
            'created_by' => $author->id,
        ])->save();

        return $document;
    }

    private function invoicePayload(array $overrides = []): array
    {
        return $overrides + [
            'customer_name' => 'Cliente',
            'customer_nuit' => '999999999',
            'issue_date' => now()->toDateString(),
            'due_date' => now()->toDateString(),
            'items' => [[
                'product_name' => 'Serviço',
                'quantity' => 1,
                'unit_price' => 100,
                'tax_rate' => 16,
            ]],
        ];
    }

    // ── Documentos ──────────────────────────────────────────────────────────

    public function test_cannot_cancel_a_document_of_another_company(): void
    {
        $documentB = $this->draftOf($this->b, $this->seriesB, $this->adminB);

        $this->actingAs($this->adminA)->post("/billing/invoices/{$documentB->id}/cancel");

        $this->assertSame('draft', Document::withoutGlobalScopes()->find($documentB->id)->status);
    }

    public function test_can_cancel_a_document_of_own_company(): void
    {
        $documentA = $this->draftOf($this->a, $this->seriesA, $this->adminA);

        $this->actingAs($this->adminA)->post("/billing/invoices/{$documentA->id}/cancel");

        $this->assertSame('cancelled', Document::withoutGlobalScopes()->find($documentA->id)->status);
    }

    public function test_document_queries_only_return_own_company_rows(): void
    {
        $documentA = $this->draftOf($this->a, $this->seriesA, $this->adminA);
        $this->draftOf($this->b, $this->seriesB, $this->adminB);

        $this->actingAs($this->adminA)->get('/dashboard');

        $this->assertSame([$documentA->id], Document::pluck('id')->all());
        $this->assertSame([$this->seriesA->id], DocumentSeries::pluck('id')->all());
        $this->assertSame(0, Customer::count());
    }

    public function test_invoice_cannot_use_a_series_of_another_company(): void
    {
        $this->actingAs($this->adminA)
            ->post('/billing/invoices', $this->invoicePayload(['series_id' => $this->seriesB->id]))
            ->assertSessionHasErrors('series_id');

        $this->assertSame(0, Document::withoutGlobalScopes()->count());
        $this->assertSame(1, (int) $this->seriesB->fresh()->next_number);
    }

    public function test_invoice_can_use_a_series_of_own_company(): void
    {
        $this->actingAs($this->adminA)
            ->post('/billing/invoices', $this->invoicePayload(['series_id' => $this->seriesA->id]))
            ->assertSessionHasNoErrors();

        $this->assertSame(1, Document::withoutGlobalScopes()->where('company_id', $this->a->id)->count());
    }

    public function test_invoice_cannot_reference_a_customer_of_another_company(): void
    {
        $this->actingAs($this->adminA)
            ->post('/billing/invoices', $this->invoicePayload(['customer_id' => $this->customerB->id]))
            ->assertSessionHasErrors('customer_id');
    }

    public function test_payment_cannot_be_registered_for_a_customer_of_another_company(): void
    {
        $this->actingAs($this->adminA)
            ->post('/billing/invoices/receive-payment', [
                'customer_id' => $this->customerB->id,
                'amount' => 50,
                'payment_method' => 'cash',
            ])
            ->assertSessionHasErrors('customer_id');

        $this->assertSame(0, DB::table('payments')->count());
        $this->assertSame('0.00', (string) number_format((float) Customer::withoutGlobalScopes()->find($this->customerB->id)->balance, 2, '.', ''));
    }

    // ── Papéis e utilizadores ───────────────────────────────────────────────

    public function test_every_company_can_be_onboarded_with_the_owner_role(): void
    {
        foreach (['1', '2'] as $n) {
            $user = User::create([
                'name' => "Novo $n",
                'email' => "novo$n@test.test",
                'password' => bcrypt('password'),
            ]);

            $this->actingAs($user)->post('/onboarding', [
                'company_name' => "Nova Empresa $n",
                'nuit' => "90000000$n",
                'email' => "nova$n@empresa.test",
                'phone' => '840000000',
                'address' => 'Maputo',
                'default_currency' => 'MZN',
            ])->assertRedirect(route('dashboard'));

            $user->refresh();
            $this->assertNotNull($user->company_id);
            $this->assertTrue($user->hasRole('owner'), "O utilizador $n devia ser owner");
        }
    }

    public function test_companies_can_create_roles_with_the_same_name(): void
    {
        foreach ([$this->adminA, $this->adminB] as $admin) {
            $this->actingAs($admin)
                ->post('/settings/roles', ['name' => 'Caixa', 'permissions' => ['sales.view']])
                ->assertSessionHasNoErrors();
        }

        $this->assertSame(2, Role::where('name', 'Caixa')->count());
        $this->assertEqualsCanonicalizing(
            [$this->a->id, $this->b->id],
            Role::where('name', 'Caixa')->pluck('company_id')->all()
        );
    }

    public function test_user_cannot_be_given_a_role_of_another_company(): void
    {
        Role::create(['name' => 'Caixa B', 'company_id' => $this->b->id, 'guard_name' => 'web']);

        $this->actingAs($this->adminA)
            ->post('/settings/users', [
                'name' => 'Intruso',
                'email' => 'intruso@test.test',
                'password' => 'password123',
                'role' => 'Caixa B',
            ])
            ->assertSessionHasErrors('role');

        $this->assertNull(User::where('email', 'intruso@test.test')->first());
    }

    public function test_user_can_be_given_a_system_role_or_an_own_role(): void
    {
        $own = Role::create(['name' => 'Caixa A', 'company_id' => $this->a->id, 'guard_name' => 'web']);

        foreach (['Operator', 'Caixa A'] as $i => $roleName) {
            $this->actingAs($this->adminA)
                ->post('/settings/users', [
                    'name' => "Utilizador $i",
                    'email' => "u$i@test.test",
                    'password' => 'password123',
                    'role' => $roleName,
                ])
                ->assertSessionHasNoErrors();

            $this->assertTrue(User::where('email', "u$i@test.test")->first()->hasRole($roleName));
        }

        $this->assertSame($own->id, User::where('email', 'u1@test.test')->first()->roles->first()->id);
    }

    public function test_admin_cannot_grant_the_owner_role(): void
    {
        Role::findOrCreate('owner', 'web');

        $this->actingAs($this->adminA)
            ->post('/settings/users', [
                'name' => 'Dono',
                'email' => 'dono@test.test',
                'password' => 'password123',
                'role' => 'owner',
            ])
            ->assertForbidden();

        $this->assertNull(User::where('email', 'dono@test.test')->first());
    }

    // ── Palavra-passe SMTP ──────────────────────────────────────────────────

    public function test_smtp_password_is_stored_encrypted(): void
    {
        $raw = DB::table('companies')->where('id', $this->a->id)->value('smtp_password');

        $this->assertNotSame('segredo-A', $raw);
        $this->assertSame('segredo-A', Company::find($this->a->id)->smtp_password);
    }

    public function test_smtp_password_is_never_sent_to_the_browser(): void
    {
        // A empresa viaja em `auth.user.company` (props partilhadas) em todas as páginas
        $this->actingAs($this->adminA)->get('/settings/company')
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->where('company.has_smtp_password', true)
                ->missing('company.smtp_password')
                ->has('auth.user.company')
                ->missing('auth.user.company.smtp_password'));
    }

    public function test_blank_smtp_password_keeps_the_stored_one(): void
    {
        $this->actingAs($this->adminA)
            ->post('/settings/company', ['name' => 'Empresa A', 'smtp_host' => 'smtp.exemplo.test', 'smtp_password' => ''])
            ->assertSessionHasNoErrors();

        $this->assertSame('segredo-A', Company::find($this->a->id)->smtp_password);

        $this->actingAs($this->adminA)
            ->post('/settings/company', ['name' => 'Empresa A', 'smtp_password' => 'nova-senha'])
            ->assertSessionHasNoErrors();

        $this->assertSame('nova-senha', Company::find($this->a->id)->smtp_password);
    }
}
