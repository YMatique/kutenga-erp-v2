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
        Schema::table('companies', function (Blueprint $table) {
            $table->string('default_currency', 3)->default('MZN')->after('default_tax_rate');
            $table->integer('default_due_days')->default(30)->after('default_currency');
            $table->string('invoice_prefix', 10)->default('FT')->after('default_due_days');
            $table->string('quote_prefix', 10)->default('CT')->after('invoice_prefix');
            $table->string('receipt_prefix', 10)->default('FR')->after('quote_prefix');
            $table->json('bank_accounts')->nullable()->after('receipt_prefix');
            
            $table->unique('nuit');
            $table->unique('email');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->dropUnique(['nuit']);
            $table->dropUnique(['email']);
            
            $table->dropColumn([
                'default_currency',
                'default_due_days',
                'invoice_prefix',
                'quote_prefix',
                'receipt_prefix',
                'bank_accounts'
            ]);
        });
    }
};
