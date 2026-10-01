<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cash_registers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->constrained()->cascadeOnDelete();
            $table->foreignId('warehouse_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('series_id')->nullable()->constrained('document_series')->nullOnDelete();
            $table->string('name');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['company_id', 'is_active']);
        });

        Schema::table('pos_shifts', function (Blueprint $table) {
            $table->foreignId('cash_register_id')->nullable()->after('branch_id')
                ->constrained('cash_registers')->nullOnDelete();
            $table->decimal('expected_cash', 15, 2)->nullable()->after('ending_cash');
            $table->decimal('cash_difference', 15, 2)->nullable()->after('expected_cash');
            $table->json('payment_totals')->nullable()->after('cash_difference');
        });
    }

    public function down(): void
    {
        Schema::table('pos_shifts', function (Blueprint $table) {
            $table->dropConstrainedForeignId('cash_register_id');
            $table->dropColumn(['expected_cash', 'cash_difference', 'payment_totals']);
        });

        Schema::dropIfExists('cash_registers');
    }
};
