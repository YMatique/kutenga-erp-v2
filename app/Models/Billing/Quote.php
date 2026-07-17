<?php

namespace App\Models\Billing;

use App\Models\Inventory\Warehouse;


use App\Services\Inventory\StockService;

class Quote extends Document
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
        // Cotação/Orçamento não movimenta stock
    }

    public function processFinancial(): void
    {
        // Cotação/Orçamento não gera impacto financeiro
    }
    
}
