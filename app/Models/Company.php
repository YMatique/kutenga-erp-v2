<?php

namespace App\Models;

use App\Models\Billing\Document;
// use App\Traits\HasAudit;
use App\Models\Catalog\Branch;
use App\Models\Catalog\Product;
use App\Models\Inventory\Warehouse;
use App\Models\Pos\CashRegister;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Company extends Model
{
    use HasFactory, SoftDeletes /* , HasAudit */;

    protected $fillable = [
        'name',
        'nuit',
        'email',
        'phone',
        'address',
        'logo_path',
        'stamp_path',
        'status',
        'default_tax_rate',
        'default_currency',
        'default_due_days',
        'invoice_prefix',
        'quote_prefix',
        'receipt_prefix',
        'thermal_paper_width',
        'receipt_footer',
        'bank_accounts',
        'smtp_host',
        'smtp_port',
        'smtp_username',
        'smtp_password',
        'smtp_encryption',
        'notify_low_stock_email',
        'notify_subscription_email',
        'notify_document_emission_email',
        'notify_payment_received_email',
        'subscription_plan',
        'subscription_status',
        'subscription_ends_at',
        'limits_override',
    ];

    /** Nunca serializar a palavra-passe SMTP (as props Inertia levam a empresa a todos os utilizadores). */
    protected $hidden = ['smtp_password'];

    protected $casts = [
        'smtp_password' => 'encrypted',
        'bank_accounts' => 'array',
        'default_tax_rate' => 'decimal:2',
        'default_due_days' => 'integer',
        'notify_low_stock_email' => 'boolean',
        'notify_subscription_email' => 'boolean',
        'notify_document_emission_email' => 'boolean',
        'notify_payment_received_email' => 'boolean',
        'subscription_ends_at' => 'datetime',
        'limits_override' => 'array',
    ];

    /**
     * Documentos emitidos no mês corrente, para o limite do plano.
     *
     * Contam os documentos que já têm numeração (tudo menos rascunhos), incluindo os cancelados,
     * que consumiram um número. Os recibos de pagamento (RC) são consequência automática de um
     * pagamento e não contam: o limite nunca pode impedir o registo de um pagamento recebido.
     */
    public function getCurrentMonthDocumentsCount(): int
    {
        return Document::withoutGlobalScope('company')
            ->where('company_id', $this->id)
            ->where('status', '!=', 'draft')
            ->where('document_type', '!=', 'RC')
            ->whereBetween('created_at', [now()->startOfMonth(), now()->endOfMonth()])
            ->count();
    }

    public function getProductsCount(): int
    {
        return Product::where('company_id', $this->id)->count();
    }

    public function getWarehousesCount(): int
    {
        return Warehouse::where('company_id', $this->id)->count();
    }

    public function getCashRegistersCount(): int
    {
        return CashRegister::where('company_id', $this->id)->count();
    }

    public function getUsersCount(): int
    {
        return User::where('company_id', $this->id)->count();
    }

    /** Uso atual de cada limite numérico (mesmas chaves de Plan::LIMIT_KEYS). */
    public function usage(string $key): int
    {
        return match ($key) {
            'documents_month' => $this->getCurrentMonthDocumentsCount(),
            'products' => $this->getProductsCount(),
            'warehouses' => $this->getWarehousesCount(),
            'cash_registers' => $this->getCashRegistersCount(),
            'users' => $this->getUsersCount(),
            default => 0,
        };
    }

    // ── Plano e limites (a fonte de verdade é a tabela `plans`) ───────────────

    public function plan(): ?Plan
    {
        $code = $this->subscription_plan ?? 'inicial';

        return $this->resolvedPlan ??= Plan::where('code', $code)->first();
    }

    /** Limites efetivos: os do plano com as exceções da empresa por cima. */
    public function limits(): array
    {
        $limits = [];

        foreach (array_keys(Plan::LIMIT_KEYS) as $key) {
            // Chave em falta no plano = 0 (negado): um limite novo nunca fica aberto por esquecimento
            $limits[$key] = 0;
        }

        $limits = array_merge($limits, $this->plan()?->limits ?? [], $this->limits_override ?? []);

        return $limits;
    }

    /** Limite numérico (null = ilimitado). */
    public function limit(string $key): ?int
    {
        $limits = $this->limits();

        // `??` não serve: null significa ilimitado e chave em falta significa 0
        if (! array_key_exists($key, $limits)) {
            return 0;
        }

        return $limits[$key] === null ? null : (int) $limits[$key];
    }

    /** O plano permite criar mais um recurso deste tipo? */
    public function withinLimit(string $key): bool
    {
        $limit = $this->limit($key);

        return $limit === null || $this->usage($key) < $limit;
    }

    public function can(string $feature): bool
    {
        return (bool) ($this->plan()?->features[$feature] ?? false);
    }

    /**
     * Estado efetivo da subscrição:
     *  active    — dentro do prazo (ou plano sem fim);
     *  grace     — prazo terminado há menos de N dias: só leitura;
     *  expired   — prazo e tolerância terminados;
     *  suspended — suspensa ou cancelada pela aplicação de gestão: bloqueio imediato.
     */
    public function subscriptionState(): string
    {
        if (in_array($this->subscription_status, ['suspended', 'cancelled'], true)) {
            return 'suspended';
        }

        if ($this->subscription_status === 'expired') {
            return 'expired';
        }

        if (! $this->subscription_ends_at || now()->lte($this->subscription_ends_at)) {
            return 'active';
        }

        return now()->lte($this->graceEndsAt()) ? 'grace' : 'expired';
    }

    public function graceEndsAt(): ?CarbonInterface
    {
        return $this->subscription_ends_at?->copy()->addDays((int) config('subscription.grace_days', 7));
    }

    /** Bloqueio total (sem acesso além de subscrição e logout). */
    public function isSubscriptionExpired(): bool
    {
        return in_array($this->subscriptionState(), ['expired', 'suspended'], true);
    }

    /** Em tolerância: pode consultar, mas não criar nem emitir. */
    public function isSubscriptionReadOnly(): bool
    {
        return $this->subscriptionState() === 'grace';
    }

    /** Compatibilidade com o código existente (chaves antigas incluídas). */
    public function getSubscriptionLimits(): array
    {
        return $this->limits() + ['pos_enabled' => $this->can('pos')];
    }

    protected static function booted(): void
    {
        static::creating(function (Company $company) {
            $company->external_id ??= (string) Str::uuid();
        });

        // O plano em cache deixa de valer quando a empresa muda de plano
        static::saved(fn (Company $company) => $company->resolvedPlan = null);
    }

    protected ?Plan $resolvedPlan = null;

    public function branches(): HasMany
    {
        return $this->hasMany(Branch::class);
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }
}
