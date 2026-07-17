<?php

use App\Http\Controllers\BranchController;
use App\Http\Controllers\BrandController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ContextController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\DocumentSeriesController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\QuoteController;
use App\Http\Controllers\ReceiptController;
use App\Http\Controllers\CreditNoteController;
use App\Http\Controllers\DebitNoteController;
use App\Http\Controllers\InventoryDashboardController;
use App\Http\Controllers\InventoryOpeningController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProductStockController;
use App\Http\Controllers\StockAdjustmentController;
use App\Http\Controllers\StockMovementController;
use App\Http\Controllers\StockTransferController;
use App\Http\Controllers\UnitController;
use App\Http\Controllers\WarehouseController;
use App\Http\Middleware\SetCompanyContext;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

// Route::inertia('/', 'welcome', [
//     'canRegister' => Features::enabled(Features::registration()),
// ])->name('home');
Route::inertia('/', 'index')->name('home');
Route::middleware(['auth', 'verified', SetCompanyContext::class])->group(function () {
    Route::get('dashboard', [\App\Http\Controllers\DashboardController::class, 'index'])->name('dashboard');
    
    // Onboarding
    Route::get('/onboarding', [\App\Http\Controllers\OnboardingController::class, 'index'])->name('onboarding.index');
    Route::post('/onboarding', [\App\Http\Controllers\OnboardingController::class, 'store'])->name('onboarding.store');

    Route::post('context/switch', [ContextController::class, 'switch'])->name('context.switch');
    Route::post('unlock-screen', [\App\Http\Controllers\LockScreenController::class, 'unlock'])->name('unlock.screen');

    // Catalog View
    Route::middleware('can:catalog.view')->group(function () {
        Route::get('branches', [BranchController::class, 'index'])->name('branches.index');
        Route::get('branches/{branch}', [BranchController::class, 'show'])->name('branches.show');
        Route::get('products', [ProductController::class, 'index'])->name('products.index');
        Route::get('products/{product}', [ProductController::class, 'show'])->name('products.show');
        Route::get('categories', [CategoryController::class, 'index'])->name('categories.index');
        Route::get('categories/{category}', [CategoryController::class, 'show'])->name('categories.show');
        Route::get('units', [UnitController::class, 'index'])->name('units.index');
        Route::get('units/{unit}', [UnitController::class, 'show'])->name('units.show');
        Route::get('brands', [BrandController::class, 'index'])->name('brands.index');
        Route::get('brands/{brand}', [BrandController::class, 'show'])->name('brands.show');
    });

    // Catalog Edit
    Route::middleware('can:catalog.edit')->group(function () {
        Route::resource('branches', BranchController::class)->except(['index', 'show']);
        Route::resource('products', ProductController::class)->except(['index', 'show']);
        Route::resource('categories', CategoryController::class)->except(['index', 'show']);
        Route::resource('units', UnitController::class)->except(['index', 'show']);
        Route::resource('brands', BrandController::class)->except(['index', 'show']);
    });

    // Settings
    Route::prefix('settings')->group(function () {
        Route::get('profile', [ProfileController::class, 'edit'])->name('settings.profile.edit');
        Route::patch('profile', [ProfileController::class, 'update'])->name('settings.profile.update');
        Route::delete('profile', [ProfileController::class, 'destroy'])->name('settings.profile.destroy');



        Route::get('audits', [\App\Http\Controllers\AuditLogController::class, 'index'])
            ->name('settings.audits')
            ->middleware('can:audits.view');
    });

    // Reports
    Route::prefix('reports')->name('reports.')->middleware('role:Admin|owner|Manager')->group(function () {
        Route::get('/', [\App\Http\Controllers\ReportController::class, 'index'])->name('index');
        Route::get('/data', [\App\Http\Controllers\ReportController::class, 'data'])->name('data');
        Route::get('/export/pdf', [\App\Http\Controllers\ReportController::class, 'exportPdf'])->name('export.pdf');
        Route::get('/export/excel', [\App\Http\Controllers\ReportController::class, 'exportExcel'])->name('export.excel');
    });

    // Inventory
    Route::prefix('/inventory')->group(function () {
        // Inventory View
        Route::middleware('can:inventory.view')->group(function () {
            Route::resource('warehouses', WarehouseController::class)->only(['index', 'show']);
            Route::get('movements', [StockMovementController::class, 'index'])->name('inventory.movements.index');
            Route::get('/', [InventoryDashboardController::class, 'index'])->name('inventory.dashboard');
            Route::get('/opening', [InventoryOpeningController::class, 'index'])->name('inventory.opening.index');
            Route::get('/stocks', [ProductStockController::class, 'index']);
            Route::get('/stocks/{product}', [ProductStockController::class, 'show']);
            Route::get('/transfers', [StockTransferController::class, 'index'])->name('inventory.transfers.index');
            Route::get('/transfers/{transfer}', [StockTransferController::class, 'show'])->name('inventory.transfers.show');
            Route::get('/adjustments', [StockAdjustmentController::class, 'index'])->name('inventory.adjustments.index');
            Route::get('/adjustments/{adjustment}', [StockAdjustmentController::class, 'show'])->name('inventory.adjustments.show');
        });

        // Inventory Adjust
        Route::middleware('can:inventory.adjust')->group(function () {
            Route::post('/opening', [InventoryOpeningController::class, 'store'])->name('inventory.opening.store');
            Route::resource('warehouses', WarehouseController::class)->except(['index', 'show']);
            Route::get('/adjustments/create', [StockAdjustmentController::class, 'create'])->name('inventory.adjustments.create');
            Route::post('/adjustments', [StockAdjustmentController::class, 'store'])->name('inventory.adjustments.store');
            Route::post('/adjustments/{adjustment}/complete', [StockAdjustmentController::class, 'complete'])->name('inventory.adjustments.complete');
            Route::post('/adjustments/{adjustment}/cancel', [StockAdjustmentController::class, 'cancel'])->name('inventory.adjustments.cancel');
        });

        // Inventory Transfer
        Route::middleware('can:inventory.transfer')->group(function () {
            Route::get('/transfers/create', [StockTransferController::class, 'create']);
            Route::post('/transfers/{transfer}/cancel', [StockTransferController::class, 'cancel'])->name('inventory.transfers.cancel');
            Route::post('/transfers/{transfer}/approve', [StockTransferController::class, 'approve'])->name('inventory.transfers.approve');
            Route::post('/transfers', [StockTransferController::class, 'store']);
            Route::post('/transfers/{transfer}/complete', [StockTransferController::class, 'complete']);
        });
    });

    // Sales/Billing
    Route::prefix('billing')->name('billing.')->group(function () {
        // Sales Create (Quotes and Customers edit/create)
        Route::middleware('can:sales.create')->group(function () {
            Route::resource('quotes', QuoteController::class)->except(['index', 'show']);
            Route::resource('customers', CustomerController::class)->except(['index', 'show']);
            Route::post('quotes/{id}/confirm', [QuoteController::class, 'confirm'])->name('quotes.confirm');
        });

        // Sales View (Quotes and Customers index/show)
        Route::middleware('can:sales.view')->group(function () {
            Route::resource('quotes', QuoteController::class)->only(['index', 'show']);
            Route::resource('customers', CustomerController::class)->only(['index', 'show']);
        });

        // Sales Cancel (Quotes cancel)
        Route::middleware('can:sales.cancel')->group(function () {
            Route::post('quotes/{id}/cancel', [QuoteController::class, 'cancel'])->name('quotes.cancel');
        });

        // Invoice Create (Invoices/Receipts/Credit/Debit/Series edit/create)
        Route::middleware('can:invoice.create')->group(function () {
            Route::resource('invoices', InvoiceController::class)->except(['index', 'show']);
            Route::resource('receipts', ReceiptController::class)->except(['index', 'show']);
            Route::resource('credit-notes', CreditNoteController::class)->except(['index', 'show']);
            Route::resource('debit-notes', DebitNoteController::class)->except(['index', 'show']);
            Route::resource('series', DocumentSeriesController::class)->except(['index']);

            Route::post('invoices/{id}/confirm', [InvoiceController::class, 'confirm'])->name('invoices.confirm');
            Route::post('invoices/receive-payment', [InvoiceController::class, 'receivePayment'])->name('invoices.receive-payment');
            Route::post('receipts/{id}/confirm', [ReceiptController::class, 'confirm'])->name('receipts.confirm');
            Route::post('credit-notes/{id}/confirm', [CreditNoteController::class, 'confirm'])->name('credit-notes.confirm');
            Route::post('debit-notes/{id}/confirm', [DebitNoteController::class, 'confirm'])->name('debit-notes.confirm');
            Route::post('documents/{id}/send-email', [DocumentController::class, 'sendEmail'])->name('documents.send-email');
        });

        // Invoice View (Documents index/show, pdf)
        Route::middleware('can:invoice.view')->group(function () {
            Route::resource('invoices', InvoiceController::class)->only(['index', 'show']);
            Route::resource('receipts', ReceiptController::class)->only(['index', 'show']);
            Route::resource('credit-notes', CreditNoteController::class)->only(['index', 'show']);
            Route::resource('debit-notes', DebitNoteController::class)->only(['index', 'show']);
            Route::resource('series', DocumentSeriesController::class)->only(['index']);
            Route::get('documents/{id}/pdf', [DocumentController::class, 'downloadPdf'])->name('documents.pdf');
        });

        // Invoice Cancel
        Route::middleware('can:invoice.cancel')->group(function () {
            Route::post('invoices/{id}/cancel', [InvoiceController::class, 'cancel'])->name('invoices.cancel');
            Route::post('receipts/{id}/cancel', [ReceiptController::class, 'cancel'])->name('receipts.cancel');
            Route::post('credit-notes/{id}/cancel', [CreditNoteController::class, 'cancel'])->name('credit-notes.cancel');
            Route::post('debit-notes/{id}/cancel', [DebitNoteController::class, 'cancel'])->name('debit-notes.cancel');
        });
    });

    // POS
    Route::prefix('pos')->name('pos.')->group(function () {
        Route::middleware('can:sales.create')->group(function () {
            Route::get('/', [\App\Http\Controllers\Pos\PosController::class, 'index'])->name('index');
            Route::get('/shifts/open', [\App\Http\Controllers\Pos\PosShiftController::class, 'create'])->name('shifts.create');
            Route::post('/shifts/open', [\App\Http\Controllers\Pos\PosShiftController::class, 'store'])->name('shifts.store');
            Route::get('/shifts/close', [\App\Http\Controllers\Pos\PosShiftController::class, 'showClose'])->name('shifts.showClose');
            Route::post('/shifts/{shift}/close', [\App\Http\Controllers\Pos\PosShiftController::class, 'close'])->name('shifts.close');
            Route::post('/sales', [\App\Http\Controllers\Pos\PosSaleController::class, 'store'])->name('sales.store');
        });

        Route::middleware('can:sales.view')->group(function () {
            Route::get('/shifts', [\App\Http\Controllers\Pos\PosShiftController::class, 'index'])->name('shifts.index');
            Route::get('/reports', [\App\Http\Controllers\Pos\PosReportController::class, 'index'])->name('reports.index');
            // Wildcard route MUST be last to avoid hijacking /pos/shifts/open or /pos/shifts/close
            Route::get('/shifts/{shift}', [\App\Http\Controllers\Pos\PosShiftController::class, 'show'])->name('shifts.show');
        });
    });


    // Users
    Route::get('/notifications', [\App\Http\Controllers\SystemNotificationController::class, 'index'])->name('notifications.index');
    Route::post('/notifications/{id}/read', [\App\Http\Controllers\SystemNotificationController::class, 'markAsRead'])->name('notifications.read');
    Route::post('/notifications/mark-all-read', [\App\Http\Controllers\SystemNotificationController::class, 'markAllAsRead'])->name('notifications.markAllRead');

    // Configs
});

require __DIR__ . '/settings.php';
