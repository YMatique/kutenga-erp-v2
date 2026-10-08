<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Plan;
use App\Models\SubscriptionEvent;
use App\Models\SystemNotification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class SubscriptionApiTest extends TestCase
{
    use RefreshDatabase;

    private const SECRET = 'segredo-de-teste';

    protected function setUp(): void
    {
        parent::setUp();

        config(['subscription.api.secret' => self::SECRET]);
    }

    private function company(array $attributes = []): Company
    {
        return Company::create($attributes + ['name' => 'Empresa Teste', 'nuit' => '123456789', 'address' => 'Maputo', 'phone' => '840000000']);
    }

    /** Pedido assinado como a aplicação externa o faria. */
    private function signed(string $method, string $uri, array $payload = [], array $headers = [], ?int $timestamp = null, ?string $secret = null)
    {
        $body = $payload ? json_encode($payload) : '';
        $timestamp = (string) ($timestamp ?? time());
        $signature = hash_hmac('sha256', $timestamp.'.'.$body, $secret ?? self::SECRET);

        return $this->call($method, $uri, [], [], [], $this->transformHeadersToServerVars($headers + [
            'X-Kutenga-Timestamp' => $timestamp,
            'X-Kutenga-Signature' => $signature,
            'Content-Type' => 'application/json',
        ]), $body);
    }

    public function test_plans_are_seeded_with_the_agreed_limits(): void
    {
        $this->assertEquals(1, Plan::where('code', 'inicial')->first()->limits['cash_registers']);
        $this->assertEquals(1, Plan::where('code', 'inicial')->first()->limits['users']);
        $this->assertEquals(2, Plan::where('code', 'crescimento')->first()->limits['cash_registers']);
        $this->assertEquals(5, Plan::where('code', 'crescimento')->first()->limits['users']);
        $this->assertNull(Plan::where('code', 'empresarial')->first()->limits['users']);
    }

    public function test_company_gets_an_external_id_and_default_plan(): void
    {
        $company = $this->company();

        $this->assertNotEmpty($company->external_id);
        $this->assertEquals(50, $company->limit('documents_month'));
        $this->assertFalse($company->can('pos'));
    }

    public function test_missing_limit_key_in_plan_is_denied_and_override_wins(): void
    {
        $company = $this->company(['subscription_plan' => 'crescimento']);
        $company->plan()->update(['limits' => ['users' => 5]]); // sem 'warehouses'

        $company = $company->fresh();
        $this->assertSame(0, $company->limit('warehouses')); // negado por omissão

        $company->update(['limits_override' => ['warehouses' => 9]]);
        $this->assertSame(9, $company->fresh()->limit('warehouses'));
    }

    public function test_api_rejects_missing_or_invalid_signature(): void
    {
        $company = $this->company();
        $uri = "/api/internal/companies/{$company->external_id}/subscription";

        $this->getJson($uri)->assertStatus(401);
        $this->signed('GET', $uri, [], [], null, 'segredo-errado')->assertStatus(401);
        $this->signed('GET', $uri, [], [], time() - 3600)->assertStatus(401); // fora da tolerância
        $this->signed('GET', $uri)->assertOk()->assertJsonPath('plan', 'inicial');
    }

    public function test_api_is_disabled_without_secret(): void
    {
        config(['subscription.api.secret' => null]);

        $this->getJson('/api/internal/companies/x/subscription')->assertStatus(503);
    }

    public function test_api_changes_plan_and_records_event(): void
    {
        $company = $this->company();
        $uri = "/api/internal/companies/{$company->external_id}/subscription";

        $this->signed('PUT', $uri, [
            'plan' => 'crescimento',
            'status' => 'active',
            'ends_at' => now()->addMonth()->toIso8601String(),
        ])->assertOk()
            ->assertJsonPath('plan', 'crescimento')
            ->assertJsonPath('state', 'active')
            ->assertJsonPath('limits.cash_registers', 2)
            ->assertJsonPath('features.pos', true);

        $this->assertEquals('crescimento', $company->fresh()->subscription_plan);
        $this->assertDatabaseHas('subscription_events', [
            'company_id' => $company->id, 'source' => 'api', 'previous_plan' => 'inicial', 'plan' => 'crescimento',
        ]);
        $this->assertDatabaseHas('system_notifications', ['company_id' => $company->id, 'type' => 'subscription']);
    }

    public function test_api_is_idempotent_by_idempotency_key(): void
    {
        $company = $this->company();
        $uri = "/api/internal/companies/{$company->external_id}/subscription";
        $headers = ['Idempotency-Key' => 'evt-123'];

        $this->signed('PUT', $uri, ['plan' => 'crescimento'], $headers)->assertOk()->assertJsonPath('replayed', false);

        // Entretanto o plano mudou noutro lado; reenviar o evento antigo não o reaplica
        $company->update(['subscription_plan' => 'empresarial']);

        $this->signed('PUT', $uri, ['plan' => 'crescimento'], $headers)->assertOk()->assertJsonPath('replayed', true);

        $this->assertEquals('empresarial', $company->fresh()->subscription_plan);
        $this->assertEquals(1, SubscriptionEvent::where('event_id', 'evt-123')->count());
    }

    public function test_api_validates_plan_status_and_override_keys(): void
    {
        $company = $this->company();
        $uri = "/api/internal/companies/{$company->external_id}/subscription";

        $this->signed('PUT', $uri, ['plan' => 'inexistente'])->assertStatus(422);
        $this->signed('PUT', $uri, ['status' => 'banana'])->assertStatus(422);
        $this->signed('PUT', $uri, ['limits_override' => ['chave_inventada' => 3]])->assertStatus(422);
        $this->signed('PUT', $uri, ['limits_override' => ['users' => -1]])->assertStatus(422);
        $this->signed('PUT', $uri, ['limits_override' => ['users' => 8]])->assertOk()->assertJsonPath('limits.users', 8);
    }

    public function test_unknown_company_returns_404(): void
    {
        $this->signed('GET', '/api/internal/companies/00000000-0000-0000-0000-000000000000/subscription')->assertStatus(404);
    }

    public function test_subscription_states_active_grace_expired_and_suspended(): void
    {
        $company = $this->company(['subscription_plan' => 'crescimento', 'subscription_ends_at' => now()->addDay()]);
        $this->assertEquals('active', $company->subscriptionState());

        $company->update(['subscription_ends_at' => now()->subDays(3)]);
        $this->assertEquals('grace', $company->fresh()->subscriptionState());
        $this->assertTrue($company->fresh()->isSubscriptionReadOnly());
        $this->assertFalse($company->fresh()->isSubscriptionExpired());

        $company->update(['subscription_ends_at' => now()->subDays(30)]);
        $this->assertEquals('expired', $company->fresh()->subscriptionState());

        $company->update(['subscription_ends_at' => null, 'subscription_status' => 'suspended']);
        $this->assertEquals('suspended', $company->fresh()->subscriptionState());
        $this->assertTrue($company->fresh()->isSubscriptionExpired());
    }

    public function test_grace_period_blocks_writes_but_allows_reads(): void
    {
        $company = $this->company(['subscription_plan' => 'crescimento', 'subscription_ends_at' => now()->subDays(2)]);
        $user = User::create([
            'company_id' => $company->id, 'name' => 'Op', 'email' => 'op@x.test', 'password' => bcrypt('password'),
        ]);

        $this->actingAs($user)
            ->postJson('/billing/invoices', [])
            ->assertStatus(403)
            ->assertJsonPath('error', fn ($m) => str_contains($m, 'só pode consultar'));
    }

    public function test_user_limit_of_the_plan_is_enforced(): void
    {
        $company = $this->company(['subscription_plan' => 'inicial']); // 1 utilizador
        $admin = User::create([
            'company_id' => $company->id, 'name' => 'Admin', 'email' => 'a@x.test', 'password' => bcrypt('password'),
        ]);

        $this->actingAs($admin)
            ->postJson('/settings/users', ['name' => 'Outro', 'email' => 'o@x.test', 'password' => 'password123', 'role' => 'Admin'])
            ->assertStatus(403)
            ->assertJsonPath('error', fn ($m) => str_contains($m, 'Limite do plano'));
    }

    public function test_check_command_expires_after_grace_and_warns_before_end(): void
    {
        $expiring = $this->company(['subscription_plan' => 'crescimento', 'subscription_ends_at' => now()->addDays(3), 'nuit' => '111111111']);
        $overdue = $this->company(['subscription_plan' => 'crescimento', 'subscription_ends_at' => now()->subDays(20), 'nuit' => '222222222']);

        $this->artisan('subscription:check')->assertSuccessful();

        $this->assertDatabaseHas('system_notifications', ['company_id' => $expiring->id, 'type' => 'subscription_warning']);
        $this->assertEquals('expired', $overdue->fresh()->subscription_status);

        // Segunda execução no mesmo dia não duplica o aviso
        $this->artisan('subscription:check')->assertSuccessful();
        $this->assertEquals(1, SystemNotification::where('company_id', $expiring->id)->where('type', 'subscription_warning')->count());
    }

    public function test_company_cannot_change_its_own_plan_but_super_admin_can(): void
    {
        $company = $this->company(['subscription_plan' => 'inicial']);
        $user = User::create([
            'company_id' => $company->id, 'name' => 'Admin', 'email' => 'a@x.test', 'password' => bcrypt('password'),
        ]);

        $user->assignRole(Role::findOrCreate('Admin', 'web'));

        // Admin da empresa passa a rota, mas o controller recusa quem não é super admin
        $this->actingAs($user)->post('/settings/subscription/upgrade', ['plan' => 'empresarial'])->assertForbidden();
        $this->assertEquals('inicial', $company->fresh()->subscription_plan);

        $user->forceFill(['is_super_admin' => true])->save();
        $this->actingAs($user->fresh())->post('/settings/subscription/upgrade', ['plan' => 'crescimento'])->assertRedirect();
        $this->assertEquals('crescimento', $company->fresh()->subscription_plan);
    }

    public function test_super_admin_can_edit_plan_limits(): void
    {
        $company = $this->company();
        $admin = User::create([
            'company_id' => $company->id, 'name' => 'Root', 'email' => 'r@x.test', 'password' => bcrypt('password'), 'is_super_admin' => true,
        ]);
        $plan = Plan::where('code', 'crescimento')->first();

        $this->actingAs($admin)->put("/system/plans/{$plan->id}", [
            'name' => 'Crescimento',
            'is_active' => true,
            'limits' => ['documents_month' => '', 'products' => '', 'warehouses' => '5', 'cash_registers' => '4', 'users' => '8'],
            'features' => ['pos' => true],
        ])->assertRedirect();

        $plan->refresh();
        $this->assertSame(4, $plan->limits['cash_registers']);
        $this->assertNull($plan->limits['documents_month']);
    }
}
