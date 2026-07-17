<?php

namespace App\Models\Billing;

use App\Models\Inventory\Warehouse;
use App\Models\Catalog\Product;


use App\Services\Inventory\StockService;

class CreditNote extends Document
{
    public function getInitialStatus(): string
    {
        return 'confirmed';
    }

    public function getInitialPaymentStatus(): string
    {
        return 'none';
    }

    public function processStock(StockService $stockService, Warehouse $warehouse): void
    {
        // Devolução: dá entrada de stock de volta ao armazém
        foreach ($this->items as $item) {
            if ($item->product_id) {
                $product = Product::findOrFail($item->product_id);
                if ($product->track_stock) {
                    $stockService->in(
                        $product,
                        $warehouse,
                        (float) $item->quantity,
                        'document',
                        $this->id,
                        "Entrada física automática (devolução) decorrente da Nota de Crédito {$this->document_number}"
                    );
                }
            }
        }
    }

    public function processFinancial(): void
    {
        if ($this->customer_id) {
            $customer = Customer::findOrFail($this->customer_id);
            $customer->decrement('balance', $this->grand_total);
        }
    }

    public function reverseStock(StockService $stockService, Warehouse $warehouse): void
    {
        foreach ($this->items as $item) {
            if ($item->product_id) {
                $product = Product::findOrFail($item->product_id);
                if ($product->track_stock) {
                    $stockService->out(
                        $product,
                        $warehouse,
                        (float) $item->quantity,
                        'document',
                        $this->id,
                        "Saída física automática por cancelamento da Nota de Crédito {$this->document_number}"
                    );
                }
            }
        }
    }

    public function reverseFinancial(): void
    {
        if ($this->customer_id) {
            $customer = Customer::findOrFail($this->customer_id);
            $customer->increment('balance', $this->grand_total);
        }
    }
}
