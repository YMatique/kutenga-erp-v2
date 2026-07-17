<?php

namespace App\Models;

// use App\Traits\HasAudit;
use Exception;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Services\Inventory\StockService;
use App\Models\Warehouse;

use Spatie\Activitylog\Models\Concerns\LogsActivity;
use Spatie\Activitylog\Support\LogOptions;

class Document extends Model
{
    use SoftDeletes /* , HasAudit */, LogsActivity;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logAll()
            ->logOnlyDirty()
            ->dontLogEmptyChanges();
    }

    protected $table = 'documents';

    protected static $typeMap = [
        'FT' => Invoice::class,
        'FR' => Receipt::class,
        'CT' => Quote::class,
        'NC' => CreditNote::class,
        'ND' => DebitNote::class,
        'GR' => DeliveryNote::class,
        'RC' => PaymentReceipt::class,
    ];

    /**
     * Instancia dinamicamente a subclasse correta com base no document_type.
     */
    public function newFromBuilder($attributes = [], $connection = null)
    {
        $type = is_object($attributes) ? ($attributes->document_type ?? null) : ($attributes['document_type'] ?? null);
        $class = static::$typeMap[$type] ?? static::class;

        $model = new $class;
        $model->exists = true;
        $model->setRawAttributes((array) $attributes, true);
        $model->setConnection($connection ?: $this->getConnectionName());
        $model->fireModelEvent('retrieved', false);
        return $model;
    }

    /**
     * Instancia dinamicamente a subclasse correta com base no document_type para novos registos.
     */
    public function newInstance($attributes = [], $exists = false)
    {
        $type = is_object($attributes) ? ($attributes->document_type ?? null) : ($attributes['document_type'] ?? null);
        if (!$type) {
            $type = $this->document_type ?? null;
        }
        $class = static::$typeMap[$type] ?? static::class;

        $model = new $class((array) $attributes);
        $model->exists = $exists;
        $model->setConnection($this->getConnectionName());
        return $model;
    }

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
        'referenced_document_id',
        'pos_shift_id',
        'created_by',
        'updated_by'
    ];

    protected $appends = ['has_physical_products'];

    protected $casts = [
        'issue_date' => 'date',
        'due_date' => 'date',
        'subtotal' => 'decimal:2',
        'tax_total' => 'decimal:2',
        'discount_total' => 'decimal:2',
        'grand_total' => 'decimal:2',
        'exchange_rate' => 'decimal:6'
    ];

    public function getHasPhysicalProductsAttribute(): bool
    {
        return $this->items()->whereHas('product', function ($query) {
            $query->where('track_stock', true);
        })->exists();
    }

    // BOOT: Bloqueio contra mutabilidade indesejada após confirmação e configuração de STI
    protected static function boot()
    {
        parent::boot();

        // Configuração de STI para subclasses
        if (static::class !== self::class) {
            $type = array_search(static::class, static::$typeMap);
            if ($type) {
                static::addGlobalScope('document_type', function ($builder) use ($type) {
                    $builder->where('document_type', $type);
                });

                static::creating(function ($model) use ($type) {
                    $model->document_type = $type;
                });
            }
        }

        // Bloquear alterações se o documento estiver confirmado ou pago
        static::updating(function (Document $document) {
            if ($document->isDirty('status') && $document->getOriginal('status') === 'draft') {
                return true; // Permitir alteração de estado de Rascunho para Confirmado
            }

            if (in_array($document->getOriginal('status'), ['confirmed', 'paid', 'partial', 'cancelled'])) {
                // Permitir atualizar apenas campos de estado, controle e timestamps de auditoria
                $allowedChanges = ['status', 'payment_status', 'updated_at', 'updated_by', 'cancelled_by'];
                $dirtyFields = array_keys($document->getDirty());
                $unallowedDirty = array_diff($dirtyFields, $allowedChanges);

                if (count($unallowedDirty) > 0) {
                    throw new Exception("Regra de Imutabilidade Fiscal: Documentos emitidos/confirmados não podem ter seus dados alterados.");
                }
            }
        });

        // Impedir eliminação física de documentos emitidos
        static::deleting(function (Document $document) {
            if (in_array($document->status, ['confirmed', 'paid', 'partial'])) {
                throw new Exception("Regra de Imutabilidade Fiscal: Não é permitido eliminar fisicamente documentos ativos.");
            }
        });
    }

    /**
     * Métodos Polimórficos de STI
     */
    public function getInitialStatus(): string
    {
        return 'confirmed';
    }

    public function getInitialPaymentStatus(): string
    {
        return 'unpaid';
    }

    public function processStock(StockService $stockService, Warehouse $warehouse): void
    {
        // Por padrão, não faz nada
    }

    public function processFinancial(): void
    {
        // Por padrão, não faz nada
    }

    public function reverseStock(StockService $stockService, Warehouse $warehouse): void
    {
        // Por padrão, não faz nada
    }

    public function reverseFinancial(): void
    {
        // Por padrão, não faz nada
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
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function referencedDocument(): BelongsTo
    {
        return $this->belongsTo(Document::class, 'referenced_document_id');
    }

    public function rectifiedDocuments(): HasMany
    {
        return $this->hasMany(Document::class, 'referenced_document_id');
    }

    public function posShift(): BelongsTo
    {
        return $this->belongsTo(PosShift::class, 'pos_shift_id');
    }
}
