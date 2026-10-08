<?php

use App\Http\Controllers\Settings\CompanySettingsController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\RoleController;
use App\Http\Controllers\Settings\SecurityController;
use App\Http\Controllers\Settings\SubscriptionController;
use App\Http\Controllers\Settings\UserController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->group(function () {
    Route::redirect('settings', '/settings/profile');

    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('settings/security', [SecurityController::class, 'edit'])->name('security.edit');

    Route::put('settings/password', [SecurityController::class, 'update'])
        ->middleware('throttle:6,1')
        ->name('user-password.update');

    Route::inertia('settings/appearance', 'settings/appearance')->name('appearance.edit');
});

Route::middleware(['auth', 'verified', 'role:Admin|owner'])->group(function () {
    Route::get('settings/company', [CompanySettingsController::class, 'edit'])->name('company-settings.edit');
    Route::post('settings/company', [CompanySettingsController::class, 'update'])->name('company-settings.update');
    Route::post('settings/company/test-smtp', [CompanySettingsController::class, 'testSmtp'])->name('company-settings.test-smtp');

    Route::get('settings/subscription', [SubscriptionController::class, 'edit'])->name('settings.subscription.edit');
    Route::post('settings/subscription/upgrade', [SubscriptionController::class, 'upgrade'])->name('settings.subscription.upgrade');

    Route::resource('settings/users', UserController::class)->except(['create', 'show', 'edit']);
    Route::resource('settings/roles', RoleController::class)->except(['create', 'show', 'edit']);
});
