<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Os nomes de papel passam a ser únicos por empresa (e entre os papéis do sistema),
     * em vez de únicos em toda a aplicação: duas empresas podem ter o mesmo papel.
     */
    public function up(): void
    {
        $table = config('permission.table_names.roles');

        Schema::table($table, function (Blueprint $table) {
            $table->dropUnique(['name', 'guard_name']);
            $table->unique(['company_id', 'name', 'guard_name']);
        });
    }

    public function down(): void
    {
        $table = config('permission.table_names.roles');

        Schema::table($table, function (Blueprint $table) {
            $table->dropUnique(['company_id', 'name', 'guard_name']);
            $table->unique(['name', 'guard_name']);
        });
    }
};
