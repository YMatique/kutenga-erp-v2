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
        Schema::create('document_series', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->index();
            $table->string('code', 10); // Ex: "A", "B"
            $table->string('name'); // Ex: "Série Geral 2026"
            $table->year('year'); // Ex: 2026
            $table->integer('next_number')->default(1); // Próximo número sequencial
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('updated_by')->nullable()->constrained('users');
            $table->unique(['company_id', 'code', 'year']);
        });

        // Tabela Unificada de Documentos (documents)
        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->index();
            $table->foreignId('branch_id')->nullable()->index(); // Filial / Loja
            $table->foreignId('series_id')->constrained('document_series');

            // Relacionamento Operacional (pode ser nulo para clientes ocasionais)
            $table->foreignId('customer_id')->nullable()->constrained('customers');

            // SNAPSHOT HISTÓRICO DO CLIENTE (Imutável após emissão)
            $table->string('customer_name');
            $table->string('customer_nuit', 15); // NUIT de Moçambique (9 dígitos)
            $table->string('customer_phone')->nullable();
            $table->string('customer_email')->nullable();
            $table->text('customer_address')->nullable();

            // Metadados do Documento
            $table->string('document_type', 5); // FT (Fatura), FR (Fatura-Recibo), CT (Cotação), NC, ND, GR
            $table->string('document_number', 40)->nullable()->unique(); // Ex: "FT A/2026/00001"
            $table->integer('sequence_number')->nullable(); // Guardar a parte inteira para auditoria sequencial
            $table->string('status', 20)->default('draft'); // draft, confirmed, paid, partial, cancelled, void

            // Datas
            $table->date('issue_date');
            $table->date('due_date');

            // Lógica Financeira e Totais
            $table->decimal('subtotal', 15, 2)->default(0.00);
            $table->decimal('tax_total', 15, 2)->default(0.00);
            $table->decimal('discount_total', 15, 2)->default(0.00);
            $table->decimal('grand_total', 15, 2)->default(0.00);

            // Configurações Cambiais
            $table->foreignId('currency_id')->nullable(); // MZN, USD, ZAR
            $table->decimal('exchange_rate', 15, 6)->default(1.000000);

            // Estado de Liquidação
            $table->string('payment_status', 20)->default('unpaid'); // unpaid, partial, paid
            $table->string('source_module', 50)->default('billing'); // Rastreio de origem (ex: POS, E-commerce)

            $table->text('notes')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('updated_by')->nullable()->constrained('users');
            $table->foreignId('cancelled_by')->nullable()->constrained('users');
            $table->timestamps();
            $table->softDeletes(); // Cancelamento lógico preservando o registo para auditoria da AT
        });

        // Itens de Linha do Documento (document_items)
        Schema::create('document_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_id')->constrained('documents')->onDelete('cascade');
            $table->foreignId('product_id')->nullable()->constrained('products'); // Nulo se for item livre/personalizado

            // SNAPSHOT HISTÓRICO DO PRODUTO (Garante integridade mesmo se o produto for alterado ou excluído)
            $table->string('product_name');
            $table->string('product_sku', 50)->nullable();
            $table->string('product_barcode', 50)->nullable();
            $table->text('description')->nullable(); // Observações adicionais do item na fatura

            // Valores Fiscais e Quantidade
            $table->decimal('quantity', 12, 3);
            $table->decimal('unit_price', 15, 2);
            $table->decimal('tax_rate', 5, 2)->default(16.00); // IVA Moçambique padrão (16%) ou isenções (0%)
            $table->decimal('discount_percent', 5, 2)->default(0.00); // Desconto comercial individual em %
            $table->decimal('total', 15, 2); // Quantidade * Preço - Desconto + Imposto correspondente

            $table->timestamps();
        });

        // Transações de Pagamento (payments)
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->index();
            $table->foreignId('customer_id')->nullable()->constrained('customers');
            $table->string('payment_method', 30); // Cash, M-Pesa, Emola, Bank, Card
            $table->decimal('amount', 15, 2);
            $table->date('payment_date');
            $table->string('reference')->nullable(); // NIB, ID de Transação M-Pesa, etc.
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('updated_by')->nullable()->constrained('users');

            $table->timestamps();
        });

        // Alocações de Pagamento (Ligação N:M entre faturas e recibos de pagamento)
        Schema::create('payment_allocations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payment_id')->constrained('payments')->onDelete('cascade');
            $table->foreignId('document_id')->constrained('documents')->onDelete('cascade');
            $table->decimal('amount_allocated', 15, 2);
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
        Schema::dropIfExists('payment_allocations');
        Schema::dropIfExists('payments');
        Schema::dropIfExists('document_items');
        Schema::dropIfExists('documents');
        Schema::dropIfExists('document_series');
    }
};
