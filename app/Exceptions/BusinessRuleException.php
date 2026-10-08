<?php

namespace App\Exceptions;

use DomainException;

/**
 * Regra de negócio violada (limite do plano, subscrição expirada, documento já emitido...).
 *
 * A mensagem é escrita para o utilizador e pode ser mostrada tal como está; qualquer outra
 * exceção (SQL, I/O, bugs) é apenas registada e o utilizador vê uma mensagem genérica.
 */
class BusinessRuleException extends DomainException {}
