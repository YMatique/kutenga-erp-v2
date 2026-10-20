<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('units', function (Blueprint $table) {
            // Verdadeiro por defeito: quem já tem unidades não vê o comportamento mudar. As unidades
            // contáveis (unidade, caixa, dúzia...) passam a "só inteiros" quando o utilizador o decidir.
            $table->boolean('allow_decimals')->default(true)->after('short_name');
        });
    }

    public function down(): void
    {
        Schema::table('units', function (Blueprint $table) {
            $table->dropColumn('allow_decimals');
        });
    }
};
