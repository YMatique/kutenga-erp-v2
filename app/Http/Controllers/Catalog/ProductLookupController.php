<?php

namespace App\Http\Controllers\Catalog;

use App\Http\Controllers\Controller;
use App\Models\Catalog\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductLookupController extends Controller
{
    /** Permissões que podem ler um código (catálogo, POS e inventário). */
    private const ABILITIES = ['catalog.view', 'sales.create', 'inventory.view', 'inventory.adjust', 'inventory.transfer'];

    /**
     * Resolve um código lido (leitor ou câmara) para um produto da empresa do utilizador.
     * Procura primeiro pelo código de barras e depois pelo SKU.
     */
    public function __invoke(Request $request): JsonResponse
    {
        abort_unless($request->user()->canAny(self::ABILITIES), 403);

        $data = $request->validate([
            'code' => ['required', 'string', 'max:100'],
            'track_stock' => ['sometimes', 'boolean'],
        ]);

        $code = trim($data['code']);

        $query = Product::query()
            ->where('company_id', $request->user()->company_id)
            ->where('status', 'active')
            ->when($request->boolean('track_stock'), fn ($q) => $q->where('track_stock', true))
            ->with('unit:id,name,short_name');

        $product = (clone $query)->where('barcode', $code)->first()
            ?? (clone $query)->where('sku', $code)->first();

        if (! $product) {
            return response()->json(['message' => "Nenhum produto com o código {$code}."], 404);
        }

        return response()->json([
            'id' => $product->id,
            'name' => $product->name,
            'sku' => $product->sku,
            'barcode' => $product->barcode,
            'price' => (float) $product->price,
            'tax_rate' => (float) $product->tax_rate,
            'track_stock' => (bool) $product->track_stock,
            'unit' => $product->unit?->short_name ?? $product->unit?->name,
        ]);
    }
}
