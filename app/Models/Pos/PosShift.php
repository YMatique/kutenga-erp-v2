<?php

namespace App\Models\Pos;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Company;
use App\Models\Catalog\Branch;
use App\Models\User;
use App\Models\Billing\Document;

class PosShift extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'company_id',
        'branch_id',
        'cash_register_id',
        'user_id',
        'status',
        'opened_at',
        'closed_at',
        'starting_cash',
        'ending_cash',
        'expected_cash',
        'cash_difference',
        'payment_totals',
        'notes',
    ];

    protected $casts = [
        'opened_at' => 'datetime',
        'closed_at' => 'datetime',
        'starting_cash' => 'decimal:2',
        'ending_cash' => 'decimal:2',
        'expected_cash' => 'decimal:2',
        'cash_difference' => 'decimal:2',
        'payment_totals' => 'array',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function cashRegister(): BelongsTo
    {
        return $this->belongsTo(CashRegister::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class, 'pos_shift_id');
    }

    /**
     * Totais recebidos no turno por método de pagamento (exclui documentos cancelados).
     *
     * @return array{cash: float, card: float, transfer: float}
     */
    public function paymentTotals(): array
    {
        $rows = DB::table('payment_allocations as pa')
            ->join('payments as p', 'p.id', '=', 'pa.payment_id')
            ->join('documents as d', 'd.id', '=', 'pa.document_id')
            ->where('d.pos_shift_id', $this->id)
            ->whereNull('d.deleted_at')
            ->where('d.status', '!=', 'cancelled')
            ->groupBy('p.payment_method')
            ->selectRaw('p.payment_method as method, SUM(pa.amount_allocated) as total')
            ->pluck('total', 'method');

        return [
            'cash' => round((float) ($rows['cash'] ?? 0), 2),
            'card' => round((float) ($rows['card'] ?? 0), 2),
            'transfer' => round((float) ($rows['transfer'] ?? 0), 2),
        ];
    }
}
