<?php

namespace Tests\Feature;

use App\Models\Catalog\Product;
use App\Models\Company;
use App\Models\Inventory\StockTransfer;
use App\Models\Inventory\Warehouse;
use App\Models\Role;
use App\Models\User;
use App\Services\Inventory\StockService;
use App\Services\Inventory\StockTransferService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/** Receber uma transferência tem permissão própria: quem recebe no destino não tem de poder enviar. */
class TransferReceivePermissionTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;

    private StockTransfer $transfer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::create(['name' => 'Empresa', 'nuit' => '123456789', 'address' => 'Maputo', 'phone' => '840000000']);
        $origin = Warehouse::create(['company_id' => $this->company->id, 'name' => 'Maputo', 'code' => 'MP', 'is_active' => true]);
        $destination = Warehouse::create(['company_id' => $this->company->id, 'name' => 'Beira', 'code' => 'BR', 'is_active' => true]);
        $pen = Product::create(['company_id' => $this->company->id, 'name' => 'Caneta', 'slug' => 'caneta', 'sku' => 'CAN', 'price' => 10, 'track_stock' => true, 'status' => 'active']);

        app(StockService::class)->in($pen, $origin, 25);

        $this->transfer = StockTransfer::create(['company_id' => $this->company->id, 'from_warehouse_id' => $origin->id, 'to_warehouse_id' => $destination->id, 'status' => 'approved']);
        $this->transfer->items()->create(['product_id' => $pen->id, 'quantity' => 10]);
        app(StockTransferService::class)->ship($this->transfer);
    }

    private function userWith(array $permissions): User
    {
        foreach ($permissions as $permission) {
            Permission::findOrCreate($permission, 'web');
        }

        $user = User::create(['company_id' => $this->company->id, 'name' => 'U', 'email' => uniqid().'@x.test', 'password' => bcrypt('password')]);
        $user->givePermissionTo($permissions);

        return $user;
    }

    public function test_receiving_needs_its_own_permission(): void
    {
        // Pode transferir, mas não receber
        $this->actingAs($this->userWith(['inventory.view', 'inventory.transfer']))
            ->post("/inventory/transfers/{$this->transfer->id}/receive")->assertForbidden();
        $this->assertSame('in_transit', $this->transfer->fresh()->status);

        // Só recebe: chega
        $this->actingAs($this->userWith(['inventory.view', 'inventory.receive']))
            ->post("/inventory/transfers/{$this->transfer->id}/receive")->assertSessionHas('success');
        $this->assertSame('completed', $this->transfer->fresh()->status);
    }

    public function test_who_only_receives_cannot_create_approve_ship_or_cancel(): void
    {
        $receiver = $this->actingAs($this->userWith(['inventory.view', 'inventory.receive']));

        $this->post("/inventory/transfers/{$this->transfer->id}/ship")->assertForbidden();
        $this->post("/inventory/transfers/{$this->transfer->id}/approve")->assertForbidden();
        $this->post("/inventory/transfers/{$this->transfer->id}/cancel")->assertForbidden();
        $this->post('/inventory/transfers', [])->assertForbidden();
        $this->assertSame('in_transit', $this->transfer->fresh()->status);
    }

    public function test_the_screens_only_offer_what_the_user_can_do(): void
    {
        $cases = [
            [['inventory.view'], false, false],
            [['inventory.view', 'inventory.transfer'], true, false],
            [['inventory.view', 'inventory.receive'], false, true],
            [['inventory.view', 'inventory.transfer', 'inventory.receive'], true, true],
        ];

        foreach ($cases as [$permissions, $transfer, $receive]) {
            $this->actingAs($this->userWith($permissions));

            foreach (['/inventory/transfers', "/inventory/transfers/{$this->transfer->id}"] as $url) {
                $this->get($url)->assertInertia(fn (Assert $page) => $page
                    ->where('can.transfer', $transfer)
                    ->where('can.receive', $receive)
                );
            }
        }
    }

    public function test_the_migration_gives_the_new_permission_to_who_could_already_transfer(): void
    {
        // Como estava antes da migração: sem a permissão nova, e uns com a antiga por papel e outros diretamente
        DB::table('permissions')->where('name', 'inventory.receive')->delete();
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $role = Role::create(['name' => 'Logística', 'guard_name' => 'web', 'company_id' => $this->company->id]);
        $role->givePermissionTo(Permission::findOrCreate('inventory.transfer', 'web'));
        $viaRole = User::create(['company_id' => $this->company->id, 'name' => 'R', 'email' => 'r@x.test', 'password' => bcrypt('password')]);
        $viaRole->assignRole($role);
        $direct = $this->userWith(['inventory.transfer']);
        $onlyView = $this->userWith(['inventory.view']);

        $migration = require database_path('migrations/2026_10_24_090000_add_inventory_receive_permission.php');
        $migration->up();
        $migration->up(); // repetir não duplica nem falha

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $this->assertTrue($viaRole->fresh()->can('inventory.receive'));
        $this->assertTrue($direct->fresh()->can('inventory.receive'));
        $this->assertFalse($onlyView->fresh()->can('inventory.receive'));
        $this->assertSame(1, DB::table('permissions')->where('name', 'inventory.receive')->count());
    }
}
