<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Symfony\Component\Mailer\Transport;
use Symfony\Component\Mailer\Mailer;
use Symfony\Component\Mime\Email;

class CompanySettingsController extends Controller
{
    public function edit(Request $request)
    {
        $company = $request->user()->company;
        
        return Inertia::render('settings/company', [
            'company' => $company
        ]);
    }

    public function update(Request $request)
    {
        $company = $request->user()->company;

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'nuit' => 'nullable|string|max:50|unique:companies,nuit,' . $company->id,
            'email' => 'nullable|email|max:255|unique:companies,email,' . $company->id,
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'default_tax_rate' => 'nullable|numeric|min:0|max:100',
            'default_currency' => 'nullable|string|max:3',
            'default_due_days' => 'nullable|integer|min:0',
            'invoice_prefix' => 'nullable|string|max:10',
            'quote_prefix' => 'nullable|string|max:10',
            'receipt_prefix' => 'nullable|string|max:10',
            'bank_accounts' => 'nullable|array',
            'bank_accounts.*.bank_name' => 'required_with:bank_accounts|string|max:255',
            'bank_accounts.*.account_number' => 'required_with:bank_accounts|string|max:255',
            'bank_accounts.*.iban' => 'nullable|string|max:255',
            'smtp_host' => 'nullable|string|max:255',
            'smtp_port' => 'nullable|integer',
            'smtp_username' => 'nullable|string|max:255',
            'smtp_password' => 'nullable|string|max:255',
            'smtp_encryption' => 'nullable|string|max:10',
            'logo' => 'nullable|image|max:2048',
            'stamp' => 'nullable|image|max:2048',
            'notify_low_stock_email' => 'nullable|boolean',
            'notify_subscription_email' => 'nullable|boolean',
            'notify_document_emission_email' => 'nullable|boolean',
            'notify_payment_received_email' => 'nullable|boolean',
        ]);

        if ($request->hasFile('logo')) {
            if ($company->logo_path) {
                Storage::disk('public')->delete($company->logo_path);
            }
            $validated['logo_path'] = $request->file('logo')->store('companies/logos', 'public');
        }

        if ($request->hasFile('stamp')) {
            if ($company->stamp_path) {
                Storage::disk('public')->delete($company->stamp_path);
            }
            $validated['stamp_path'] = $request->file('stamp')->store('companies/stamps', 'public');
        }

        unset($validated['logo']);
        unset($validated['stamp']);

        $company->update($validated);

        return back()->with('success', 'Configurações da empresa atualizadas com sucesso.');
    }

    public function testSmtp(Request $request)
    {
        $request->validate([
            'smtp_host' => 'required|string',
            'smtp_port' => 'required|integer',
            'smtp_username' => 'required|string',
            'smtp_password' => 'required|string',
            'smtp_encryption' => 'nullable|string',
        ]);

        try {
            $dsn = sprintf(
                'smtp://%s:%s@%s:%s',
                urlencode($request->smtp_username),
                urlencode($request->smtp_password),
                $request->smtp_host,
                $request->smtp_port
            );

            $transport = Transport::fromDsn($dsn);
            $mailer = new Mailer($transport);

            $email = (new Email())
                ->from($request->smtp_username)
                ->to($request->user()->email)
                ->subject('Kutenga ERP - Teste de Ligação SMTP')
                ->text('Se estás a ler este email, a ligação SMTP da tua empresa foi configurada com sucesso!');

            $mailer->send($email);

            return back()->with('success', 'Conexão SMTP estabelecida com sucesso. Foi enviado um email de teste para ' . $request->user()->email);
        } catch (\Exception $e) {
            return back()->withErrors(['smtp' => 'Falha ao ligar ao servidor SMTP: ' . $e->getMessage()]);
        }
    }
}
