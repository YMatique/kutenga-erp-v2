<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Autentica pedidos de aplicações internas (ex.: gestão de subscrições).
 *
 * Cabeçalhos exigidos:
 *   X-Kutenga-Timestamp  segundos Unix do momento do pedido
 *   X-Kutenga-Signature  hex(HMAC-SHA256(timestamp + "." + corpo_bruto, SUBSCRIPTION_API_SECRET))
 */
class VerifyServiceSignature
{
    public function handle(Request $request, Closure $next): Response
    {
        // API: erros de validação e 404 sempre em JSON
        $request->headers->set('Accept', 'application/json');

        $secret = config('subscription.api.secret');

        if (!$secret) {
            return response()->json(['error' => 'API desativada: SUBSCRIPTION_API_SECRET não configurado.'], 503);
        }

        $timestamp = $request->header('X-Kutenga-Timestamp');
        $signature = (string) $request->header('X-Kutenga-Signature');

        if (!ctype_digit((string) $timestamp)
            || abs(time() - (int) $timestamp) > config('subscription.api.tolerance')) {
            return response()->json(['error' => 'Timestamp inválido ou expirado.'], 401);
        }

        $expected = hash_hmac('sha256', $timestamp . '.' . $request->getContent(), $secret);

        if (!hash_equals($expected, $signature)) {
            return response()->json(['error' => 'Assinatura inválida.'], 401);
        }

        return $next($request);
    }
}
