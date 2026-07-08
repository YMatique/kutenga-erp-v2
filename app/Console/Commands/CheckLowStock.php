<?php

namespace App\Console\Commands;

use App\Models\Product;
use App\Models\SystemNotification;
use App\Models\Company;
use Illuminate\Console\Command;

class CheckLowStock extends Command
{
    protected $signature = 'app:check-low-stock';
    protected $description = 'Verifica produtos com stock abaixo do mínimo e gera notificações.';

    public function handle()
    {
        $companies = Company::all();
        $totalAlerts = 0;

        foreach ($companies as $company) {
            $products = Product::where('company_id', $company->id)
                ->where('track_stock', true)
                ->whereNotNull('min_stock')
                ->with('stocks')
                ->get();

            foreach ($products as $product) {
                $stock = $product->stocks->sum('quantity');

                if ($stock <= $product->min_stock) {
                    // Evitar duplicar notificações não lidas
                    $exists = SystemNotification::where('company_id', $product->company_id)
                        ->where('type', 'low_stock')
                        ->where('link', "/products/{$product->id}")
                        ->where('is_read', false)
                        ->exists();

                    if (!$exists) {
                        SystemNotification::create([
                            'company_id' => $product->company_id,
                            'type' => 'low_stock',
                            'title' => 'Stock Mínimo Atingido',
                            'message' => "O produto {$product->name} atingiu ou desceu abaixo do limite mínimo ({$product->min_stock}). Stock Atual: {$stock}.",
                            'link' => "/products/{$product->id}",
                            'is_read' => false,
                        ]);
                        $totalAlerts++;
                    }
                }
            }
        }

        $this->info("Verificação de stock concluída. {$totalAlerts} novos alertas gerados.");
    }
}
