<?php

namespace App\Support;

use Carbon\CarbonImmutable;
use DateTimeInterface;

/**
 * O "agora" e o "hoje" do negócio.
 *
 * A aplicação corre em UTC (é como os instantes gravados são lidos), mas para quem trabalha em Maputo
 * o dia vira às 00:00 locais, duas horas antes. Tudo o que é "hoje", "este mês" ou "a data por defeito"
 * deve vir daqui, e não de `today()`/`now()`, para não dar o dia errado ao fim da tarde e à noite.
 */
class BusinessTime
{
    public static function timezone(): string
    {
        return config('app.business_timezone');
    }

    public static function now(): CarbonImmutable
    {
        return CarbonImmutable::now(self::timezone());
    }

    /** Um instante gravado (UTC) visto na hora do negócio, para mostrar a hora certa em talões e relatórios. */
    public static function local(DateTimeInterface $moment): CarbonImmutable
    {
        return CarbonImmutable::instance($moment)->setTimezone(self::timezone());
    }

    /** Início do dia de hoje no fuso do negócio. */
    public static function today(): CarbonImmutable
    {
        return self::now()->startOfDay();
    }

    /** A data de hoje (Y-m-d) no fuso do negócio. */
    public static function date(): string
    {
        return self::today()->toDateString();
    }
}
