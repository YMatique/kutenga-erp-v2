<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Plan extends Model
{
    /** Limites numéricos conhecidos (null = ilimitado). Uma chave em falta conta como 0. */
    public const LIMIT_KEYS = [
        'documents_month' => 'Documentos por mês',
        'products' => 'Artigos / serviços',
        'warehouses' => 'Armazéns',
        'cash_registers' => 'Caixas (POS)',
        'users' => 'Utilizadores',
    ];

    /** Funcionalidades ligadas/desligadas por plano. */
    public const FEATURE_KEYS = [
        'pos' => 'Ponto de Venda (POS)',
    ];

    protected $fillable = ['code', 'name', 'description', 'price_label', 'limits', 'features', 'is_active', 'sort_order'];

    protected $casts = [
        'limits' => 'array',
        'features' => 'array',
        'is_active' => 'boolean',
    ];
}
