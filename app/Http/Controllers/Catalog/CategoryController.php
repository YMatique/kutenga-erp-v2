<?php

namespace App\Http\Controllers\Catalog;

use App\Http\Controllers\Controller;

use App\Models\Catalog\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class CategoryController extends Controller
{
    public function index()
    {
        return Inertia::render('categories/index', [
            'categories' => Category::with('parent')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'parent_id' => 'nullable|exists:categories,id',
            'description' => 'nullable|string',
        ]);

        $validated['slug'] = Str::slug($validated['name']) . '-' . Str::random(5);

        Category::create($validated);

        return back()->with('success', 'Categoria criada com sucesso.');
    }

    public function update(Request $request, Category $category)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'parent_id' => 'nullable|exists:categories,id',
            'description' => 'nullable|string',
        ]);

        if ($request->name !== $category->name) {
            $validated['slug'] = Str::slug($validated['name']) . '-' . Str::random(5);
        }

        $category->update($validated);

        return back()->with('success', 'Categoria atualizada com sucesso.');
    }

    public function destroy(Category $category)
    {
        $category->delete();
        return back()->with('success', 'Categoria removida com sucesso.');
    }
}
