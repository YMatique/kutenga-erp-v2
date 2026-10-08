<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RoleAndPermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // Create Permissions
        $permissions = [
            'sales.create',
            'sales.edit',
            'sales.view',
            'sales.cancel',
            'inventory.transfer',
            'inventory.view',
            'inventory.adjust',
            'invoice.create',
            'invoice.cancel',
            'invoice.view',
            'catalog.edit',
            'catalog.view',
            'audits.view',
            'reports.view',
            'pos.manage',
            'series.manage',
        ];

        foreach ($permissions as $permission) {
            Permission::findOrCreate($permission, 'web');
        }

        // Create Roles and assign permissions
        $admin = Role::findOrCreate('Admin', 'web');
        $admin->givePermissionTo(Permission::all());

        $manager = Role::findOrCreate('Manager', 'web');
        $manager->givePermissionTo([
            'sales.view',
            'sales.create',
            'sales.edit',
            'inventory.view',
            'invoice.view',
            'catalog.view',
            'reports.view',
            'pos.manage',
        ]);

        $operator = Role::findOrCreate('Operator', 'web');
        $operator->givePermissionTo([
            'sales.create',
            'sales.view',
            'inventory.view',
            'invoice.create',
            'invoice.view',
        ]);
    }
}
