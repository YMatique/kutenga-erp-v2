<?php

namespace App\Services\Subscription;

use App\Models\Company;
use App\Models\Plan;
use App\Models\SubscriptionEvent;
use App\Models\SystemNotification;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Único ponto onde o plano/estado de uma empresa é alterado.
 * Usado pela API interna, pelo painel do super admin e pelas tarefas agendadas.
 */
class SubscriptionService
{
    public const STATUSES = ['active', 'suspended', 'cancelled', 'expired'];

    /**
     * Aplica uma alteração de subscrição.
     *
     * @param  array{plan?: string, status?: string, ends_at?: ?string, limits_override?: ?array}  $data
     * @return array{event: SubscriptionEvent, replayed: bool}
     */
    public function apply(Company $company, array $data, string $source, ?string $eventId = null): array
    {
        // Idempotência: o mesmo event_id nunca é aplicado duas vezes
        if ($eventId && ($existing = SubscriptionEvent::where('event_id', $eventId)->first())) {
            return ['event' => $existing, 'replayed' => true];
        }

        return DB::transaction(function () use ($company, $data, $source, $eventId) {
            $previousPlan = $company->subscription_plan;
            $previousStatus = $company->subscription_status;

            $changes = [];

            if (isset($data['plan'])) {
                abort_unless(Plan::where('code', $data['plan'])->where('is_active', true)->exists(), 422, 'Plano desconhecido.');
                $changes['subscription_plan'] = $data['plan'];
            }

            if (isset($data['status'])) {
                $changes['subscription_status'] = $data['status'];
            }

            if (array_key_exists('ends_at', $data)) {
                $changes['subscription_ends_at'] = $data['ends_at'] ? Carbon::parse($data['ends_at']) : null;
            }

            if (array_key_exists('limits_override', $data)) {
                $changes['limits_override'] = $data['limits_override'] ?: null;
            }

            // Reativar sem indicar nova data de fim limpa o estado "expirado"
            if (($data['status'] ?? null) === 'active' && ! array_key_exists('ends_at', $data)
                && $company->subscription_ends_at && $company->subscription_ends_at->isPast()) {
                $changes['subscription_ends_at'] = null;
            }

            $company->update($changes);

            $event = SubscriptionEvent::create([
                'company_id' => $company->id,
                'event_id' => $eventId,
                'source' => $source,
                'previous_plan' => $previousPlan,
                'plan' => $company->subscription_plan,
                'previous_status' => $previousStatus,
                'status' => $company->subscription_status,
                'ends_at' => $company->subscription_ends_at,
                'payload' => $data,
            ]);

            $this->notify($company, $previousPlan, $previousStatus);

            return ['event' => $event, 'replayed' => false];
        });
    }

    /** Estado completo da subscrição (usado pela API e pelas páginas). */
    public function snapshot(Company $company): array
    {
        $company->refresh();
        $limits = $company->limits();

        return [
            'company_id' => $company->external_id,
            'plan' => $company->subscription_plan,
            'status' => $company->subscription_status,
            'state' => $company->subscriptionState(),
            'ends_at' => $company->subscription_ends_at?->toIso8601String(),
            'grace_ends_at' => $company->graceEndsAt()?->toIso8601String(),
            'limits' => $limits,
            'features' => ['pos' => $company->can('pos')],
            'usage' => collect(array_keys($limits))->mapWithKeys(fn ($k) => [$k => $company->usage($k)])->all(),
        ];
    }

    private function notify(Company $company, ?string $previousPlan, ?string $previousStatus): void
    {
        $planChanged = $previousPlan !== $company->subscription_plan;
        $statusChanged = $previousStatus !== $company->subscription_status;

        if (! $planChanged && ! $statusChanged) {
            return;
        }

        $blocked = in_array($company->subscription_status, ['suspended', 'cancelled', 'expired'], true);

        SystemNotification::create([
            'company_id' => $company->id,
            'type' => 'subscription',
            'title' => $blocked ? 'Subscrição '.($company->subscription_status === 'expired' ? 'Expirada' : 'Suspensa') : 'Subscrição Atualizada',
            'message' => $blocked
                ? 'O acesso da empresa foi limitado. Contacte o suporte para regularizar a subscrição.'
                : 'O plano da empresa é agora '.ucfirst($company->subscription_plan)
                    .($company->subscription_ends_at ? ', válido até '.$company->subscription_ends_at->format('d/m/Y').'.' : '.'),
            'link' => '/settings/subscription',
            'is_read' => false,
        ]);
    }
}
