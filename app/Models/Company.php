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
    ];

    protected $casts = [
        'bank_accounts' => 'array',
        'default_tax_rate' => 'decimal:2',
        'default_due_days' => 'integer',
        'notify_low_stock_email' => 'boolean',
        'notify_subscription_email' => 'boolean',
    ];

    public function branches(): HasMany
    {
        return $this->hasMany(Branch::class);
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }
}
