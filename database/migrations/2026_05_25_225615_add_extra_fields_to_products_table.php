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
            $table->boolean('track_stock')->default(true)->after('type');
            $table->decimal('min_stock', 15, 2)->default(0)->after('track_stock');
            $table->decimal('weight', 10, 2)->nullable()->after('min_stock');
            $table->text('internal_notes')->nullable()->after('description');
            $table->string('image_path')->nullable()->after('internal_notes');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['track_stock', 'min_stock', 'weight', 'internal_notes', 'image_path']);
        });
    }
};
