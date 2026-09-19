<?php

namespace Database\Seeders\Demo;

use App\Models\Catalog\Brand;
use App\Models\Catalog\Category;
use App\Models\Catalog\Product;
use App\Models\Catalog\Unit;
use App\Models\Company;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Unidades, categorias (com subcategorias), marcas e produtos/serviços.
 *
 * A empresa com plano "inicial" recebe apenas os primeiros produtos da lista.
 */
class DemoCatalogSeeder extends Seeder
{
    /** Quantos produtos recebe cada empresa (null = todos). */
    private const PRODUCT_LIMIT = [
        DemoCompanySeeder::NUIT_NOVA_ESPERANCA => 12,
    ];

    private const EXEMPT_REASON = 'Bem de primeira necessidade';

    public static function units(): array
    {
        return [
            'UN' => 'Unidade',
            'CX' => 'Caixa',
            'PCT' => 'Pacote',
            'DZ' => 'Dúzia',
            'KG' => 'Quilograma',
            'L' => 'Litro',
            'M' => 'Metro',
            'H' => 'Hora',
        ];
    }

    /** Categoria => subcategorias. */
    public static function categories(): array
    {
        return [
            'Alimentação' => ['Mercearia', 'Bebidas', 'Laticínios e Ovos'],
            'Higiene e Limpeza' => ['Higiene Pessoal', 'Limpeza da Casa'],
            'Material de Escritório' => ['Papelaria', 'Consumíveis'],
            'Electrónica' => ['Informática', 'Telefonia'],
            'Serviços' => [],
        ];
    }

    public static function brands(): array
    {
        return ['Coca-Cola', '2M', 'Laurentina', 'Nestlé', 'Omo', 'Colgate', 'Bic', 'HP', 'Samsung', 'Kutenga'];
    }

    /**
     * name, sku, categoria, unidade, marca, tipo, preço, custo, IVA %, stock mínimo, isento
     * Os produtos sem stock (serviços) não movimentam inventário.
     */
    public static function products(): array
    {
        return [
            // Mercearia
            ['Arroz Agulha 25kg', 'ALI-0001', 'Mercearia', 'PCT', null, 'product', 1450, 1180, 0, 10, true],
            ['Óleo Alimentar 5L', 'ALI-0002', 'Mercearia', 'UN', null, 'product', 720, 590, 16, 12, false],
            ['Açúcar Branco 1kg', 'ALI-0003', 'Mercearia', 'KG', null, 'product', 85, 66, 0, 40, true],
            ['Farinha de Milho 10kg', 'ALI-0004', 'Mercearia', 'PCT', null, 'product', 420, 340, 0, 15, true],
            ['Massa Esparguete 500g', 'ALI-0005', 'Mercearia', 'PCT', 'Nestlé', 'product', 65, 48, 16, 30, false],
            // Bebidas
            ['Coca-Cola 350ml (Lata)', 'BEB-0001', 'Bebidas', 'UN', 'Coca-Cola', 'product', 45, 32, 16, 60, false],
            ['Cerveja 2M 500ml', 'BEB-0002', 'Bebidas', 'UN', '2M', 'product', 60, 42, 16, 100, false],
            ['Cerveja Laurentina Preta 500ml', 'BEB-0003', 'Bebidas', 'UN', 'Laurentina', 'product', 65, 46, 16, 80, false],
            ['Água Mineral 1,5L', 'BEB-0004', 'Bebidas', 'UN', null, 'product', 40, 28, 16, 50, false],
            // Laticínios e Ovos
            ['Leite UHT 1L', 'LAT-0001', 'Laticínios e Ovos', 'UN', 'Nestlé', 'product', 75, 58, 16, 30, false],
            ['Ovos (Dúzia)', 'LAT-0002', 'Laticínios e Ovos', 'DZ', null, 'product', 130, 100, 0, 20, true],
            // Higiene e Limpeza
            ['Detergente em Pó Omo 1kg', 'HIG-0001', 'Limpeza da Casa', 'UN', 'Omo', 'product', 210, 165, 16, 20, false],
            ['Pasta de Dentes Colgate 100ml', 'HIG-0002', 'Higiene Pessoal', 'UN', 'Colgate', 'product', 120, 88, 16, 25, false],
            ['Sabonete 90g', 'HIG-0003', 'Higiene Pessoal', 'UN', null, 'product', 35, 24, 16, 50, false],
            ['Lixívia 1L', 'HIG-0004', 'Limpeza da Casa', 'UN', null, 'product', 55, 38, 16, 25, false],
            // Escritório
            ['Resma de Papel A4 (500 folhas)', 'ESC-0001', 'Papelaria', 'PCT', null, 'product', 380, 295, 16, 20, false],
            ['Esferográfica Bic Azul', 'ESC-0002', 'Papelaria', 'UN', 'Bic', 'product', 15, 9, 16, 100, false],
            ['Caixa de Esferográficas Bic (50un)', 'ESC-0003', 'Papelaria', 'CX', 'Bic', 'product', 650, 480, 16, 5, false],
            ['Toner HP 85A Preto', 'ESC-0004', 'Consumíveis', 'UN', 'HP', 'product', 3900, 3100, 16, 3, false],
            ['Agrafador de Secretária', 'ESC-0005', 'Papelaria', 'UN', null, 'product', 250, 170, 16, 5, false],
            // Electrónica
            ['Portátil HP 15" 8GB/256GB', 'ELE-0001', 'Informática', 'UN', 'HP', 'product', 38500, 31000, 16, 2, false],
            ['Rato Sem Fios', 'ELE-0002', 'Informática', 'UN', null, 'product', 650, 420, 16, 8, false],
            ['Pen USB 64GB', 'ELE-0003', 'Informática', 'UN', null, 'product', 550, 360, 16, 10, false],
            ['Telemóvel Samsung Galaxy A15', 'ELE-0004', 'Telefonia', 'UN', 'Samsung', 'product', 12900, 10400, 16, 3, false],
            ['Carregador USB-C 25W', 'ELE-0005', 'Telefonia', 'UN', 'Samsung', 'product', 890, 590, 16, 10, false],
            // Serviços (não controlam stock)
            ['Consultoria (Hora)', 'SRV-0001', 'Serviços', 'H', 'Kutenga', 'service', 2500, 0, 16, 0, false],
            ['Instalação de Equipamento', 'SRV-0002', 'Serviços', 'UN', 'Kutenga', 'service', 1800, 0, 16, 0, false],
            ['Manutenção Mensal de Sistema', 'SRV-0003', 'Serviços', 'UN', 'Kutenga', 'service', 6500, 0, 16, 0, false],
        ];
    }

