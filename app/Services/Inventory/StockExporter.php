<?php

namespace App\Services\Inventory;

use App\Models\Catalog\Product;
use App\Models\Inventory\ProductStock;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Spatie\SimpleExcel\SimpleExcelWriter;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Exportações de stock (CSV / XLSX) em streaming, sem ficheiros temporários.
 * Os números saem como números (não texto) para se poderem somar na folha de cálculo.
 */
class StockExporter
{
    /** Mesmos limiares da coluna "Status" do ecrã de stock. */
    public static function statusLabel(float $quantity, float $minStock): string
    {
        if ($quantity <= 0) {
            return 'Esgotado';
        }

        return $quantity <= $minStock ? 'Stock baixo' : 'Em stock';
    }

    /** Filtros da listagem de stock (partilhados entre o ecrã e a exportação). */
    public static function filteredStocks(Request $request, int $companyId): Builder
    {
        $query = ProductStock::with(['product.category', 'warehouse'])
            ->where('company_id', $companyId);

        if ($request->filled('search')) {
            $term = $request->search;
            $query->whereHas('product', fn ($q) => $q->where(
                fn ($q) => $q->where('name', 'like', "%{$term}%")->orWhere('sku', 'like', "%{$term}%")->orWhere('barcode', 'like', "%{$term}%")
            ));
        }

        if ($request->filled('warehouse_id') && $request->warehouse_id !== 'all') {
            $query->where('warehouse_id', $request->warehouse_id);
        }

        match ($request->status) {
            'out_of_stock' => $query->where('quantity', '<=', 0),
            'low' => $query->where('quantity', '>', 0)
                ->whereHas('product', fn ($q) => $q->whereColumn('product_stocks.quantity', '<=', 'products.min_stock')),
            'in_stock' => $query->where('quantity', '>', 0)
                ->whereHas('product', fn ($q) => $q->whereColumn('product_stocks.quantity', '>', 'products.min_stock')),
            default => null,
        };

        return $query
            ->orderBy(Product::select('name')->whereColumn('products.id', 'product_stocks.product_id'))
            ->orderBy('warehouse_id');
    }

    /** Stock por produto e armazém (respeita os filtros do ecrã). */
    public function stocks(Request $request, int $companyId): StreamedResponse
    {
        return $this->download('stock_geral', $request, function (SimpleExcelWriter $writer) use ($request, $companyId) {
            $writer->addRow(['Produto', 'SKU', 'Categoria', 'Armazém', 'Quantidade', 'Stock mínimo', 'Estado', 'Custo unitário', 'Valor em stock']);

            foreach (self::filteredStocks($request, $companyId)->lazy(500) as $stock) {
                $product = $stock->product;
                $quantity = (float) $stock->quantity;
                $cost = (float) ($product->cost ?? 0);

                $writer->addRow([
                    $product->name,
                    $product->sku,
                    $product->category?->name,
                    $stock->warehouse?->name,
                    $quantity,
                    (float) $product->min_stock,
                    self::statusLabel($quantity, (float) $product->min_stock),
                    $cost,
                    round($quantity * $cost, 2),
                ]);
            }
        });
    }

    /** Relatório consolidado por produto, com uma coluna por armazém. */
    public function summary(Request $request, int $companyId, $warehouses): StreamedResponse
    {
        return $this->download('relatorio_inventario', $request, function (SimpleExcelWriter $writer) use ($companyId, $warehouses) {
            $writer->addRow(array_merge(
                ['Produto', 'SKU', 'Categoria'],
                $warehouses->pluck('name')->all(),
                ['Total', 'Stock mínimo', 'Estado', 'Custo unitário', 'Valor em stock'],
            ));

            $products = Product::where('company_id', $companyId)
                ->where('track_stock', true)
                ->with(['category', 'stocks'])
                ->orderBy('name');

            foreach ($products->lazy(500) as $product) {
                $byWarehouse = $product->stocks->groupBy('warehouse_id')->map->sum('quantity');
                $total = (float) $product->stocks->sum('quantity');
                $cost = (float) ($product->cost ?? 0);

                $writer->addRow(array_merge(
                    [$product->name, $product->sku, $product->category?->name],
                    $warehouses->map(fn ($w) => (float) ($byWarehouse[$w->id] ?? 0))->all(),
                    [
                        $total,
                        (float) $product->min_stock,
                        self::statusLabel($total, (float) $product->min_stock),
                        $cost,
                        round($total * $cost, 2),
                    ],
                ));
            }
        });
    }

    /**
     * Resposta em streaming (CSV por ?format=csv, XLSX por omissão).
     * Escreve em php://output dentro do callback da resposta: não usa ficheiros temporários.
     */
    private function download(string $name, Request $request, callable $fill): StreamedResponse
    {
        $csv = $request->query('format') === 'csv';
        $filename = $name.'_'.now()->format('Ymd_His').'.'.($csv ? 'csv' : 'xlsx');

        return response()->streamDownload(function () use ($csv, $fill) {
            // noHeaderRow: a primeira linha que adicionamos já é o cabeçalho
            $writer = SimpleExcelWriter::create('php://output', $csv ? 'csv' : 'xlsx')->noHeaderRow();

            $fill($writer);
            $writer->close();
        }, $filename, [
            'Content-Type' => $csv ? 'text/csv; charset=UTF-8' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }
}
