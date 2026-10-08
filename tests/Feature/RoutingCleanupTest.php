<?php

namespace Tests\Feature;

use App\Models\Billing\Document;
use App\Models\Billing\DocumentSeries;
use App\Models\Company;
use App\Models\Inventory\Warehouse;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

/** Rotas sem duplicados: armazéns só se alteram com inventory.adjust e os links de documentos existem. */
class RoutingCleanupTest extends TestCase
{
    use RefreshDatabase;

    private function userWith(string ...$permissions): User
    {
        foreach ($permissions as $permission) {
            Permission::findOrCreate($permission, 'web');
        }

        // Plano sem limites, para que só a permissão decida o resultado
        $user = User::factory()->for(Company::factory(['subscription_plan' => 'empresarial']))->create();
        $user->givePermissionTo($permissions);

        return $user;
    }

    private function warehouse(User $user): Warehouse
    {
        return Warehouse::create(['company_id' => $user->company_id, 'name' => 'Central', 'code' => 'W1', 'is_active' => true]);
    }

    public function test_viewing_inventory_does_not_allow_changing_warehouses(): void
    {
        $viewer = $this->userWith('inventory.view');
        $warehouse = $this->warehouse($viewer);

        $this->actingAs($viewer)->get('/inventory/warehouses')->assertOk();
        $this->get("/inventory/warehouses/{$warehouse->id}")->assertOk();

        $payload = ['name' => 'Alterado', 'is_active' => true];
        $this->post('/inventory/warehouses', $payload)->assertForbidden();
        $this->put("/inventory/warehouses/{$warehouse->id}", $payload)->assertForbidden();
        $this->delete("/inventory/warehouses/{$warehouse->id}")->assertForbidden();

        $this->assertSame('Central', $warehouse->fresh()->name);
    }

    public function test_inventory_adjusters_can_manage_warehouses_and_the_create_page_opens(): void
    {
        $manager = $this->userWith('inventory.view', 'inventory.adjust');
        $warehouse = $this->warehouse($manager);

        $this->actingAs($manager)->get('/inventory/warehouses/create')->assertOk();
        $this->put("/inventory/warehouses/{$warehouse->id}", ['name' => 'Renomeado', 'is_active' => true]);
        $this->assertSame('Renomeado', $warehouse->fresh()->name);
    }

    public function test_each_document_type_links_to_its_own_module(): void
    {
        $expected = [
            'FT' => 'invoices', 'FR' => 'receipts', 'CT' => 'quotes',
            'NC' => 'credit-notes', 'ND' => 'debit-notes', 'RC' => 'payment-receipts',
        ];

        foreach ($expected as $type => $section) {
            $document = new Document;
            $document->id = 7;
            $document->document_type = $type;

            $this->assertSame("/billing/{$section}/7", $document->showUrl());
        }
    }

    public function test_every_link_generated_for_documents_resolves_to_a_real_page(): void
    {
        $user = $this->userWith('invoice.view', 'invoice.create', 'sales.view');

        $series = DocumentSeries::create([
            'company_id' => $user->company_id, 'code' => 'A', 'name' => 'S', 'year' => 2026,
            'next_number' => 1, 'is_active' => true, 'created_by' => $user->id,
        ]);

        $document = new Document;
        $document->forceFill([
            'company_id' => $user->company_id, 'series_id' => $series->id, 'customer_name' => 'C', 'customer_nuit' => '999999999',
            'document_type' => 'FT', 'status' => 'draft', 'issue_date' => now(), 'due_date' => now(), 'created_by' => $user->id,
        ])->save();

        $this->actingAs($user)->get($document->showUrl())->assertOk();
        $this->get('/billing/invoices/create')->assertOk();
    }

    public function test_removed_document_pages_stay_removed(): void
    {
        $user = $this->userWith('invoice.view');

        $this->actingAs($user)->get('/billing/documents')->assertNotFound();
        $this->get('/billing/documents/1')->assertNotFound();
    }

    public function test_profile_routes_come_from_a_single_definition(): void
    {
        $routes = collect(app('router')->getRoutes()->getRoutes())
            ->filter(fn ($route) => $route->uri() === 'settings/profile' && in_array('GET', $route->methods()));

        $this->assertCount(1, $routes);
    }
}
