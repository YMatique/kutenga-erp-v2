<?php

namespace App\Http\Controllers\Pos;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\PosShift;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Support\Facades\Auth;

class PosController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        
        // Check if user has an open shift
        $openShift = PosShift::where('user_id', $user->id)
            ->where('company_id', $user->company_id)
            ->where('status', 'open')
            ->first();
            
        if (!$openShift) {
            return redirect()->route('pos.shifts.create');
        }

        // Get categories and products for the POS interface
        $categories = Category::where('company_id', $user->company_id)->get();
        $products = Product::where('company_id', $user->company_id)
            ->with(['category', 'unit'])
            ->get();

        return Inertia::render('pos/Index', [
            'shift' => $openShift,
            'categories' => $categories,
            'products' => $products,
        ]);
    }
}
