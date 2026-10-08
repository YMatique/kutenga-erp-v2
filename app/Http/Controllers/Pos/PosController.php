<?php

namespace App\Http\Controllers\Pos;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Pos\PosShift;
use App\Models\Catalog\Category;
use App\Models\Catalog\Product;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class PosController extends Controller
{
    private const PAGE_SIZE = 48;

    public function index()
    {
        $user = Auth::user();

        // Check if user has an open shift
        $openShift = PosShift::where('user_id', $user->id)
            ->where('company_id', $user->company_id)
            ->where('status', 'open')
            ->with(['branch'])
            ->first();

        if (!$openShift) {
            return redirect()->route('pos.shifts.create');
        }

        $categories = Category::where('company_id', $user->company_id)
            ->orderBy('name')
            ->get(['id', 'name']);

        $page = $this->catalogQuery($user->company_id)->simplePaginate(self::PAGE_SIZE);

        return Inertia::render('pos/Index', [
            'shift'      => $openShift,
            'categories' => $categories,
            'products'   => $page->getCollection()->map(fn ($p) => $this->present($p))->values(),
            'has_more'   => $page->hasMorePages(),
            'auth'       => ['user' => ['name' => $user->name]],
        ]);
    }

    /**
     * Catálogo do POS paginado no servidor: não carrega a empresa inteira no browser.
     * ?code= devolve só a correspondência exacta de código de barras/SKU (leitura).
     */
    public function products(Request $request): JsonResponse
    {
        $companyId = $request->user()->company_id;

        if ($request->filled('code')) {
            $code = trim($request->string('code'));
            $query = $this->catalogQuery($companyId);

            $product = (clone $query)->where('barcode', $code)->first()
                ?? (clone $query)->where('sku', $code)->first();

            return response()->json(['data' => $product ? [$this->present($product)] : [], 'has_more' => false]);
        }

        $page = $this->catalogQuery($companyId)
            ->when($request->filled('search'), fn ($q) => $q->search(trim($request->string('search'))))
            ->when($request->filled('category_id'), fn ($q) => $q->where('category_id', $request->integer('category_id')))
            ->simplePaginate(self::PAGE_SIZE);

        return response()->json([
            'data' => $page->getCollection()->map(fn ($p) => $this->present($p))->values(),
            'has_more' => $page->hasMorePages(),
        ]);
    }

    private function catalogQuery(int $companyId)
    {
        return Product::where('company_id', $companyId)
            ->where('status', 'active')
            ->with(['category:id,name', 'unit:id,name'])
            ->orderBy('name');
    }

    private function present(Product $product): array
    {
        return [
            'id'          => $product->id,
            'name'        => $product->name,
            'sku'         => $product->sku,
            'barcode'     => $product->barcode,
            'sale_price'  => (float) $product->price,
            'tax_rate'    => (float) $product->tax_rate,
            'category_id' => $product->category_id,
            'category'    => $product->category?->name,
            'unit'        => $product->unit?->name,
            'image_url'   => $product->image_path
                ? (str_starts_with($product->image_path, '/storage/')
                    ? $product->image_path
                    : Storage::url($product->image_path))
                : null,
        ];
    }
}
