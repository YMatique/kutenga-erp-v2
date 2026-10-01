<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->decimal('amount_tendered', 15, 2)->nullable()->after('amount');
            $table->decimal('change_given', 15, 2)->nullable()->after('amount_tendered');
        });

        Schema::table('companies', function (Blueprint $table) {
            $table->unsignedSmallInteger('thermal_paper_width')->default(80);
            $table->string('receipt_footer', 255)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn(['amount_tendered', 'change_given']);
        });

        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumn(['thermal_paper_width', 'receipt_footer']);
        });
    }
};
