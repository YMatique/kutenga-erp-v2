<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stock_transfer_items', function (Blueprint $table) {
            // O que se fez à diferença quando chegou menos do que o enviado: "loss" (perda em trânsito)
            // ou "return" (devolvida à origem). Vazio quando chegou tudo, ou antes de haver receção.
            $table->string('shortage_action', 10)->nullable()->after('received_quantity');
        });
    }

    public function down(): void
    {
        Schema::table('stock_transfer_items', function (Blueprint $table) {
            $table->dropColumn('shortage_action');
        });
    }
};
