<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    /**
     * Relatórios, gestão do POS e séries documentais deixam de depender de nomes de papéis
     * (Admin/owner/Manager) e passam a ter permissões próprias. Para não mudar o acesso de quem
     * já usa o sistema, os papéis do sistema recebem o que antes tinham por nome:
     *   Admin   -> todas
     *   Manager -> reports.view e pos.manage
     * Quem tinha invoice.create (ex.: Operator) deixa de poder gerir séries, de propósito.
     * O papel owner continua com acesso total. Papéis criados pelas empresas não são alterados.
     */
    private const PERMISSIONS = ['reports.view', 'pos.manage', 'series.manage'];

    private const GRANTS = [
        'Admin' => self::PERMISSIONS,
        'Manager' => ['reports.view', 'pos.manage'],
    ];

    public function up(): void
    {
        $now = now();

        foreach (self::PERMISSIONS as $name) {
            DB::table('permissions')->insertOrIgnore([
                'name' => $name, 'guard_name' => 'web', 'created_at' => $now, 'updated_at' => $now,
            ]);
        }

        foreach (self::GRANTS as $roleName => $permissions) {
            $roleId = DB::table('roles')->where('name', $roleName)->where('guard_name', 'web')->whereNull('company_id')->value('id');

            if (! $roleId) {
                continue;
            }

            foreach ($permissions as $permission) {
                $permissionId = DB::table('permissions')->where('name', $permission)->where('guard_name', 'web')->value('id');

                DB::table('role_has_permissions')->insertOrIgnore(['permission_id' => $permissionId, 'role_id' => $roleId]);
            }
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        $ids = DB::table('permissions')->whereIn('name', self::PERMISSIONS)->pluck('id');

        DB::table('role_has_permissions')->whereIn('permission_id', $ids)->delete();
        DB::table('model_has_permissions')->whereIn('permission_id', $ids)->delete();
        DB::table('permissions')->whereIn('id', $ids)->delete();

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
};
