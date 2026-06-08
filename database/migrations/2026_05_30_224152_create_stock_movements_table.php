<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();  
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
             $table->foreignId('warehouse_id')->constrained()->restrictOnDelete();

            $table->enum('type', ['in','out','adjustment','opening']);
            //Sales -> StockMovement (out)
            //Purchase -> StockMovement (in)
            //Transference -> StockMovement (in + out)
            //Adjust -> StockMovement (adjustment)

            $table->decimal('quantity', 12, 2);

            //origem
            $table->string('source_type')->nullable(); //StockTransfer, StockAdjustment
            $table->unsignedBigInteger('source_id')->nullable();

            // $table->string('reference')->nullable();
            $table->text('notes')->nullable();

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();

            $table->index(['product_id','warehouse_id', 'type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_movements');
    }
};
