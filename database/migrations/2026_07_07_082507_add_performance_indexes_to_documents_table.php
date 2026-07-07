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
        Schema::table('documents', function (Blueprint $table) {
            // Índice composto para extratos de conta corrente rápida do cliente
            $table->index(['company_id', 'customer_id'], 'docs_company_customer_idx');
            
            // Índice composto para filtros rápidos de listagem (por tipo de documento e estado)
            $table->index(['company_id', 'document_type', 'status'], 'docs_company_type_status_idx');
            
            // Índice composto para relatórios e pesquisas baseadas em data de emissão
            $table->index(['company_id', 'issue_date'], 'docs_company_issue_date_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropIndex('docs_company_customer_idx');
            $table->dropIndex('docs_company_type_status_idx');
            $table->dropIndex('docs_company_issue_date_idx');
        });
    }
};
