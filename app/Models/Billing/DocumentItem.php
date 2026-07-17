<?php

namespace App\Models\Billing;

use App\Models\Catalog\Product;


use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DocumentItem extends Model
{
    protected $table = 'document_items';

    protected $fillable = [
        'document_id',
        'product_id',
        'product_name',
        'product_sku',
        'product_barcode',
        'description',
        'quantity',
        'unit_price',
        'tax_rate',
        'discount_percent',
        'total'
    ];

    protected $casts = [
        'quantity' => 'decimal:3',
        'unit_price' => 'decimal:2',
        'tax_rate' => 'decimal:2',
        'discount_percent' => 'decimal:2',
        'total' => 'decimal:2'
    ];

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class, 'document_id');
    }
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }
}
