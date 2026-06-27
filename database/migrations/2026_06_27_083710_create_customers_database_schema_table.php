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
        // 1. Tabela Principal de Clientes (com suporte a limite de crédito e controlo fiscal)
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->index(); // Multi-tenant
            $table->string('name');
            $table->string('nuit', 15)->index(); // NUIT de Moçambique (9 dígitos)
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->text('address')->nullable();

            // Lógica de Conta Corrente e Risco
            $table->decimal('credit_limit', 15, 2)->default(0.00);
            $table->decimal('balance', 15, 2)->default(0.00); // Saldo devedor corrente

            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('updated_by')->nullable()->constrained('users');
            $table->timestamps();
            $table->softDeletes(); // Eliminação lógica para integridade histórica

            $table->unique(['company_id', 'nuit']); // NUIT único por empresa
        });

        // 2. Tabela de Contactos Adicionais (Múltiplos Contactos por Cliente)
        Schema::create('customer_contacts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained('customers')->onDelete('cascade');
            $table->string('name');
            $table->string('role')->nullable(); // Ex: Diretor Financeiro, Compras
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('updated_by')->nullable()->constrained('users');
            $table->timestamps();
        });

        // 3. Tabela de Endereços Adicionais (Entrega/Faturação Diferenciados)
        Schema::create('customer_addresses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained('customers')->onDelete('cascade');
            $table->string('type', 20)->default('delivery'); // billing (faturação), delivery (entrega)
            $table->text('address');
            $table->string('city', 100)->default('Maputo');
            $table->string('province', 100)->default('Maputo');
            $table->string('country', 100)->default('Moçambique');
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('updated_by')->nullable()->constrained('users');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customer_addresses');
        Schema::dropIfExists('customer_contacts');
        Schema::dropIfExists('customers');
    }
};
