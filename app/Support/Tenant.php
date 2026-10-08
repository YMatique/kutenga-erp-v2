<?php

namespace App\Support;

use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Exists;

class Tenant
{
    /**
     * Regra `exists` limitada à empresa do utilizador autenticado.
     *
     * A regra `exists:tabela,coluna` consulta a tabela diretamente e ignora os scopes
     * globais dos modelos, aceitando por isso IDs de outras empresas.
     */
    public static function exists(string $table, string $column = 'id'): Exists
    {
        return Rule::exists($table, $column)->where('company_id', auth()->user()?->company_id);
    }
}
