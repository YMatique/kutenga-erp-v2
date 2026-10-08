<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Normaliza: espaços nas pontas e strings vazias passam a NULL (vários NULL são permitidos no índice único).
        DB::table('products')->whereNotNull('barcode')->update(['barcode' => DB::raw('TRIM(barcode)')]);
        DB::table('products')->where('barcode', '')->update(['barcode' => null]);

        $duplicates = DB::table('products')
            ->select('company_id', 'barcode', DB::raw('COUNT(*) as total'))
            ->whereNotNull('barcode')
            ->groupBy('company_id', 'barcode')
            ->havingRaw('COUNT(*) > 1')
            ->get();

        if ($duplicates->isNotEmpty()) {
            $list = $duplicates->map(fn ($d) => "empresa {$d->company_id}: {$d->barcode} (x{$d->total})")->implode('; ');

            throw new RuntimeException("Existem códigos de barras duplicados por empresa; corrija-os antes de migrar: {$list}");
        }

        Schema::table('products', function (Blueprint $table) {
            $table->unique(['company_id', 'barcode'], 'products_company_barcode_unique');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropUnique('products_company_barcode_unique');
        });
    }
};
