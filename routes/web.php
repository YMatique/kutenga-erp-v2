<?php

use App\Http\Controllers\BranchController;
use App\Http\Controllers\BrandController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ContextController;
use App\Http\Controllers\InventoryDashboardController;
use App\Http\Controllers\InventoryOpeningController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProductStockController;
use App\Http\Controllers\StockMovementController;
use App\Http\Controllers\StockTransferController;
use App\Http\Controllers\UnitController;
use App\Http\Controllers\WarehouseController;
use App\Http\Middleware\SetCompanyContext;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware(['auth', 'verified', SetCompanyContext::class])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
    Route::post('context/switch', [ContextController::class, 'switch'])->name('context.switch');

    // Catalog
    Route::resource('branches', BranchController::class);
    Route::resource('products', ProductController::class);
    Route::resource('categories', CategoryController::class);
    Route::resource('units', UnitController::class);
    Route::resource('brands', BrandController::class);

    // Inventory
    Route::prefix('/inventory')->group(function () {
        Route::resource('warehouses', WarehouseController::class);
        Route::get('movements', [StockMovementController::class, 'index'])
            ->name('inventory.movements.index');
        Route::get('/', [InventoryDashboardController::class, 'index'])
            ->name('inventory.dashboard');

            Route::get('/opening', [InventoryOpeningController::class, 'index'])
    ->name('inventory.opening.index');

Route::post('/opening', [InventoryOpeningController::class, 'store'])
    ->name('inventory.opening.store');
            Route::get('/stocks', [ProductStockController::class, 'index']);
    Route::get('/stocks/{product}', [ProductStockController::class, 'show']);


        Route::get('/transfers', [StockTransferController::class, 'index']);
    Route::get('/transfers/create', [StockTransferController::class, 'create']);

    Route::post('/transfers', [StockTransferController::class, 'store']);
    Route::post('/transfers/{transfer}/complete', [StockTransferController::class, 'complete']);
    });

    // Sales/Billing

    // POS

    //Users

    //
});

require __DIR__.'/settings.php';
