<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page()
    {
        $response = $this->get(route('dashboard'));
        $response->assertRedirect(route('login'));
    }

    public function test_users_with_reports_access_can_visit_the_dashboard()
    {
        Permission::findOrCreate('reports.view', 'web');
        $user = User::factory()->create();
        $user->givePermissionTo('reports.view');

        $this->actingAs($user)->get(route('dashboard'))->assertOk();
    }

    public function test_company_owner_can_visit_the_dashboard()
    {
        $user = User::factory()->create();
        $user->assignRole(Role::findOrCreate('owner', 'web'));

        $this->actingAs($user)->get(route('dashboard'))->assertOk();
    }

    public function test_users_without_reports_access_are_sent_to_their_first_available_area()
    {
        foreach (['sales.view' => '/billing/quotes', 'inventory.view' => '/inventory', 'catalog.view' => '/products'] as $permission => $url) {
            Permission::findOrCreate($permission, 'web');
            $user = User::factory()->create();
            $user->givePermissionTo($permission);

            $this->actingAs($user)->get(route('dashboard'))->assertRedirect($url);
        }
    }

    public function test_users_without_any_area_end_up_on_their_profile_instead_of_an_error()
    {
        $user = User::factory()->create();

        $this->actingAs($user)->get(route('dashboard'))->assertRedirect('/settings/profile');
    }

    public function test_pos_is_not_a_landing_page_when_the_plan_has_no_pos()
    {
        Permission::findOrCreate('sales.create', 'web');
        $user = User::factory()->create(); // plano inicial: sem POS
        $user->givePermissionTo('sales.create');

        $this->actingAs($user)->get(route('dashboard'))->assertRedirect('/settings/profile');
    }
}
