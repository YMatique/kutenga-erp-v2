<?php

namespace App\Models;

// use App\Traits\HasAudit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Company extends Model
{
    use SoftDeletes /* , HasAudit */;

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
    ];

    protected $casts = [
        'bank_accounts' => 'array',
        'default_tax_rate' => 'decimal:2',
        'default_due_days' => 'integer',
        'notify_low_stock_email' => 'boolean',
        'notify_subscription_email' => 'boolean',
        'notify_document_emission_email' => 'boolean',
        'notify_payment_received_email' => 'boolean',
        'subscription_ends_at' => 'datetime',
    ];

    public function getCurrentMonthDocumentsCount(): int
    {
        return \App\Models\Document::where('company_id', $this->id)
            ->whereBetween('created_at', [now()->startOfMonth(), now()->endOfMonth()])
            ->count();
    }

    public function getProductsCount(): int
    {
        return \App\Models\Product::where('company_id', $this->id)->count();
    }

    public function getWarehousesCount(): int
    {
        return \App\Models\Warehouse::where('company_id', $this->id)->count();
    }

    public function isSubscriptionExpired(): bool
    {
        if ($this->subscription_status === 'expired') {
            return true;
        }

        if ($this->subscription_ends_at && now()->gt($this->subscription_ends_at)) {
            return true;
        }

        return false;
    }

    public function getSubscriptionLimits(): array
    {
        $plan = $this->subscription_plan ?? 'inicial';

        switch ($plan) {
            case 'crescimento':
                return [
                    'documents_month' => null, // ilimitado
                    'products' => null, // ilimitado
                    'warehouses' => 5,
                    'pos_enabled' => true,
                ];
            case 'empresarial':
                return [
                    'documents_month' => null, // ilimitado
                    'products' => null, // ilimitado
                    'warehouses' => null, // ilimitado
                    'pos_enabled' => true,
                ];
            case 'inicial':
            default:
                return [
                    'documents_month' => 50,
                    'products' => 100,
                    'warehouses' => 1,
                    'pos_enabled' => false,
                ];
        }
    }

    public function branches(): HasMany
    {
        return $this->hasMany(Branch::class);
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }
}
