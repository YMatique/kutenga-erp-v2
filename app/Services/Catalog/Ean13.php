<?php

namespace App\Services\Catalog;

use App\Models\Catalog\Product;

/**
 * EAN-13: dígito de controlo e geração de códigos internos.
 *
 * Os prefixos 20 a 29 são reservados pela GS1 a uso interno (circulação restrita), por
 * isso um código gerado aqui nunca colide com o de um fabricante.
 */
class Ean13
{
    private const PREFIX = '20';

    /** Dígito de controlo para os 12 primeiros dígitos. */
    public static function checkDigit(string $body): int
    {
        $sum = 0;

        foreach (str_split($body) as $i => $digit) {
            $sum += (int) $digit * ($i % 2 === 0 ? 1 : 3);
        }

        return (10 - $sum % 10) % 10;
    }

    public static function isValid(string $code): bool
    {
        return preg_match('/^\d{13}$/', $code) === 1
            && self::checkDigit(substr($code, 0, 12)) === (int) $code[12];
    }

    /** Próximo código interno livre da empresa (conta os produtos apagados, que mantêm o código). */
    public static function nextInternal(int $companyId): string
    {
        $last = Product::withoutGlobalScopes()->withTrashed()
            ->where('company_id', $companyId)
            ->where('barcode', 'like', self::PREFIX . '___________')
            ->orderByDesc('barcode')
            ->limit(50)
            ->pluck('barcode')
            ->first(fn (string $code) => self::isValid($code));

        $sequence = $last ? (int) substr($last, 2, 10) : 0;

        do {
            $sequence++;
            $body = self::PREFIX . str_pad((string) $sequence, 10, '0', STR_PAD_LEFT);
            $code = $body . self::checkDigit($body);
        } while (Product::withoutGlobalScopes()->withTrashed()->where('company_id', $companyId)->where('barcode', $code)->exists());

        return $code;
    }
}
