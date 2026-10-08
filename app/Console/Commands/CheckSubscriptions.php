<?php

namespace App\Console\Commands;

use App\Models\Company;
use App\Models\SystemNotification;
use App\Services\Subscription\SubscriptionService;
use Illuminate\Console\Command;

class CheckSubscriptions extends Command
{
    protected $signature = 'subscription:check';

    protected $description = 'Avisa as empresas antes do fim da subscrição e marca como expiradas as que terminaram a tolerância';

    public function handle(SubscriptionService $subscriptions): int
    {
        $warned = 0;
        $expired = 0;

        Company::whereNotNull('subscription_ends_at')
            ->whereIn('subscription_status', ['active', 'expired'])
            ->get()
            ->each(function (Company $company) use ($subscriptions, &$warned, &$expired) {
                // 1. Fim do prazo e da tolerância: regista a expiração
                if ($company->subscription_status === 'active' && $company->subscriptionState() === 'expired') {
                    $subscriptions->apply($company, ['status' => 'expired'], 'system');
                    $expired++;

                    return;
                }

                // 2. Avisos 7, 3 e 1 dias antes do fim
                $days = (int) now()->startOfDay()->diffInDays($company->subscription_ends_at->copy()->startOfDay(), false);

                if (in_array($days, config('subscription.warning_days'), true) && $company->subscriptionState() === 'active') {
                    $link = '/settings/subscription';
                    $already = SystemNotification::where('company_id', $company->id)
                        ->where('type', 'subscription_warning')
                        ->whereDate('created_at', today())
                        ->exists();

                    if (! $already) {
                        SystemNotification::create([
                            'company_id' => $company->id,
                            'type' => 'subscription_warning',
                            'title' => 'Subscrição a terminar',
                            'message' => "A subscrição termina em {$days} ".($days === 1 ? 'dia' : 'dias').'. Renove para não perder o acesso.',
                            'link' => $link,
                            'is_read' => false,
                        ]);
                        $warned++;
                    }
                }
            });

        $this->info("Avisos enviados: {$warned}. Subscrições expiradas: {$expired}.");

        return self::SUCCESS;
    }
}
