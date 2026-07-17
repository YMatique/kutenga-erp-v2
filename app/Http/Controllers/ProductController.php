<?php

namespace App\Http\Controllers;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\Unit;
use App\Services\Inventory\StockService;
use Auth;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $companyId = auth()->user()->company_id;
        $query = Product::with(['category', 'unit', 'brand'])
            ->withSum('stocks as total_stock', 'quantity')
            ->where('company_id', $companyId);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%");
            });
        }

        $products = $query->latest()->paginate(15)->withQueryString();

        // Calculate statistics over all company products
        $allProducts = Product::where('company_id', $companyId)
            ->withSum('stocks as total_stock', 'quantity')
            ->get();

        $stats = [
            'total_items' => $allProducts->count(),
            'total_products' => $allProducts->where('type', 'product')->count(),
            'total_services' => $allProducts->where('type', 'service')->count(),
            'low_stock' => $allProducts->filter(function ($p) {
                return $p->track_stock && ($p->total_stock ?? 0) <= $p->min_stock && ($p->total_stock ?? 0) > 0;
            })->count(),
            'out_of_stock' => $allProducts->filter(function ($p) {
                return $p->track_stock && ($p->total_stock ?? 0) <= 0;
            })->count(),
        ];

        return Inertia::render('products/index', [
            'products' => $products,
            'stats' => $stats,
            'filters' => [
                'search' => $request->search,
            ],
        ]);
    }

    public function create()
    {
        return Inertia::render('products/create', [
            'categories' => Category::all(),
            'units' => Unit::all(),
            'brands' => Brand::all(),
        ]);
    }

    public function store(Request $request)
    {
        if ($request->type === 'service') {
            $request->merge([
                'track_stock' => false,
                'min_stock' => 0,
                'weight' => null,
                'brand_id' => null,
            ]);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category_id' => 'nullable|exists:categories,id',
            'unit_id' => 'nullable|exists:units,id',
            'brand_id' => 'nullable|exists:brands,id',
            'sku' => 'nullable|string|max:50',
            'barcode' => 'nullable|string|max:50',
            'description' => 'nullable|string',
            'type' => 'required|in:product,service',
            'track_stock' => 'required|boolean',
            'min_stock' => 'required|numeric|min:0',
            'weight' => 'nullable|numeric|min:0',
            'price' => 'required|numeric|min:0',
            'cost' => 'required|numeric|min:0',
            'tax_rate' => 'required|numeric|min:0|max:100',
            'tax_is_exempt' => 'required|boolean',
            'tax_exemption_reason' => 'nullable|required_if:tax_is_exempt,true|string|max:255',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            'internal_notes' => 'nullable|string',
        ]);

        $validated['slug'] = Str::slug($validated['name']) . '-' . Str::random(5);

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('products', 'public');
            $validated['image_path'] = '/storage/' . $path;
        }

        $product = Product::create($validated);
        $companyId = Auth::user()->company_id;
        \App\Models\SystemNotification::create([
            'company_id' => $companyId,
            'type' => 'product_created',
            'title' => 'Novo Item Adicionado',
            'message' => "O produto/serviço {$product->name} foi adicionado ao catálogo.",
            'link' => "/products/{$product->id}",
            'is_read' => false,
        ]);

        return redirect()->route('products.index')->with('success', 'Item criado com sucesso.');
    }

    public function show(Product $product, StockService $stockService)
    {
        $product->load([
            'category',
            'unit',
            'brand',
            'stocks.warehouse'
        ]);
        $stockByWarehouse = $stockService->getStockByWarehouses($product);

        return Inertia::render('products/show', [
            'product' => $product,
            'stockByWarehouse' => $stockByWarehouse,
        ]);

    }

    public function edit(Product $product)
    {
        return Inertia::render('products/edit', [
            'product' => $product,
            'categories' => Category::all(),
            'units' => Unit::all(),
            'brands' => Brand::all(),
        ]);
    }

    public function update(Request $request, Product $product)
    {
        if ($request->type === 'service') {
            $request->merge([
                'track_stock' => false,
                'min_stock' => 0,
                'weight' => null,
                'brand_id' => null,
            ]);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category_id' => 'nullable|exists:categories,id',
            'unit_id' => 'nullable|exists:units,id',
            'brand_id' => 'nullable|exists:brands,id',
            'sku' => 'nullable|string|max:50',
            'barcode' => 'nullable|string|max:50',
            'description' => 'nullable|string',
            'type' => 'required|in:product,service',
            'track_stock' => 'required|boolean',
            'min_stock' => 'required|numeric|min:0',
            'weight' => 'nullable|numeric|min:0',
            'price' => 'required|numeric|min:0',
            'cost' => 'required|numeric|min:0',
            'tax_rate' => 'required|numeric|min:0|max:100',
            'tax_is_exempt' => 'required|boolean',
            'tax_exemption_reason' => 'nullable|required_if:tax_is_exempt,true|string|max:255',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            'internal_notes' => 'nullable|string',
        ]);

        if ($request->hasFile('image')) {
            // Delete old image if it exists
            if ($product->image_path) {
                $oldPath = str_replace('/storage/', '', $product->image_path);
                Storage::disk('public')->delete($oldPath);
            }
            $path = $request->file('image')->store('products', 'public');
            $validated['image_path'] = '/storage/' . $path;
        }

        if ($request->name !== $product->name) {
            $validated['slug'] = Str::slug($validated['name']) . '-' . Str::random(5);
        }

        $product->update($validated);

        return redirect()->route('products.index')->with('success', 'Item atualizado com sucesso.');
    }

    public function destroy(Product $product)
    {
        $product->delete();

        return back()->with('success', 'Item removido com sucesso.');
    }
}
