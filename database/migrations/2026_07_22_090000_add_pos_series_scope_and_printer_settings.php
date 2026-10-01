<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Séries do POS são independentes das de faturação (billing | pos)
        Schema::table('document_series', function (Blueprint $table) {
            $table->string('scope', 20)->default('billing')->after('name')->index();
        });

        // O BillingService não gravava a origem: vendas feitas num turno do POS ficam como 'pos'
        DB::table('documents')->whereNotNull('pos_shift_id')->update(['source_module' => 'pos']);

        // Configuração de impressão por caixa (cada caixa tem a sua impressora física)
        Schema::table('cash_registers', function (Blueprint $table) {
            $table->string('printer_driver', 20)->default('browser')->after('series_id'); // browser | qz | network
            $table->string('printer_name')->nullable()->after('printer_driver');          // QZ Tray: nome da impressora
            $table->string('printer_host')->nullable()->after('printer_name');            // network: IP/host
            $table->unsignedSmallInteger('printer_port')->default(9100)->after('printer_host');
            $table->unsignedSmallInteger('paper_width')->nullable()->after('printer_port'); // 58 | 80; null = definição da empresa
            $table->boolean('open_drawer')->default(false)->after('paper_width');
            $table->boolean('auto_print')->default(false)->after('open_drawer');
        });
    }

    public function down(): void
    {
        Schema::table('cash_registers', function (Blueprint $table) {
            $table->dropColumn([
                'printer_driver', 'printer_name', 'printer_host', 'printer_port',
                'paper_width', 'open_drawer', 'auto_print',
            ]);
        });

        Schema::table('document_series', function (Blueprint $table) {
            $table->dropColumn('scope');
        });
    }
};
