<?php

use App\Http\Controllers\ContextController;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
    Route::post('context/switch', [ContextController::class, 'switch'])->name('context.switch');
});

require __DIR__.'/settings.php';
