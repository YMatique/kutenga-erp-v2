<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        // Catálogo de planos: os limites vivem aqui e não no código (null = ilimitado)
        Schema::create('plans', function (Blueprint $table) {
            $table->id();
            $table->string('code', 40)->unique();
            $table->string('name');
            $table->string('description')->nullable();
            $table->string('price_label')->nullable(); // texto mostrado ao cliente: "3,500 MZN / mês"
            $table->json('limits');   // {"documents_month": 50, "products": 100, ...}
            $table->json('features'); // {"pos": true, ...}
            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::table('companies', function (Blueprint $table) {
            // Identificador estável usado pela aplicação externa de gestão de subscrições
            $table->uuid('external_id')->nullable()->unique()->after('id');
            // Exceções por empresa sobre os limites do plano (mesmas chaves de plans.limits)
            $table->json('limits_override')->nullable();
        });

        // Auditoria e idempotência das alterações de subscrição
        Schema::create('subscription_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('event_id', 100)->nullable()->unique(); // Idempotency-Key enviada pela origem
            $table->string('source', 30);                           // api | admin | system
            $table->string('previous_plan', 40)->nullable();
            $table->string('plan', 40)->nullable();
            $table->string('previous_status', 20)->nullable();
            $table->string('status', 20);
            $table->timestamp('ends_at')->nullable();
            $table->json('payload')->nullable();
            $table->timestamps();

            $table->index(['company_id', 'created_at']);
        });

        $now = now();

        DB::table('plans')->insert([
            [
                'code' => 'inicial',
                'name' => 'Inicial',
                'description' => 'Para novos negócios',
                'price_label' => 'Grátis',
                'limits' => json_encode([
                    'documents_month' => 50,
                    'products' => 100,
                    'warehouses' => 1,
                    'cash_registers' => 1,
                    'users' => 1,
                ]),
                'features' => json_encode(['pos' => false]),
                'sort_order' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'code' => 'crescimento',
                'name' => 'Crescimento',
                'description' => 'Para PMEs em crescimento',
                'price_label' => '3,500 MZN / mês',
                'limits' => json_encode([
                    'documents_month' => null,
                    'products' => null,
                    'warehouses' => 5,
                    'cash_registers' => 2,
                    'users' => 5,
                ]),
                'features' => json_encode(['pos' => true]),
                'sort_order' => 2,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'code' => 'empresarial',
                'name' => 'Empresarial',
                'description' => 'Para grandes empresas',
                'price_label' => 'Sob Consulta',
                'limits' => json_encode([
                    'documents_month' => null,
                    'products' => null,
                    'warehouses' => null,
                    'cash_registers' => null,
                    'users' => null,
                ]),
                'features' => json_encode(['pos' => true]),
                'sort_order' => 3,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);

        foreach (DB::table('companies')->whereNull('external_id')->pluck('id') as $id) {
            DB::table('companies')->where('id', $id)->update(['external_id' => (string) Str::uuid()]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('subscription_events');

        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumn(['external_id', 'limits_override']);
        });

        Schema::dropIfExists('plans');
    }
};
