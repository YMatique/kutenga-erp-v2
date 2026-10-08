<?php

namespace App\Support;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use RuntimeException;

/**
 * Endereço de uma impressora de rede.
 *
 * O driver "network" faz o servidor abrir uma ligação TCP ao endereço guardado na caixa; sem
 * restrições isso permitiria sondar o próprio servidor, a rede interna ou o serviço de metadados
 * da cloud (169.254.169.254). Só se aceitam endereços de rede privada, nunca loopback/link-local.
 */
class PrinterHost implements ValidationRule
{
    /** @return list<string> */
    private static function resolve(string $host): array
    {
        if (filter_var($host, FILTER_VALIDATE_IP)) {
            return [$host];
        }

        if (! preg_match('/^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i', $host)) {
            return [];
        }

        return gethostbynamel($host) ?: [];
    }

    private static function isAllowed(string $ip): bool
    {
        // Rejeita sempre loopback, link-local, 0.0.0.0, multicast e reservados
        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_RES_RANGE) === false) {
            return false;
        }

        if (config('pos.allow_public_printer_hosts')) {
            return true;
        }

        // Fora de NO_PRIV_RANGE = rede privada
        return filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE) === false;
    }

    /**
     * Devolve o IP seguro para ligar. Resolver aqui (e ligar ao IP, não ao nome) impede que um
     * DNS que mude entre a validação e a ligação aponte para outro destino (DNS rebinding).
     */
    public static function safeIp(string $host): string
    {
        $ips = self::resolve(trim($host));

        if ($ips === []) {
            throw new RuntimeException('Não foi possível resolver o endereço da impressora.');
        }

        foreach ($ips as $ip) {
            if (! self::isAllowed($ip)) {
                throw new RuntimeException('O endereço da impressora não é permitido (use um IP da rede local).');
            }
        }

        return $ips[0];
    }

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        try {
            self::safeIp((string) $value);
        } catch (RuntimeException $e) {
            $fail($e->getMessage());
        }
    }
}
