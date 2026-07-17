<?php

namespace App\Http\Controllers\Catalog;

use App\Http\Controllers\Controller;

use App\Models\Catalog\Brand;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class BrandController extends Controller
{
    public function index()
    {
        return Inertia::render('brands/index', [
            'brands' => Brand::all(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $validated['slug'] = Str::slug($validated['name']) . '-' . Str::random(5);

        Brand::create($validated);

        return back()->with('success', 'Marca criada com sucesso.');
    }

    public function update(Request $request, Brand $brand)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        if ($request->name !== $brand->name) {
            $validated['slug'] = Str::slug($validated['name']) . '-' . Str::random(5);
        }

        $brand->update($validated);

        return back()->with('success', 'Marca atualizada com sucesso.');
    }

    public function destroy(Brand $brand)
    {
        $brand->delete();
        return back()->with('success', 'Marca removida com sucesso.');
    }
}
