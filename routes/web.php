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
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
    
    // Onboarding
    Route::get('/onboarding', [\App\Http\Controllers\OnboardingController::class, 'index'])->name('onboarding.index');
    Route::post('/onboarding', [\App\Http\Controllers\OnboardingController::class, 'store'])->name('onboarding.store');

    Route::post('context/switch', [ContextController::class, 'switch'])->name('context.switch');
    Route::post('unlock-screen', [\App\Http\Controllers\LockScreenController::class, 'unlock'])->name('unlock.screen');

    // Catalog
    Route::resource('branches', BranchController::class);
    Route::resource('products', ProductController::class);
    Route::resource('categories', CategoryController::class);
    Route::resource('units', UnitController::class);
    Route::resource('brands', BrandController::class);

    // Settings
    Route::prefix('settings')->group(function () {
        Route::get('profile', [ProfileController::class, 'edit'])->name('settings.profile.edit');
        Route::patch('profile', [ProfileController::class, 'update'])->name('settings.profile.update');
        Route::delete('profile', [ProfileController::class, 'destroy'])->name('settings.profile.destroy');

        Route::get('company', [\App\Http\Controllers\CompanySettingsController::class, 'edit'])->name('settings.company.edit');
        Route::patch('company', [\App\Http\Controllers\CompanySettingsController::class, 'update'])->name('settings.company.update');

        Route::get('audits', [\App\Http\Controllers\AuditLogController::class, 'index'])->name('settings.audits');
    });

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

        Route::get('/transfers', [StockTransferController::class, 'index'])->name('inventory.transfers.index');
        Route::get('/transfers/create', [StockTransferController::class, 'create']);
        Route::get('/transfers/{transfer}', [StockTransferController::class, 'show'])->name('inventory.transfers.show');
        Route::post('/transfers/{transfer}/cancel', [StockTransferController::class, 'cancel'])->name('inventory.transfers.cancel');
        Route::post('/transfers/{transfer}/approve', [StockTransferController::class, 'approve'])->name('inventory.transfers.approve');

        Route::post('/transfers', [StockTransferController::class, 'store']);
        Route::post('/transfers/{transfer}/complete', [StockTransferController::class, 'complete']);

        // Stock Adjustments
        Route::get('/adjustments', [StockAdjustmentController::class, 'index'])->name('inventory.adjustments.index');
        Route::get('/adjustments/create', [StockAdjustmentController::class, 'create'])->name('inventory.adjustments.create');

        Route::get('/adjustments/{adjustment}', [StockAdjustmentController::class, 'show'])->name('inventory.adjustments.show');
        Route::post('/adjustments', [StockAdjustmentController::class, 'store'])->name('inventory.adjustments.store');
        Route::post('/adjustments/{adjustment}/complete', [StockAdjustmentController::class, 'complete'])->name('inventory.adjustments.complete');
        Route::post('/adjustments/{adjustment}/cancel', [StockAdjustmentController::class, 'cancel'])->name('inventory.adjustments.cancel');
    });

    // Sales/Billing

    Route::prefix('billing')->name('billing.')->group(function () {
        Route::resource('series', DocumentSeriesController::class)
            ->only(['index', 'store', 'update', 'destroy']);
        // Faturas (FT)
        Route::resource('invoices', InvoiceController::class);
        Route::post('invoices/{id}/confirm', [InvoiceController::class, 'confirm'])->name('invoices.confirm');
        Route::post('invoices/{id}/cancel', [InvoiceController::class, 'cancel'])->name('invoices.cancel');
        Route::post('invoices/receive-payment', [InvoiceController::class, 'receivePayment'])->name('invoices.receive-payment');

        // Cotações (CT)
        Route::resource('quotes', QuoteController::class);
        Route::post('quotes/{id}/confirm', [QuoteController::class, 'confirm'])->name('quotes.confirm');
        Route::post('quotes/{id}/cancel', [QuoteController::class, 'cancel'])->name('quotes.cancel');

        // Faturas-Recibo (FR)
        Route::resource('receipts', ReceiptController::class);
        Route::post('receipts/{id}/confirm', [ReceiptController::class, 'confirm'])->name('receipts.confirm');
        Route::post('receipts/{id}/cancel', [ReceiptController::class, 'cancel'])->name('receipts.cancel');

        // Notas de Crédito (NC)
        Route::resource('credit-notes', CreditNoteController::class);
        Route::post('credit-notes/{id}/confirm', [CreditNoteController::class, 'confirm'])->name('credit-notes.confirm');
        Route::post('credit-notes/{id}/cancel', [CreditNoteController::class, 'cancel'])->name('credit-notes.cancel');

        // Notas de Débito (ND)
        Route::resource('debit-notes', DebitNoteController::class);
        Route::post('debit-notes/{id}/confirm', [DebitNoteController::class, 'confirm'])->name('debit-notes.confirm');
        Route::post('debit-notes/{id}/cancel', [DebitNoteController::class, 'cancel'])->name('debit-notes.cancel');

        // Rotas de Clientes
        Route::resource('customers', CustomerController::class);

        // Documentos PDF e Email
        Route::get('documents/{id}/pdf', [DocumentController::class, 'downloadPdf'])->name('documents.pdf');
        Route::post('documents/{id}/send-email', [DocumentController::class, 'sendEmail'])->name('documents.send-email');
    });
    // POS
    Route::prefix('pos')->name('pos.')->group(function () {
        Route::get('/', [\App\Http\Controllers\Pos\PosController::class, 'index'])->name('index');
        
        Route::get('/shifts', [\App\Http\Controllers\Pos\PosShiftController::class, 'index'])->name('shifts.index');
        Route::get('/shifts/open', [\App\Http\Controllers\Pos\PosShiftController::class, 'create'])->name('shifts.create');
        Route::post('/shifts/open', [\App\Http\Controllers\Pos\PosShiftController::class, 'store'])->name('shifts.store');
        
        Route::get('/shifts/close', [\App\Http\Controllers\Pos\PosShiftController::class, 'showClose'])->name('shifts.showClose');
        Route::post('/shifts/{shift}/close', [\App\Http\Controllers\Pos\PosShiftController::class, 'close'])->name('shifts.close');
        
        Route::post('/sales', [\App\Http\Controllers\Pos\PosSaleController::class, 'store'])->name('sales.store');
    });

    // Users
    Route::post('/notifications/{id}/read', [\App\Http\Controllers\SystemNotificationController::class, 'markAsRead'])->name('notifications.read');

    // Configs
});

require __DIR__ . '/settings.php';
