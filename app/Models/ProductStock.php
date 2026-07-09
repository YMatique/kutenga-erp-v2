<?php

namespace App\Models;

use App\Traits\BelongsToCompany;
// use App\Traits\HasAudit;
use Illuminate\Database\Eloquent\Model;

class ProductStock extends Model
{
        use BelongsToCompany;// /* , HasAudit */;
    //
    protected $fillable = [
        'company_id',
        'product_id',
        'warehouse_id',
        'quantity'
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }
}
