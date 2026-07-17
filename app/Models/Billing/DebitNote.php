<?php

namespace App\Models\Billing;

use App\Models\Inventory\Warehouse;


use App\Services\Inventory\StockService;

class DebitNote extends Document
{
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
        // Nota de débito não altera stock
    }

    public function processFinancial(): void
    {
        if ($this->customer_id) {
            $customer = Customer::findOrFail($this->customer_id);
            $customer->increment('balance', $this->grand_total);
        }
    }

    public function reverseFinancial(): void
    {
        if ($this->customer_id) {
            $customer = Customer::findOrFail($this->customer_id);
            $customer->decrement('balance', $this->grand_total);
        }
    }
}
