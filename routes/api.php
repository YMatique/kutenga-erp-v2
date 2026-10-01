<?php

use App\Http\Controllers\Api\Internal\CompanySubscriptionController;
use App\Http\Middleware\VerifyServiceSignature;
use Illuminate\Support\Facades\Route;

// API interna (serviço-a-serviço). Autenticada por assinatura HMAC, sem sessão.
Route::prefix('internal')
    ->middleware([VerifyServiceSignature::class, 'throttle:60,1'])
    ->group(function () {
        Route::get('companies/{externalId}/subscription', [CompanySubscriptionController::class, 'show']);
        Route::put('companies/{externalId}/subscription', [CompanySubscriptionController::class, 'update']);
    });
