<?php

namespace App\Models;

use App\Services\Inventory\StockService;

class PaymentReceipt extends Document
{
    public function getInitialStatus(): string
    {
        return 'paid'; // Recibo é emitido já pago (é o comprovativo do pagamento)
    }

    public function getInitialPaymentStatus(): string
    {
        return 'paid';
    }

    public function processStock(StockService $stockService, Warehouse $warehouse): void
    {
        // Recibos não movimentam stock. A movimentação já foi feita na FT.
    }

    public function processFinancial(): void
    {
        // O saldo da conta corrente foi atualizado aquando da criação do Payment,
        // pelo que o Recibo em si não afeta saldos de forma isolada.
    }

    public function reverseStock(StockService $stockService, Warehouse $warehouse): void
    {
        // Recibos não movimentam stock.
    }

    public function reverseFinancial(): void
    {
        // O estorno de saldos será tratado se o pagamento for anulado.
    }
}
