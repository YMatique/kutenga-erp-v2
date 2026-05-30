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
        Schema::create('stock_transfers', function (Blueprint $table) {
            $table->id();
                $table->foreignId('company_id')->constrained()->cascadeOnDelete();
    $table->foreignId('product_id')->constrained()->cascadeOnDelete();

    $table->foreignId('from_warehouse_id')->constrained('warehouses');
    $table->foreignId('to_warehouse_id')->constrained('warehouses');

    $table->decimal('quantity', 12, 2);

    $table->string('status')->default('pending'); 
    // pending | completed | cancelled

    $table->foreignId('created_by')->nullable()->constrained('users');

    $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_transfers');
    }
};
