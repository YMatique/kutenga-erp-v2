<?php

namespace App\Models;

use App\Services\Inventory\StockService;

class Receipt extends Document
{
    public function getInitialStatus(): string
    {
        return 'paid';
    }

    public function getInitialPaymentStatus(): string
    {
        return 'paid';
    }

    public function processStock(StockService $stockService, Warehouse $warehouse): void
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
                        "Saída física automática decorrente da emissão da Fatura-Recibo {$this->document_number}"
                    );
                }
            }
        }
    }

    public function processFinancial(): void
    {
        // Fatura-Recibo é paga a pronto pagamento e não gera dívida em conta-corrente
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
                        "Entrada física automática por cancelamento da Fatura-Recibo {$this->document_number}"
                    );
                }
            }
        }
    }

    public function reverseFinancial(): void
    {
        // Fatura-Recibo não altera saldo de conta corrente de crédito
    }
}
