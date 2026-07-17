<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_closings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('warehouse_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->date('reference_date')->comment('Data de referência do fecho de inventário');
            $table->string('status')->default('draft')->comment('draft | completed');
            $table->text('notes')->nullable();
            /**
             * blocks_movements: flag configurável para restringir movimentos de stock
             * com datas anteriores à data de referência deste fecho.
             * Por defeito false (apenas informativo/snapshot).
             * Pode ser ativado futuramente para controlo fiscal rigoroso.
             */
            $table->boolean('blocks_movements')->default(false);
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['company_id', 'status']);
            $table->index(['company_id', 'reference_date']);
        });

        Schema::create('inventory_closing_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('closing_id')->constrained('inventory_closings')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('warehouse_id')->nullable()->constrained()->nullOnDelete();
            $table->decimal('quantity_expected', 15, 4)->default(0)->comment('Quantidade calculada pelo sistema (snapshot)');
            $table->decimal('quantity_counted', 15, 4)->nullable()->comment('Quantidade contada manualmente');
            $table->decimal('variance', 15, 4)->virtualAs('COALESCE(quantity_counted, quantity_expected) - quantity_expected')->comment('Diferença: contado - esperado');
            $table->timestamps();

            $table->index(['closing_id', 'product_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_closing_items');
        Schema::dropIfExists('inventory_closings');
    }
};
