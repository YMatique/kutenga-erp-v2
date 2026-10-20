<?php

namespace App\Http\Controllers\Pos;

use App\Http\Controllers\Controller;
use App\Models\Catalog\Category;
use App\Models\Catalog\Product;
use App\Models\Inventory\ProductStock;
use App\Models\Inventory\Warehouse;
use App\Models\Pos\CashRegister;
use App\Models\Pos\PosShift;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

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

        if (! $openShift) {
            return redirect()->route('pos.shifts.create');
        }

        $categories = Category::where('company_id', $user->company_id)
            ->orderBy('name')
            ->get(['id', 'name']);

        $page = $this->catalogQuery($user->company_id)->simplePaginate(self::PAGE_SIZE);
        $stock = $this->availableStock($page->getCollection(), $this->warehouseFor($openShift));

        return Inertia::render('pos/Index', [
            'shift' => $openShift,
            'categories' => $categories,
            'products' => $page->getCollection()->map(fn ($p) => $this->present($p, $stock))->values(),
            'has_more' => $page->hasMorePages(),
            'auth' => ['user' => ['name' => $user->name]],
        ]);
    }

    /**
     * Catálogo do POS paginado no servidor: não carrega a empresa inteira no browser.
     * ?code= devolve só a correspondência exacta de código de barras/SKU (leitura).
     */
    public function products(Request $request): JsonResponse
    {
        $companyId = $request->user()->company_id;
        $warehouse = $this->warehouseFor(
            PosShift::where('user_id', $request->user()->id)->where('company_id', $companyId)->where('status', 'open')->first()
        );

        if ($request->filled('code')) {
            $code = trim($request->string('code'));
            $query = $this->catalogQuery($companyId);

            $product = (clone $query)->where('barcode', $code)->first()
                ?? (clone $query)->where('sku', $code)->first();

            $stock = $this->availableStock(collect($product ? [$product] : []), $warehouse);

            return response()->json(['data' => $product ? [$this->present($product, $stock)] : [], 'has_more' => false]);
        }

        $page = $this->catalogQuery($companyId)
            ->when($request->filled('search'), fn ($q) => $q->search(trim($request->string('search'))))
            ->when($request->filled('category_id'), fn ($q) => $q->where('category_id', $request->integer('category_id')))
            ->simplePaginate(self::PAGE_SIZE);

        $stock = $this->availableStock($page->getCollection(), $warehouse);

        return response()->json([
            'data' => $page->getCollection()->map(fn ($p) => $this->present($p, $stock))->values(),
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

    /** Armazém de onde saem as vendas do turno (o mesmo que a venda usa ao confirmar). */
    private function warehouseFor(?PosShift $shift): ?Warehouse
    {
        if (! $shift) {
            return null;
        }

        // Turnos antigos (sem caixa) usam a primeira caixa ativa, como na venda
        $register = $shift->cashRegister
            ?? CashRegister::where('company_id', $shift->company_id)->where('is_active', true)->orderBy('id')->first();

        return $register?->saleWarehouse();
    }

    /**
     * Stock disponível (saldo menos reservado) de cada produto com controlo de stock, no armazém
     * da venda, numa só consulta. Produtos sem linha de stock ficam de fora (disponível 0).
     *
     * @param  Collection<int, Product>  $products
     * @return array<int, float>|null null quando não há armazém para consultar
     */
    private function availableStock(Collection $products, ?Warehouse $warehouse): ?array
    {
        $ids = $products->where('track_stock', true)->pluck('id');

        if (! $warehouse) {
            return null;
        }

        return ProductStock::withReserved()
            ->where('warehouse_id', $warehouse->id)
            ->whereIn('product_id', $ids)
            ->get()
            ->each->append('available')
            ->pluck('available', 'product_id')
            ->all();
    }

    private function present(Product $product, ?array $stock = null): array
    {
        return [
            'id' => $product->id,
            'name' => $product->name,
            'sku' => $product->sku,
            'barcode' => $product->barcode,
            'sale_price' => (float) $product->price,
            'tax_rate' => (float) $product->tax_rate,
            'category_id' => $product->category_id,
            'category' => $product->category?->name,
            'unit' => $product->unit?->name,
            // Disponível para vender neste turno; null quando o produto não controla stock
            'track_stock' => (bool) $product->track_stock,
            'stock' => $product->track_stock && $stock !== null ? (float) ($stock[$product->id] ?? 0) : null,
            'image_url' => $product->image_path
                ? (str_starts_with($product->image_path, '/storage/')
                    ? $product->image_path
                    : Storage::url($product->image_path))
                : null,
        ];
    }
}
