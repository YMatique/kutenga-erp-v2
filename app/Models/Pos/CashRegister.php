<?php

namespace App\Models\Pos;

use App\Models\Billing\DocumentSeries;
use App\Models\Catalog\Branch;
use App\Models\Company;
use App\Models\Inventory\Warehouse;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class CashRegister extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'company_id',
        'branch_id',
        'warehouse_id',
        'series_id',
        'name',
        'is_active',
        'printer_driver',
        'printer_name',
        'printer_host',
        'printer_port',
        'paper_width',
        'open_drawer',
        'auto_print',
    ];

    public const PRINTER_DRIVERS = ['browser', 'qz', 'network'];

    protected $casts = [
        'is_active' => 'boolean',
        'open_drawer' => 'boolean',
        'auto_print' => 'boolean',
        'printer_port' => 'integer',
        'paper_width' => 'integer',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function series(): BelongsTo
    {
        return $this->belongsTo(DocumentSeries::class, 'series_id');
    }

    public function shifts(): HasMany
    {
        return $this->hasMany(PosShift::class);
    }

    /**
     * Série própria desta caixa para o ano corrente (criada na primeira venda do ano).
     * As vendas do POS têm numeração independente da faturação.
     */
    public function currentSeries(int $userId): DocumentSeries
    {
        $year = (int) date('Y');
        $code = 'P' . $this->id;

        $series = DocumentSeries::firstOrCreate(
            ['company_id' => $this->company_id, 'code' => $code, 'year' => $year],
            [
                'name' => 'POS ' . $this->name . ' ' . $year,
                'scope' => 'pos',
                'next_number' => 1,
                'is_active' => true,
                'created_by' => $userId,
            ]
        );

        if ($this->series_id !== $series->id) {
            $this->update(['series_id' => $series->id]);
        }

        return $series;
    }

    public function openShift(): ?PosShift
    {
        return $this->shifts()->where('status', 'open')->first();
    }

    /**
     * Devolve a caixa principal da empresa, criando-a se ainda não existir nenhuma.
     * Garante que empresas com uma única caixa não precisam de configuração.
     */
    public static function ensureDefault(int $companyId, ?int $preferredBranchId = null): ?self
    {
        if (self::where('company_id', $companyId)->exists()) {
            return null;
        }

        $branchId = Branch::where('company_id', $companyId)
            ->when($preferredBranchId, fn ($q) => $q->orderByRaw('id = ? desc', [$preferredBranchId]))
            ->orderBy('id')
            ->value('id');

        if (!$branchId) {
            return null;
        }

        return self::create([
            'company_id' => $companyId,
            'branch_id' => $branchId,
            'name' => 'Caixa Principal',
        ]);
    }
}
