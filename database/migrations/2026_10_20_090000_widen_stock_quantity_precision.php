<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * As quantidades dos documentos têm 3 casas decimais (document_items), mas o stock guardava 2,
 * pelo que uma venda de 0,125 kg era arredondada no saldo e no movimento e os dois deixavam de bater.
 * Alarga-se a escala (sem perder dados) para o stock acompanhar os documentos.
 */
return new class extends Migration
{
    public function up(): void
    {
        $this->quantities(15, 3);
    }

    public function down(): void
    {
        $this->quantities(12, 2);
    }

    private function quantities(int $total, int $scale): void
    {
        Schema::table('stock_movements', function (Blueprint $table) use ($total, $scale) {
            $table->decimal('quantity', $total, $scale)->change();
        });

        Schema::table('product_stocks', function (Blueprint $table) use ($total, $scale) {
            $table->decimal('quantity', $total, $scale)->default(0)->change();
        });

        Schema::table('stock_transfer_items', function (Blueprint $table) use ($total, $scale) {
            $table->decimal('quantity', $total, $scale)->change();
        });

        Schema::table('stock_adjustment_items', function (Blueprint $table) use ($total, $scale) {
            $table->decimal('old_quantity', $total, $scale)->change();
            $table->decimal('new_quantity', $total, $scale)->change();
            $table->decimal('difference', $total, $scale)->change();
        });

        Schema::table('products', function (Blueprint $table) use ($scale) {
            // O stock mínimo é uma quantidade e tem de aceitar a mesma precisão que o stock
            $table->decimal('min_stock', 15, $scale)->default(0)->change();
        });
    }
};
