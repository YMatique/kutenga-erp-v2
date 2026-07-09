<?php

namespace App\Http\Controllers\Pos;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use App\Models\PosShift;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class PosController extends Controller
{
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

        $products = Product::where('company_id', $user->company_id)
            ->where('status', 'active')
            ->with(['category:id,name', 'unit:id,name'])
            ->get()
            ->map(function ($product) {
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
            });

        return Inertia::render('pos/Index', [
            'shift'      => $openShift,
            'categories' => $categories,
            'products'   => $products,
            'auth'       => ['user' => ['name' => $user->name]],
        ]);
    }
}
