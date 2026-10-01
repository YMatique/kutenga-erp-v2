<?php

namespace App\Console\Commands;

use App\Models\Company;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

/**
 * Simula a aplicação externa de gestão: envia um pedido assinado (HMAC) à API interna.
 * Serve para testar o fluxo e como exemplo de implementação do cliente.
 */
class SimulateSubscriptionEvent extends Command
{
    protected $signature = 'subscription:simulate
        {company : ID local ou external_id (UUID) da empresa}
        {--plan= : Código do plano (ex.: crescimento)}
        {--status= : active | suspended | cancelled | expired}
        {--ends= : Data de fim (ex.: 2026-12-31)}
        {--url= : URL base da aplicação (por omissão APP_URL)}';

    protected $description = 'Envia um evento de subscrição assinado para a API interna (simula a aplicação externa)';

    public function handle(): int
    {
        $secret = config('subscription.api.secret');

        if (!$secret) {
            $this->error('Defina SUBSCRIPTION_API_SECRET no .env.');

            return self::FAILURE;
        }

        $company = Company::where('external_id', $this->argument('company'))
            ->orWhere('id', $this->argument('company'))
            ->first();

        if (!$company) {
            $this->error('Empresa não encontrada.');

            return self::FAILURE;
        }

        $payload = array_filter([
            'plan' => $this->option('plan'),
            'status' => $this->option('status'),
            'ends_at' => $this->option('ends'),
        ], fn ($v) => $v !== null);

        $body = json_encode($payload);
        $timestamp = (string) time();
        $signature = hash_hmac('sha256', $timestamp . '.' . $body, $secret);
        $url = rtrim($this->option('url') ?: config('app.url'), '/') . "/api/internal/companies/{$company->external_id}/subscription";

        $response = Http::withHeaders([
            'X-Kutenga-Timestamp' => $timestamp,
            'X-Kutenga-Signature' => $signature,
            'Idempotency-Key' => (string) \Illuminate\Support\Str::uuid(),
            'Content-Type' => 'application/json',
        ])->withBody($body, 'application/json')->put($url);

        $this->line("PUT {$url} → HTTP {$response->status()}");
        $this->line(json_encode($response->json(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        return $response->successful() ? self::SUCCESS : self::FAILURE;
    }
}
