<?php

namespace App\Exceptions;

use RuntimeException;

/** Saída de stock superior ao saldo disponível. */
class InsufficientStockException extends RuntimeException
{
    public function __construct(public readonly float $available)
    {
        parent::__construct("Stock insuficiente. Disponível: {$available}");
    }
}
