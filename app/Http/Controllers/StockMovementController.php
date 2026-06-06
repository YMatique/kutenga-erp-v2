<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StockMovementController extends Controller
{
      public function index()
    {
        $movements = StockMovement::with([
            'product',
            'warehouse',
            'user'
        ])
        ->latest()
        ->paginate(20);

        return Inertia::render('inventory/movements/index', [
            'movements' => $movements
        ]);
    }
}
