<?php

namespace App\Models;

use App\Services\Inventory\StockService;

class DeliveryNote extends Document
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
        // Guia de Remessa: dá baixa de stock no armazém
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
                        "Saída física automática decorrente da Guia de Remessa {$this->document_number}"
                    );
                }
            }
        }
    }

    public function processFinancial(): void
    {
        // Guia de remessa não tem impacto financeiro
    }

    public function reverseStock(StockService $stockService, Warehouse $warehouse): void
    {
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
                        "Entrada física automática por cancelamento da Guia de Remessa {$this->document_number}"
                    );
                }
            }
        }
    }

    public function reverseFinancial(): void
    {
        // Guia de remessa não tem impacto financeiro
    }
}
