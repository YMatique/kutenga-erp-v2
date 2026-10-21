<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Catalog\Product;
use App\Models\Inventory\ProductStock;
use App\Support\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Pesquisa de produtos para os formulários de stock (stock inicial, ajustes, transferências).
 *
 * Em vez de enviar o catálogo inteiro ao navegador, cada formulário pergunta ao servidor à medida
 * que se escreve, e recebe só os primeiros resultados.
 */
class ProductPickerController extends Controller
{
    /** Resultados por pesquisa; se houver mais, o formulário pede para afinar o texto. */
    private const LIMIT = 20;

    public function search(Request $request): JsonResponse
    {
        $user = $request->user();

        abort_unless($user->canAny(['inventory.adjust', 'inventory.transfer']), 403);

        $data = $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'exact' => ['sometimes', 'boolean'],
            'warehouse_id' => ['nullable', 'integer', Tenant::exists('warehouses')],
            'in_stock' => ['sometimes', 'boolean'],
        ]);

        $term = trim($data['q'] ?? '');
        $warehouseId = $data['warehouse_id'] ?? null;

        $products = Product::query()
            ->where('company_id', $user->company_id)
            ->where('track_stock', true)
            ->with('unit:id,name,short_name,allow_decimals')
            // "exact" é a leitura de um código: só o produto com esse código de barras ou SKU
            ->when($term !== '' && $request->boolean('exact'), fn ($q) => $q->where(fn ($q) => $q->where('barcode', $term)->orWhere('sku', $term)))
            ->when($term !== '' && ! $request->boolean('exact'), fn ($q) => $q->search($term))
            // Só os que têm stock (no armazém indicado, ou em qualquer um), para quem vai transferir
            ->when($request->boolean('in_stock'), fn ($q) => $q->whereHas('stocks', fn ($s) => $s
                ->when($warehouseId, fn ($s) => $s->where('warehouse_id', $warehouseId))
                ->where('quantity', '>', 0)))
            ->orderBy('name')
            ->limit(self::LIMIT)
            ->get();

        // Com um armazém, cada resultado traz o stock lá e o que ainda está disponível (sem as reservas)
        $stocks = $warehouseId
            ? ProductStock::withReserved()
                ->where('warehouse_id', $warehouseId)
                ->whereIn('product_id', $products->pluck('id'))
                ->get()
                ->each->append('available')
                ->keyBy('product_id')
            : collect();

        return response()->json([
            'data' => $products->map(fn (Product $product) => [
                'id' => $product->id,
                'name' => $product->name,
                'sku' => $product->sku,
                'barcode' => $product->barcode,
                'unit' => $product->unit?->short_name ?? $product->unit?->name,
                'allow_decimals' => $product->unit?->allow_decimals ?? true,
                'stock' => $warehouseId ? (float) ($stocks[$product->id]->quantity ?? 0) : null,
                'available' => $warehouseId ? (float) ($stocks[$product->id]->available ?? 0) : null,
            ])->values(),
            'has_more' => $products->count() === self::LIMIT,
        ]);
    }
}
