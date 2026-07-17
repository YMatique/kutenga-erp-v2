<?php

namespace App\Services\Mail;

use App\Models\Company;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Mail;

class CompanyMailService
{
    /**
     * Retorna o mailer correto para emails de negócio da empresa.
     * Se a empresa tiver SMTP configurado, usa-o. Caso contrário, usa o mailer padrão da aplicação.
     */
    public function getMailerForCompany(Company $company): \Illuminate\Mail\Mailer
    {
        if (
            $company->smtp_host &&
            $company->smtp_port &&
            $company->smtp_username &&
            $company->smtp_password
        ) {
            $mailerName = 'company_smtp_' . $company->id;

            Config::set("mail.mailers.{$mailerName}", [
                'transport'  => 'smtp',
                'host'       => $company->smtp_host,
                'port'       => (int) $company->smtp_port,
                'username'   => $company->smtp_username,
                'password'   => $company->smtp_password,
                'encryption' => $company->smtp_encryption ?: 'tls',
                'timeout'    => 30,
            ]);

            return Mail::mailer($mailerName);
        }

        return Mail::mailer('smtp');
    }

    /**
     * Envia um Mailable usando o SMTP da empresa se disponível.
     */
    public function sendViaCompany(Company $company, \Illuminate\Mail\Mailable $mailable, string $to): void
    {
        $this->getMailerForCompany($company)->to($to)->send($mailable);
    }
}
