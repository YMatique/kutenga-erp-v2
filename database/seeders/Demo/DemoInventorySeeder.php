<?php

namespace Database\Seeders\Demo;

use App\Models\Catalog\Product;
use App\Models\Company;
use App\Models\Inventory\ProductStock;
use App\Models\Inventory\StockMovement;
use App\Models\Inventory\Warehouse;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Armazéns e stock inicial (movimento "opening" + cache em product_stocks).
 *
 * Grava directamente em vez de usar o StockService para não disparar
 * notificações nem emails de stock baixo durante o seed.
 * Corre `php artisan app:check-low-stock` se quiseres gerar os alertas.
 */
class DemoInventorySeeder extends Seeder
{
    /** Multiplicador do stock mínimo, por armazém (pela ordem definida abaixo). */
    private const STOCK_FACTORS = [4, 2, 1.5];

    /**
     * Casos para exercitar alertas: sku => quantidades por armazém.
     * Sem entrada para um armazém = sem stock inicial nesse armazém.
     */
    private const STOCK_OVERRIDES = [
        'ESC-0004' => [2],      // Toner: total (2) abaixo do mínimo (3) → stock baixo
        'ELE-0004' => [],       // Telemóvel: sem stock → esgotado
        'BEB-0001' => [30, 10], // Coca-Cola: total (40) abaixo do mínimo (60) → stock baixo
    ];

    public static function warehouses(): array
    {
        return [
            DemoCompanySeeder::NUIT_KUTENGA => [
                ['code' => 'ARM-01', 'name' => 'Armazém Central', 'address' => 'Zona Industrial da Machava, Maputo', 'description' => 'Armazém principal de reposição.', 'is_default' => true],
                ['code' => 'LJ-01', 'name' => 'Loja Maputo', 'address' => 'Av. Julius Nyerere, 1200, Maputo', 'description' => 'Stock da loja de atendimento ao público.', 'is_default' => false],
                ['code' => 'ARM-02', 'name' => 'Armazém Beira', 'address' => 'Rua Correia de Brito, 45, Beira', 'description' => 'Armazém da filial da Beira.', 'is_default' => false],
            ],
            // O plano "inicial" permite apenas 1 armazém.
            DemoCompanySeeder::NUIT_NOVA_ESPERANCA => [
                ['code' => 'ARM-01', 'name' => 'Armazém Principal', 'address' => 'Rua da Resistência, 88, Matola', 'description' => null, 'is_default' => true],
            ],
        ];
    }

    public function run(): void
    {
        foreach (DemoCompanySeeder::demoCompanies() as $company) {
            $this->seedCompany($company);
        }
    }

    private function seedCompany(Company $company): void
    {
        $warehouses = [];
        foreach (self::warehouses()[$company->nuit] as $data) {
            $warehouse = Warehouse::withTrashed()->firstOrNew(['company_id' => $company->id, 'code' => $data['code']]);
            $warehouse->fill($data + ['is_active' => true])->save();

            if ($warehouse->trashed()) {
                $warehouse->restore();
            }

            $warehouses[] = $warehouse;
        }

        $createdBy = User::where('company_id', $company->id)->role('owner')->value('id');

        $products = Product::where('company_id', $company->id)->where('track_stock', true)->get();

        foreach ($products as $product) {
            foreach ($warehouses as $index => $warehouse) {
                $quantity = $this->openingQuantity($product, $index);

                if ($quantity <= 0 || $this->hasOpening($product, $warehouse)) {
                    continue;
                }

                StockMovement::create([
                    'company_id' => $company->id,
                    'product_id' => $product->id,
                    'warehouse_id' => $warehouse->id,
                    'type' => 'opening',
                    'quantity' => $quantity,
                    'source_type' => 'opening_stock',
                    'notes' => 'Stock inicial (dados de demonstração)',
                    'created_by' => $createdBy,
                ]);

                ProductStock::updateOrCreate(
                    ['company_id' => $company->id, 'product_id' => $product->id, 'warehouse_id' => $warehouse->id],
                    ['quantity' => $quantity]
                );
            }
        }
    }

    private function openingQuantity(Product $product, int $warehouseIndex): float
    {
        if (array_key_exists($product->sku, self::STOCK_OVERRIDES)) {
            return (float) (self::STOCK_OVERRIDES[$product->sku][$warehouseIndex] ?? 0);
        }

        return (float) round($product->min_stock * (self::STOCK_FACTORS[$warehouseIndex] ?? 1));
    }

    private function hasOpening(Product $product, Warehouse $warehouse): bool
    {
        return StockMovement::where('product_id', $product->id)
            ->where('warehouse_id', $warehouse->id)
            ->where('type', 'opening')
            ->exists();
    }
}
