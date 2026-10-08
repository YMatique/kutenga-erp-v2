<?php

namespace App\Http\Controllers\Catalog;

use App\Http\Controllers\Controller;
use App\Models\Catalog\Product;
use App\Services\Catalog\Ean13;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProductLabelController extends Controller
{
    private const FIELDS = ['id', 'name', 'sku', 'barcode', 'price'];

    /** Ecrã de impressão de etiquetas; recebe ?ids=1,2,3 dos produtos já escolhidos. */
    public function index(Request $request)
    {
        $ids = collect(explode(',', (string) $request->query('ids')))
            ->filter(fn ($id) => ctype_digit($id))
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->take(200);

        return Inertia::render('products/labels', [
            'products' => Product::where('company_id', $request->user()->company_id)
                ->whereIn('id', $ids)
                ->get(self::FIELDS),
        ]);
    }

    /** Pesquisa rápida (nome, SKU ou código) para acrescentar produtos às etiquetas. */
    public function search(Request $request): JsonResponse
    {
        $term = trim((string) $request->query('q'));

        if (mb_strlen($term) < 2) {
            return response()->json([]);
        }

        return response()->json(
            Product::where('company_id', $request->user()->company_id)
                ->search($term)
                ->orderBy('name')
                ->limit(10)
                ->get(self::FIELDS)
        );
    }

    /** Sugere o próximo EAN-13 interno livre; só fica reservado quando o produto é guardado. */
    public function nextBarcode(Request $request): JsonResponse
    {
        return response()->json(['barcode' => Ean13::nextInternal($request->user()->company_id)]);
    }
}