    public function run(): void
    {
        foreach (DemoCompanySeeder::demoCompanies() as $company) {
            $this->seedCompany($company, self::PRODUCT_LIMIT[$company->nuit] ?? null);
        }
    }

    private function seedCompany(Company $company, ?int $productLimit): void
    {
        $units = [];
        foreach (self::units() as $short => $name) {
            $units[$short] = $this->upsert(
                Unit::class,
                ['company_id' => $company->id, 'short_name' => $short],
                ['name' => $name, 'status' => 'active']
            );
        }

        $categories = [];
        foreach (self::categories() as $parentName => $children) {
            $parent = $this->category($company, $parentName, null);
            $categories[$parentName] = $parent;

            foreach ($children as $childName) {
                $categories[$childName] = $this->category($company, $childName, $parent->id);
            }
        }

        $brands = [];
        foreach (self::brands() as $name) {
            $brands[$name] = $this->upsert(
                Brand::class,
                ['company_id' => $company->id, 'slug' => Str::slug($name)],
                ['name' => $name, 'status' => 'active']
            );
        }

        $products = self::products();
        if ($productLimit !== null) {
            $products = array_slice($products, 0, $productLimit);
        }

        foreach ($products as $i => [$name, $sku, $category, $unit, $brand, $type, $price, $cost, $tax, $minStock, $exempt]) {
            $this->upsert(
                Product::class,
                ['company_id' => $company->id, 'sku' => $sku],
                [
                    'category_id' => $categories[$category]->id,
                    'unit_id' => $units[$unit]->id,
                    'brand_id' => $brand ? $brands[$brand]->id : null,
                    'name' => $name,
                    'slug' => Str::slug($name),
                    'barcode' => $type === 'product' ? '600'.str_pad((string) ($company->id * 1000 + $i + 1), 10, '0', STR_PAD_LEFT) : null,
                    'description' => "{$name} — produto de demonstração.",
                    'type' => $type,
                    'track_stock' => $type === 'product',
                    'min_stock' => $minStock,
                    'price' => $price,
                    'cost' => $cost,
                    'tax_rate' => $exempt ? 0 : $tax,
                    'tax_is_exempt' => $exempt,
                    'tax_exemption_reason' => $exempt ? self::EXEMPT_REASON : null,
                    'status' => 'active',
                ]
            );
        }
    }

    private function category(Company $company, string $name, ?int $parentId): Category
    {
        return $this->upsert(
            Category::class,
            ['company_id' => $company->id, 'slug' => Str::slug($name)],
            ['parent_id' => $parentId, 'name' => $name, 'status' => 'active']
        );
    }

    /**
     * Cria ou actualiza um registo, restaurando-o se tiver sido apagado (soft delete).
     *
     * @param  class-string<Model>  $model
     */
    private function upsert(string $model, array $keys, array $values): Model
    {
        $record = $model::withTrashed()->firstOrNew($keys);
        $record->fill($values)->save();

        if ($record->trashed()) {
            $record->restore();
        }

        return $record;
    }
}
