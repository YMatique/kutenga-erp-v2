<?php

namespace App\Models;

use App\Traits\HasAudit;
use Exception;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Document extends Model
{
    use SoftDeletes, HasAudit;

    protected $table = 'documents';

    protected static $typeMap = [
        'FT' => Invoice::class,
        'FR' => Receipt::class,
        'CT' => Quote::class,
        'NC' => CreditNote::class,
        'ND' => DebitNote::class,
        'GR' => DeliveryNote::class,
    ];

    protected $fillable = [
        'company_id',
        'branch_id',
        'series_id',
        'customer_id',
        'customer_name',
        'customer_nuit',
        'customer_phone',
        'customer_email',
        'customer_address',
        'document_type',
        'document_number',
        'sequence_number',
        'status',
        'issue_date',
        'due_date',
        'subtotal',
        'tax_total',
        'discount_total',
        'grand_total',
        'currency_id',
        'exchange_rate',
        'payment_status',
        'source_module',
        'notes',
        'created_by',
        'updated_by'
    ];

    protected $casts = [
        'issue_date' => 'date',
        'due_date' => 'date',
        'subtotal' => 'decimal:2',
        'tax_total' => 'decimal:2',
        'discount_total' => 'decimal:2',
        'grand_total' => 'decimal:2',
        'exchange_rate' => 'decimal:6'
    ];

    // BOOT: Bloqueio contra mutabilidade indesejada após confirmação
    protected static function boot()
    {
        parent::boot();

        // Bloquear alterações se o documento estiver confirmado ou pago
        static::updating(function (Document $document) {
            if ($document->isDirty('status') && $document->getOriginal('status') === 'draft') {
                return true; // Permitir alteração de estado de Rascunho para Confirmado
            }

            if (in_array($document->getOriginal('status'), ['confirmed', 'paid', 'partial', 'cancelled'])) {
                throw new Exception("Regra de Imutabilidade Fiscal: Documentos emitidos/confirmados não podem ser alterados.");
            }
        });

        // Impedir eliminação física de documentos emitidos
        static::deleting(function (Document $document) {
            if (in_array($document->status, ['confirmed', 'paid', 'partial'])) {
                throw new Exception("Regra de Imutabilidade Fiscal: Não é permitido eliminar fisicamente documentos ativos.");
            }
        });
    }

    public function series(): BelongsTo
    {
        return $this->belongsTo(DocumentSeries::class, 'series_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(DocumentItem::class, 'document_id');
    }

    public function paymentAllocations(): HasMany
    {
        return $this->hasMany(PaymentAllocation::class, 'document_id');
    }
}
