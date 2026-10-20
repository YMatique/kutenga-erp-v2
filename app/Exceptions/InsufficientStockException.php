<?php

namespace App\Exceptions;

use RuntimeException;

/** Saída de stock superior ao disponível (saldo menos o reservado por transferências aprovadas). */
class InsufficientStockException extends RuntimeException
{
    public function __construct(public readonly float $available)
    {
        parent::__construct("Stock insuficiente. Disponível: {$available}");
    }
}
