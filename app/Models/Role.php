<?php

namespace App\Models;

use Spatie\Permission\Contracts\Role as RoleContract;
use Spatie\Permission\Exceptions\RoleAlreadyExists;
use Spatie\Permission\Guard;
use Spatie\Permission\Models\Role as SpatieRole;

/**
 * Papéis do sistema (`company_id` nulo, partilhados) e papéis criados por cada empresa.
 *
 * O Spatie assume nomes únicos em toda a aplicação; aqui a unicidade é por empresa, e as
 * pesquisas por nome sem empresa (ex.: `assignRole('Admin')`) só encontram papéis do sistema.
 * Para atribuir um papel de uma empresa passe a instância e não o nome.
 */
class Role extends SpatieRole
{
    public static function create(array $attributes = [])
    {
        $attributes['guard_name'] ??= Guard::getDefaultName(static::class);

        $params = [
            'name' => $attributes['name'],
            'guard_name' => $attributes['guard_name'],
            'company_id' => $attributes['company_id'] ?? null,
        ];

        if (static::findByParam($params)) {
            throw RoleAlreadyExists::create($attributes['name'], $attributes['guard_name']);
        }

        return static::query()->create($attributes);
    }

    protected static function findByParam(array $params = []): ?RoleContract
    {
        $companyId = $params['company_id'] ?? null;
        unset($params['company_id']);

        $query = static::query()->when(
            $companyId === null,
            fn ($q) => $q->whereNull('company_id'),
            fn ($q) => $q->where('company_id', $companyId),
        );

        foreach ($params as $key => $value) {
            $query->where($key, $value);
        }

        return $query->first();
    }
}
