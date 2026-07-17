<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $request->user()?->load(['company.branches']),
            ],
            'subscription' => function () use ($request) {
                if (! $request->user()?->company) {
                    return null;
                }
                $company = $request->user()->company;
                return [
                    'plan' => $company->subscription_plan ?? 'inicial',
                    'status' => $company->subscription_status ?? 'active',
                    'ends_at' => $company->subscription_ends_at ? $company->subscription_ends_at->toIso8601String() : null,
                    'usage' => [
                        'documents_month' => $company->getCurrentMonthDocumentsCount(),
                        'products' => $company->getProductsCount(),
                        'warehouses' => $company->getWarehousesCount(),
                    ],
                    'limits' => $company->getSubscriptionLimits(),
                ];
            },
            'active_company_id' => session('current_company_id'),
            'active_branch_id' => session('current_branch_id'),
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'warning' => fn () => $request->session()->get('warning'),
                'info' => fn () => $request->session()->get('info'),
            ],
            'notifications' => function () use ($request) {
                if (! $request->user()) {
                    return [];
                }
                return \App\Models\SystemNotification::where('company_id', $request->user()->company_id)
                    ->where('is_read', false)
                    ->orderBy('created_at', 'desc')
                    ->limit(5)
                    ->get();
            },
        ];
    }
}
