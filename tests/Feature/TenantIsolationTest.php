<?php

namespace Tests\Feature;

use App\Models\Catalog\Branch;
use App\Models\Company;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** Cada utilizador pertence a uma única empresa: o contexto nunca pode apontar para outra. */
class TenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    private Company $a;

    private Company $b;

    private Branch $branchA1;

    private Branch $branchA2;

    private Branch $branchB;

    private User $userA;

    protected function setUp(): void
    {
        parent::setUp();

        $make = fn (string $name, string $nuit) => Company::create([
            'name' => $name, 'nuit' => $nuit, 'address' => 'Maputo', 'phone' => '840000000',
        ]);

        $this->a = $make('Empresa A', '111111111');
        $this->b = $make('Empresa B', '222222222');

        $branch = fn (Company $c, string $code) => Branch::create(['company_id' => $c->id, 'name' => $code, 'code' => $code, 'status' => 'active']);

        $this->branchA1 = $branch($this->a, 'A1');
        $this->branchA2 = $branch($this->a, 'A2');
        $this->branchB = $branch($this->b, 'B1');

        $this->userA = User::create([
            'company_id' => $this->a->id, 'branch_id' => $this->branchA1->id,
            'name' => 'Utilizador A', 'email' => 'a@x.test', 'password' => bcrypt('password'),
        ]);
    }

    public function test_company_header_is_ignored(): void
    {
        $this->actingAs($this->userA)
            ->withHeader('X-Company-Id', (string) $this->b->id)
            ->get('/dashboard');

        $this->assertSame($this->a->id, session('current_company_id'));
    }

    public function test_company_in_session_cannot_be_forged(): void
    {
        $this->actingAs($this->userA)
            ->withSession(['current_company_id' => $this->b->id, 'current_branch_id' => $this->branchB->id])
            ->get('/dashboard');

        $this->assertSame($this->a->id, session('current_company_id'));
        // A filial de outra empresa também é descartada e volta à do utilizador
        $this->assertSame($this->branchA1->id, session('current_branch_id'));
    }

    public function test_user_can_switch_to_a_branch_of_own_company(): void
    {
        $this->actingAs($this->userA)
            ->post('/context/switch', ['branch_id' => $this->branchA2->id])
            ->assertRedirect();

        $this->assertSame($this->branchA2->id, session('current_branch_id'));

        $this->get('/dashboard');
        $this->assertSame($this->branchA2->id, session('current_branch_id'));
    }

    public function test_user_cannot_switch_to_a_branch_of_another_company(): void
    {
        $this->actingAs($this->userA)
            ->post('/context/switch', ['branch_id' => $this->branchB->id])
            ->assertForbidden();
    }

    public function test_company_id_sent_to_switch_is_ignored(): void
    {
        $this->actingAs($this->userA)
            ->post('/context/switch', ['company_id' => $this->b->id, 'branch_id' => $this->branchA2->id])
            ->assertRedirect();

        $this->assertSame($this->a->id, session('current_company_id'));
    }

    public function test_there_is_no_company_creation_screen(): void
    {
        $this->actingAs($this->userA)->get('/companies')->assertNotFound();
        $this->actingAs($this->userA)->get('/companies/create')->assertNotFound();
        $this->actingAs($this->userA)->post('/companies', ['name' => 'Nova'])->assertNotFound();
    }
}
