<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stock_transfers', function (Blueprint $table) {
            // Texto em vez de enum: o estado novo ("in_transit") e os futuros não pedem outra alteração à coluna
            $table->string('status', 20)->default('pending')->change();

            $table->timestamp('shipped_at')->nullable();
            $table->foreignId('shipped_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('received_at')->nullable();
            $table->foreignId('received_by')->nullable()->constrained('users')->nullOnDelete();
        });

        Schema::table('stock_transfer_items', function (Blueprint $table) {
            // O que chegou ao destino; só se preenche ao receber uma transferência que esteve em trânsito
            $table->decimal('received_quantity', 15, 3)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('stock_transfer_items', function (Blueprint $table) {
            $table->dropColumn('received_quantity');
        });

        Schema::table('stock_transfers', function (Blueprint $table) {
            $table->dropConstrainedForeignId('shipped_by');
            $table->dropConstrainedForeignId('received_by');
            $table->dropColumn(['shipped_at', 'received_at']);
        });
    }
};
