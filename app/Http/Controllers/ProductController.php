<?php

namespace App\Http\Controllers;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\Unit;
use App\Services\Inventory\StockService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ProductController extends Controller
{
    public function index()
    {
        return Inertia::render('products/index', [
            'products' => Product::with(['category', 'unit', 'brand'])->get(),
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

        $validated['slug'] = Str::slug($validated['name']).'-'.Str::random(5);

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('products', 'public');
            $validated['image_path'] = '/storage/'.$path;
        }

        Product::create($validated);

        return redirect()->route('products.index')->with('success', 'Item criado com sucesso.');
    }

    public function show(Product $product, StockService $stockService)
    {
        $product->load([
            'category',
            'unit',
            'brand',
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
            $validated['image_path'] = '/storage/'.$path;
        }

        if ($request->name !== $product->name) {
            $validated['slug'] = Str::slug($validated['name']).'-'.Str::random(5);
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
