<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * - documents.pos_sale_token: chave de idempotência da venda (reenviar a mesma venda não duplica).
     * - pos_shifts.open_register_id / open_user_id: preenchidos só enquanto o turno está aberto,
     *   com índice único. Garante na base de dados "um turno aberto por caixa" e "por operador",
     *   que a verificação em PHP sozinha não assegura com pedidos simultâneos.
     */
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->string('pos_sale_token', 64)->nullable()->after('pos_shift_id');
            $table->unique(['company_id', 'pos_sale_token'], 'documents_company_sale_token_unique');
        });

        Schema::table('pos_shifts', function (Blueprint $table) {
            $table->unsignedBigInteger('open_register_id')->nullable()->unique()->after('status');
            $table->unsignedBigInteger('open_user_id')->nullable()->unique()->after('open_register_id');
        });

        // Turnos já abertos: o mais antigo de cada caixa/operador fica com o "bloqueio".
        // Duplicados pré-existentes (estado inválido) ficam sem bloqueio em vez de impedir a migração.
        $claimed = ['register' => [], 'user' => []];

        DB::table('pos_shifts')->where('status', 'open')->whereNull('deleted_at')->orderBy('id')->get()
            ->each(function ($shift) use (&$claimed) {
                $update = [];

                if ($shift->cash_register_id && ! isset($claimed['register'][$shift->cash_register_id])) {
                    $claimed['register'][$shift->cash_register_id] = true;
                    $update['open_register_id'] = $shift->cash_register_id;
                }

                if (! isset($claimed['user'][$shift->user_id])) {
                    $claimed['user'][$shift->user_id] = true;
                    $update['open_user_id'] = $shift->user_id;
                }

                if ($update) {
                    DB::table('pos_shifts')->where('id', $shift->id)->update($update);
                }
            });
    }

    public function down(): void
    {
        Schema::table('pos_shifts', function (Blueprint $table) {
            $table->dropUnique(['open_register_id']);
            $table->dropUnique(['open_user_id']);
            $table->dropColumn(['open_register_id', 'open_user_id']);
        });

        Schema::table('documents', function (Blueprint $table) {
            $table->dropUnique('documents_company_sale_token_unique');
            $table->dropColumn('pos_sale_token');
        });
    }
};
