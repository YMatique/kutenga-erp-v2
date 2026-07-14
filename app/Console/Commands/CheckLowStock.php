<?php

namespace App\Console\Commands;

use App\Models\Product;
use App\Models\SystemNotification;
use App\Models\Company;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use App\Mail\LowStockAlertMail;

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
                ->with('stocks')
                ->get();

            foreach ($products as $product) {
                $stock = $product->stocks->sum('quantity');

                if ($stock <= 0) {
                    // Out of stock
                    $exists = SystemNotification::where('company_id', $product->company_id)
                        ->where('type', 'out_of_stock')
                        ->where('link', "/products/{$product->id}")
                        ->where('is_read', false)
                        ->exists();

                    if (!$exists) {
                        SystemNotification::create([
                            'company_id' => $product->company_id,
                            'type' => 'out_of_stock',
                            'title' => 'Stock Esgotado',
                            'message' => "O produto {$product->name} esgotou em todos os armazéns. Stock Atual: 0.",
                            'link' => "/products/{$product->id}",
                            'is_read' => false,
                        ]);
                        $totalAlerts++;

                        if ($company->notify_low_stock_email && $company->email) {
                            try {
                                Mail::to($company->email)->send(new LowStockAlertMail($product, 0));
                            } catch (\Exception $e) {
                                \Illuminate\Support\Facades\Log::error("Erro ao enviar email de stock esgotado para {$company->email}: " . $e->getMessage());
                            }
                        }
                    }

                    // Resolve low stock alert
                    SystemNotification::where('company_id', $product->company_id)
                        ->where('type', 'low_stock')
                        ->where('link', "/products/{$product->id}")
                        ->where('is_read', false)
                        ->update(['is_read' => true]);

                } elseif (!is_null($product->min_stock) && $stock <= $product->min_stock) {
                    // Low stock
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

                        if ($company->notify_low_stock_email && $company->email) {
                            try {
                                Mail::to($company->email)->send(new LowStockAlertMail($product, $stock));
                            } catch (\Exception $e) {
                                \Illuminate\Support\Facades\Log::error("Erro ao enviar email de stock mínimo para {$company->email}: " . $e->getMessage());
                            }
                        }
                    }

                    // Resolve out of stock alert
                    SystemNotification::where('company_id', $product->company_id)
                        ->where('type', 'out_of_stock')
                        ->where('link', "/products/{$product->id}")
                        ->where('is_read', false)
                        ->update(['is_read' => true]);

                } else {
                    // Healthy stock -> resolve both alerts
                    SystemNotification::where('company_id', $product->company_id)
                        ->whereIn('type', ['low_stock', 'out_of_stock'])
                        ->where('link', "/products/{$product->id}")
                        ->where('is_read', false)
                        ->update(['is_read' => true]);
                }
            }
        }

        $this->info("Verificação de stock concluída. {$totalAlerts} novos alertas gerados.");
    }
}
