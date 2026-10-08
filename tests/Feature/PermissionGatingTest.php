<?php

namespace Tests\Feature;

use App\Models\Billing\Document;
use App\Models\Billing\DocumentSeries;
use App\Models\Catalog\Branch;
use App\Models\Company;
use App\Models\Pos\CashRegister;
use App\Models\Pos\PosShift;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\RoleAndPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * Acesso a séries, caixas, relatórios e dashboard decide-se por permissões, nunca pelo nome do papel.
 */
class PermissionGatingTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;

    private Branch $branch;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::create([
            'name' => 'Empresa', 'nuit' => '123456789', 'address' => 'Maputo', 'phone' => '840000000',
            'subscription_plan' => 'empresarial',
        ]);

        $this->branch = Branch::create(['company_id' => $this->company->id, 'name' => 'Sede', 'code' => 'S', 'status' => 'active']);

        foreach ($this->allPermissions() as $permission) {
            Permission::findOrCreate($permission, 'web');
        }
    }

    private function allPermissions(): array
    {
        return [
            'sales.create', 'sales.view', 'invoice.create', 'invoice.view', 'invoice.cancel',
            'reports.view', 'pos.manage', 'series.manage',
        ];
    }

    /** Utilizador cujo único acesso são as permissões dadas, através de um papel da empresa com nome neutro. */
    private function userWith(array $permissions, string $email = 'u@test.test'): User
    {
        $user = User::create([
            'company_id' => $this->company->id, 'branch_id' => $this->branch->id,
            'name' => 'Utilizador', 'email' => $email, 'password' => bcrypt('password'),
        ]);

        $role = Role::create(['name' => 'Papel '.uniqid(), 'company_id' => $this->company->id, 'guard_name' => 'web']);
        $role->syncPermissions($permissions);
        $user->assignRole($role);

        return $user;
    }

    private function series(string $code = 'A'): DocumentSeries
    {
        $creator = User::first();

        return DocumentSeries::create([
            'company_id' => $this->company->id, 'code' => $code, 'name' => "Série $code", 'year' => 2026,
            'next_number' => 1, 'is_active' => true, 'created_by' => $creator->id,
        ]);
    }

    private function issuedDocument(DocumentSeries $series, User $author): Document
    {
        $document = new Document;
        $document->forceFill([
            'company_id' => $this->company->id, 'series_id' => $series->id, 'customer_name' => 'C', 'customer_nuit' => '999999999',
            'document_type' => 'FT', 'status' => 'draft', 'issue_date' => now(), 'due_date' => now(), 'created_by' => $author->id,
        ])->save();

        return $document;
    }

    // ── Séries ──────────────────────────────────────────────────────────────

    public function test_issuing_invoices_does_not_allow_managing_series(): void
    {
        $operator = $this->userWith(['invoice.create', 'invoice.view']);
        $series = $this->series();

        $this->actingAs($operator)->get('/billing/series')->assertOk();

        $payload = ['code' => 'B', 'name' => 'Nova', 'year' => 2026, 'is_active' => true];
        $this->post('/billing/series', $payload)->assertForbidden();
        $this->put("/billing/series/{$series->id}", $payload)->assertForbidden();
        $this->delete("/billing/series/{$series->id}")->assertForbidden();

        $this->assertSame(1, DocumentSeries::count());
    }

    public function test_series_manager_can_create_edit_and_delete_empty_series(): void
    {
        $manager = $this->userWith(['invoice.view', 'series.manage']);

        $this->actingAs($manager)->post('/billing/series', ['code' => 'b', 'name' => 'Nova', 'year' => 2026, 'is_active' => true])
            ->assertSessionHasNoErrors();

        $series = DocumentSeries::where('code', 'B')->firstOrFail();

        $this->put("/billing/series/{$series->id}", ['code' => 'C', 'name' => 'Renomeada', 'year' => 2027, 'is_active' => true])
            ->assertSessionHasNoErrors();
        $this->assertSame('C', $series->fresh()->code);

        $this->delete("/billing/series/{$series->id}");
        $this->assertSame(0, DocumentSeries::where('id', $series->id)->count());
    }

    public function test_series_with_issued_documents_keeps_its_code_and_year_and_cannot_be_deleted(): void
    {
        $manager = $this->userWith(['invoice.view', 'series.manage']);
        $series = $this->series('A');
        $this->issuedDocument($series, $manager);

        $this->actingAs($manager)
            ->put("/billing/series/{$series->id}", ['code' => 'Z', 'name' => 'Série A', 'year' => 2026, 'is_active' => true])
            ->assertSessionHasErrors('error');
        $this->assertSame('A', $series->fresh()->code);

        // O nome e o estado ativo podem mudar
        $this->put("/billing/series/{$series->id}", ['code' => 'A', 'name' => 'Renomeada', 'year' => 2026, 'is_active' => false])
            ->assertSessionHasNoErrors();
        $this->assertSame('Renomeada', $series->fresh()->name);

        $this->delete("/billing/series/{$series->id}")->assertSessionHasErrors('error');
        $this->assertSame(1, DocumentSeries::where('id', $series->id)->count());
    }

    // ── POS, relatórios e dashboard ─────────────────────────────────────────

    public function test_pos_management_follows_the_permission_not_the_role_name(): void
    {
        // Papel do sistema com o nome "Manager" mas sem a permissão: sem acesso
        $namesake = User::create([
            'company_id' => $this->company->id, 'branch_id' => $this->branch->id,
            'name' => 'Manager', 'email' => 'm@test.test', 'password' => bcrypt('password'),
        ]);
        $manager = Role::findOrCreate('Manager', 'web');
        $manager->syncPermissions(['sales.view']);
        $namesake->assignRole($manager);

        $this->actingAs($namesake)->get('/pos/registers')->assertForbidden();

        // Papel com outro nome mas com a permissão: acesso
        $custom = $this->userWith(['sales.view', 'pos.manage'], 'c@test.test');
        $this->actingAs($custom)->get('/pos/registers')->assertOk();
    }

    public function test_reports_and_dashboard_need_reports_view(): void
    {
        $without = $this->userWith(['sales.view'], 'a@test.test');
        $this->actingAs($without)->get('/reports')->assertForbidden();
        $this->get('/dashboard')->assertRedirect(); // sem 403: segue para a primeira área acessível

        // "Admin" sem a permissão também fica de fora: o nome do papel não conta
        $admin = User::create([
            'company_id' => $this->company->id, 'branch_id' => $this->branch->id,
            'name' => 'Admin', 'email' => 'admin@test.test', 'password' => bcrypt('password'),
        ]);
        $adminRole = Role::findOrCreate('Admin', 'web');
        $adminRole->syncPermissions(['sales.view']);
        $admin->assignRole($adminRole);
        $this->actingAs($admin)->get('/reports')->assertForbidden();
        $this->get('/dashboard')->assertRedirect();

        $with = $this->userWith(['reports.view'], 'b@test.test');
        $this->actingAs($with)->get('/reports')->assertOk();
        $this->get('/dashboard')->assertOk();
    }

    public function test_only_pos_managers_see_other_operators_shifts(): void
    {
        $operator = $this->userWith(['sales.view', 'sales.create'], 'op@test.test');
        $register = CashRegister::create(['company_id' => $this->company->id, 'branch_id' => $this->branch->id, 'name' => 'Caixa 1']);
        $shift = PosShift::create([
            'company_id' => $this->company->id, 'branch_id' => $this->branch->id, 'cash_register_id' => $register->id,
            'user_id' => $operator->id, 'status' => 'open', 'opened_at' => now(), 'starting_cash' => 0,
        ]);

        $colleague = $this->userWith(['sales.view', 'sales.create'], 'colega@test.test');
        $this->actingAs($colleague)->get("/pos/shifts/{$shift->id}")->assertForbidden();

        $this->actingAs($operator)->get("/pos/shifts/{$shift->id}")->assertOk();

        $supervisor = $this->userWith(['sales.view', 'pos.manage'], 'sup@test.test');
        $this->actingAs($supervisor)->get("/pos/shifts/{$shift->id}")->assertOk();
    }

    // ── Papéis ──────────────────────────────────────────────────────────────

    private function limitedAdmin(array $permissions): User
    {
        $user = User::create([
            'company_id' => $this->company->id, 'branch_id' => $this->branch->id,
            'name' => 'Admin limitado', 'email' => 'lim@test.test', 'password' => bcrypt('password'),
        ]);
        $role = Role::findOrCreate('Admin', 'web');
        $role->syncPermissions($permissions);
        $user->assignRole($role);

        return $user;
    }

    public function test_role_manager_cannot_grant_permissions_it_does_not_have(): void
    {
        $admin = $this->limitedAdmin(['sales.view']);

        $this->actingAs($admin)
            ->post('/settings/roles', ['name' => 'Escalada', 'permissions' => ['sales.view', 'pos.manage']])
            ->assertSessionHasErrors('permissions');
        $this->assertNull(Role::where('name', 'Escalada')->first());

        $this->post('/settings/roles', ['name' => 'Legitima', 'permissions' => ['sales.view']])->assertSessionHasNoErrors();
        $this->assertTrue(Role::where('name', 'Legitima')->exists());
    }

    public function test_editing_a_role_cannot_strip_permissions_the_editor_does_not_hold(): void
    {
        $admin = $this->limitedAdmin(['sales.view']);

        $role = Role::create(['name' => 'Gerente', 'company_id' => $this->company->id, 'guard_name' => 'web']);
        $role->syncPermissions(['sales.view', 'pos.manage']);

        $this->actingAs($admin)->put("/settings/roles/{$role->id}", ['name' => 'Gerente', 'permissions' => []])
            ->assertSessionHasNoErrors();

        // sales.view (que o editor tem) foi retirada; pos.manage (que não tem) manteve-se
        $this->assertEquals(['pos.manage'], $role->fresh()->permissions->pluck('name')->all());
    }

    // ── Seeder e migração ───────────────────────────────────────────────────

    public function test_seeder_gives_the_new_permissions_to_the_right_system_roles(): void
    {
        $this->seed(RoleAndPermissionSeeder::class);

        $has = fn (string $role, string $permission) => Role::findByName($role, 'web')->hasPermissionTo($permission);

        foreach (['reports.view', 'pos.manage', 'series.manage'] as $permission) {
            $this->assertTrue($has('Admin', $permission), "Admin devia ter $permission");
            $this->assertFalse($has('Operator', $permission), "Operator não devia ter $permission");
        }

        $this->assertTrue($has('Manager', 'reports.view'));
        $this->assertTrue($has('Manager', 'pos.manage'));
        $this->assertFalse($has('Manager', 'series.manage'));
    }

    public function test_migration_keeps_existing_installations_working(): void
    {
        // Instalação anterior: papéis do sistema sem as permissões novas
        Role::findOrCreate('Admin', 'web');
        Role::findOrCreate('Manager', 'web');
        Role::findOrCreate('Operator', 'web');
        $custom = Role::create(['name' => 'Da empresa', 'company_id' => $this->company->id, 'guard_name' => 'web']);

        $migration = require database_path('migrations/2026_10_08_110000_add_reports_pos_and_series_permissions.php');
        $migration->up();
        $migration->up(); // idempotente

        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $this->assertEqualsCanonicalizing(
            ['reports.view', 'pos.manage', 'series.manage'],
            Role::findByName('Admin', 'web')->permissions->pluck('name')->all()
        );
        $this->assertEqualsCanonicalizing(['reports.view', 'pos.manage'], Role::findByName('Manager', 'web')->permissions->pluck('name')->all());
        $this->assertCount(0, Role::findByName('Operator', 'web')->permissions);
        $this->assertCount(0, $custom->fresh()->permissions);
    }
}
