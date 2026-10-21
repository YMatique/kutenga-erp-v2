<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    private const RECEIVE = 'inventory.receive';

    private const TRANSFER = 'inventory.transfer';

    /**
     * Receber uma transferência em trânsito passa a ter permissão própria, para o armazém de destino
     * poder receber sem poder criar, aprovar ou enviar transferências. Até aqui receber era o mesmo que
     * transferir, por isso quem tinha `inventory.transfer` (por papel ou diretamente) recebe também
     * `inventory.receive`: ninguém perde o acesso que já tinha.
     */
    public function up(): void
    {
        $now = now();

        DB::table('permissions')->insertOrIgnore([
            'name' => self::RECEIVE, 'guard_name' => 'web', 'created_at' => $now, 'updated_at' => $now,
        ]);

        $receive = DB::table('permissions')->where('name', self::RECEIVE)->where('guard_name', 'web')->value('id');
        $transfer = DB::table('permissions')->where('name', self::TRANSFER)->where('guard_name', 'web')->value('id');

        if ($transfer) {
            DB::table('role_has_permissions')->where('permission_id', $transfer)->pluck('role_id')
                ->each(fn ($roleId) => DB::table('role_has_permissions')->insertOrIgnore(['permission_id' => $receive, 'role_id' => $roleId]));

            DB::table('model_has_permissions')->where('permission_id', $transfer)->get(['model_type', 'model_id'])
                ->each(fn ($row) => DB::table('model_has_permissions')->insertOrIgnore([
                    'permission_id' => $receive, 'model_type' => $row->model_type, 'model_id' => $row->model_id,
                ]));
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        $id = DB::table('permissions')->where('name', self::RECEIVE)->where('guard_name', 'web')->value('id');

        if ($id) {
            DB::table('role_has_permissions')->where('permission_id', $id)->delete();
            DB::table('model_has_permissions')->where('permission_id', $id)->delete();
            DB::table('permissions')->where('id', $id)->delete();
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
};
