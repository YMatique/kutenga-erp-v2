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
        Schema::table('products', function (Blueprint $table) {
            $table->decimal('tax_rate', 5, 2)->default(0.00)->after('price');
            $table->boolean('tax_is_exempt')->default(false)->after('tax_rate');
            $table->string('tax_exemption_reason')->nullable()->after('tax_is_exempt');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['tax_rate', 'tax_is_exempt', 'tax_exemption_reason']);
        });
    }
};
