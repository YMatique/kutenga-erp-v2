<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** O super admin da plataforma não pertence a nenhuma empresa e nunca passa pelo onboarding. */
class SuperAdminAccessTest extends TestCase
{
    use RefreshDatabase;

    private function superAdmin(): User
    {
        return User::factory()->withoutCompany()->create(['is_super_admin' => true]);
    }

    public function test_super_admin_reaches_the_platform_pages_without_onboarding(): void
    {
        $this->actingAs($this->superAdmin())
            ->get('/system/plans')
            ->assertOk();
    }

    public function test_regular_user_without_company_still_goes_to_onboarding(): void
    {
        $this->actingAs(User::factory()->withoutCompany()->create())
            ->get('/system/plans')
            ->assertRedirect(route('onboarding.index'));
    }

    public function test_company_user_with_incomplete_company_goes_to_onboarding(): void
    {
        $this->actingAs(User::factory()->withIncompleteCompany()->create())
            ->get('/settings/profile')
            ->assertRedirect(route('onboarding.index'));
    }
}
