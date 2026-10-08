<?php

namespace App\Http\Controllers\Api\Internal;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Plan;
use App\Services\Subscription\SubscriptionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * API interna para a aplicação externa de gestão de subscrições.
 * Ver docs/api-subscricoes.md para o contrato e exemplos de assinatura.
 */
class CompanySubscriptionController extends Controller
{
    public function __construct(private SubscriptionService $subscriptions) {}

    public function show(string $externalId): JsonResponse
    {
        $company = Company::where('external_id', $externalId)->firstOrFail();

        return response()->json($this->subscriptions->snapshot($company));
    }

    public function update(Request $request, string $externalId): JsonResponse
    {
        $company = Company::where('external_id', $externalId)->firstOrFail();

        $limitRules = collect(array_keys(Plan::LIMIT_KEYS))
            ->mapWithKeys(fn ($key) => ["limits_override.$key" => 'nullable|integer|min:0'])
            ->all();

        $validated = $request->validate([
            'plan' => ['sometimes', 'string', Rule::exists('plans', 'code')->where('is_active', true)],
            'status' => ['sometimes', Rule::in(SubscriptionService::STATUSES)],
            'ends_at' => 'sometimes|nullable|date',
            'limits_override' => 'sometimes|nullable|array',
        ] + $limitRules);

        // validated() descarta chaves sem regra; as desconhecidas têm de ser recusadas, não ignoradas
        if (is_array($request->input('limits_override'))) {
            $unknown = array_diff(array_keys($request->input('limits_override')), array_keys(Plan::LIMIT_KEYS));
            abort_if($unknown, 422, 'Limites desconhecidos: '.implode(', ', $unknown));
        }

        // Idempotency-Key: reenviar o mesmo pedido devolve o resultado sem reaplicar
        $result = $this->subscriptions->apply($company, $validated, 'api', $request->header('Idempotency-Key'));

        return response()->json($this->subscriptions->snapshot($company) + ['replayed' => $result['replayed']]);
    }
}
