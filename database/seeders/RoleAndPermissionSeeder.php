<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class RoleAndPermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

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
        ];

        foreach ($permissions as $permission) {
            \Spatie\Permission\Models\Permission::create(['name' => $permission]);
        }

        // Create Roles and assign permissions
        $admin = \Spatie\Permission\Models\Role::create(['name' => 'Admin']);
        $admin->givePermissionTo(\Spatie\Permission\Models\Permission::all());

        $manager = \Spatie\Permission\Models\Role::create(['name' => 'Manager']);
        $manager->givePermissionTo([
            'sales.view',
            'sales.create',
            'sales.edit',
            'inventory.view',
            'invoice.view',
            'catalog.view',
        ]);

        $operator = \Spatie\Permission\Models\Role::create(['name' => 'Operator']);
        $operator->givePermissionTo([
            'sales.create',
            'sales.view',
            'inventory.view',
            'invoice.create',
            'invoice.view',
        ]);
    }
}
