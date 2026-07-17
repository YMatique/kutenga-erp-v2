<?php

namespace App\Console\Commands;

use App\Models\Billing\Document;
use App\Models\SystemNotification;
use App\Mail\InvoiceOverdueMail;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class CheckDocumentStatus extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:check-document-status';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Verifica faturas e cotações expiradas e atualiza o estado para "overdue" (Em Atraso), notificando clientes e o sistema';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $today = Carbon::today();
        $this->info("Iniciando verificação de documentos expirados para a data: {$today->toDateString()}");

        // 1. Verificar Faturas (FT) em atraso (vencidas)
        // Faturas que não estão pagas (unpaid ou partial), ativas (status in confirmed, partial), e due_date < hoje
        $overdueInvoices = Document::where('document_type', 'FT')
            ->whereIn('status', ['confirmed', 'partial'])
            ->whereIn('payment_status', ['unpaid', 'partial'])
            ->where('due_date', '<', $today)
            ->get();

        $updatedInvoices = 0;
        foreach ($overdueInvoices as $invoice) {
            $invoice->status = 'overdue';
            $invoice->save();
            $updatedInvoices++;

            // Criar notificação interna no sistema
            SystemNotification::create([
                'company_id' => $invoice->company_id,
                'type' => 'invoice_overdue',
                'title' => 'Fatura em Atraso',
                'message' => "A fatura {$invoice->document_number} para {$invoice->customer_name} no valor de " . number_format($invoice->grand_total, 2, ',', '.') . " MZN venceu a " . ($invoice->due_date ? $invoice->due_date->format('d/m/Y') : '—') . ".",
                'link' => "/billing/invoices/{$invoice->id}",
                'is_read' => false,
            ]);

            // Enviar e-mail de aviso de atraso ao cliente (enfileirado via queue worker)
            if ($invoice->customer_email) {
                try {
                    Mail::to($invoice->customer_email)->send(new InvoiceOverdueMail($invoice));
                    Log::info("E-mail de cobrança enfileirado para {$invoice->customer_email} referente à fatura #{$invoice->id}");
                } catch (\Exception $e) {
                    Log::error("Erro ao enfileirar e-mail de cobrança para a fatura #{$invoice->id}: " . $e->getMessage());
                }
            }
            
            Log::info("Fatura #{$invoice->id} ({$invoice->document_number}) marcada como Em Atraso (overdue). Vencimento: {$invoice->due_date->toDateString()}");
        }

        // 1.5 Verificar Faturas (FT) prestes a expirar (3 dias)
        $warningDate = $today->copy()->addDays(3);
        $expiringInvoices = Document::where('document_type', 'FT')
            ->whereIn('status', ['confirmed', 'partial'])
            ->whereIn('payment_status', ['unpaid', 'partial'])
            ->whereDate('due_date', '=', $warningDate)
            ->get();

        $warnedInvoices = 0;
        foreach ($expiringInvoices as $invoice) {
            $exists = SystemNotification::where('company_id', $invoice->company_id)
                ->where('type', 'invoice_expiring')
                ->where('link', "/billing/invoices/{$invoice->id}")
                ->exists();

            if (!$exists) {
                SystemNotification::create([
                    'company_id' => $invoice->company_id,
                    'type' => 'invoice_expiring',
                    'title' => 'Fatura Prestes a Expirar',
                    'message' => "A fatura {$invoice->document_number} para {$invoice->customer_name} no valor de " . number_format($invoice->grand_total, 2, ',', '.') . " MZN expira em 3 dias (" . $invoice->due_date->format('d/m/Y') . ").",
                    'link' => "/billing/invoices/{$invoice->id}",
                    'is_read' => false,
                ]);
                $warnedInvoices++;
            }
        }

        // 2. Verificar Cotações (CT) expiradas
        // Cotações que estão em status 'confirmed' (ou seja, ativas) e due_date < hoje
        $overdueQuotes = Document::where('document_type', 'CT')
            ->where('status', 'confirmed')
            ->where('due_date', '<', $today)
            ->get();

        $updatedQuotes = 0;
        foreach ($overdueQuotes as $quote) {
            $quote->status = 'overdue';
            $quote->save();
            $updatedQuotes++;

            // Criar notificação interna no sistema para cotação expirada
            SystemNotification::create([
                'company_id' => $quote->company_id,
                'type' => 'quote_expired',
                'title' => 'Cotação Expirada',
                'message' => "A cotação {$quote->document_number} para {$quote->customer_name} expirou a " . ($quote->due_date ? $quote->due_date->format('d/m/Y') : '—') . ".",
                'link' => "/billing/quotes/{$quote->id}",
                'is_read' => false,
            ]);
            
            Log::info("Cotação #{$quote->id} ({$quote->document_number}) marcada como Expirada/Em Atraso (overdue). Vencimento: {$quote->due_date->toDateString()}");
        }

        $this->info("Verificação concluída. Faturas atualizadas: {$updatedInvoices}. Cotações atualizadas: {$updatedQuotes}. Alertas de expiração: {$warnedInvoices}.");
    }
}
