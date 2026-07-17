<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Aviso de Pagamento Pendente</title>

    <style>
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI',
                Roboto, Helvetica, Arial, sans-serif;
            font-size: 14px;
            color: #1e293b;
            line-height: 1.6;
            background-color: #f8fafc;
            margin: 0;
            padding: 24px;
        }

        .container {
            max-width: 600px;
            background: #ffffff;
            padding: 40px;
            border-radius: 12px;
            margin: auto;
            box-shadow: 0 4px 12px rgba(0, 0, 0, .03);
            border-top: 4px solid #d97706;
        }

        .header {
            padding-bottom: 20px;
            margin-bottom: 25px;
            border-bottom: 1px solid #f1f5f9;
        }

        .logo {
            max-height: 55px;
            margin-bottom: 12px;
        }

        .company-name {
            font-size: 22px;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: -.025em;
        }

        .alert-box {
            background: #fffbeb;
            border: 1px solid #fde68a;
            border-radius: 10px;
            padding: 18px;
            text-align: center;
            margin-bottom: 25px;
            color: #92400e;
        }

        .alert-box strong {
            display: block;
            font-size: 17px;
            margin-bottom: 5px;
        }

        .greeting {
            font-size: 18px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 15px;
        }

        .message {
            color: #334155;
            font-size: 15px;
            margin-bottom: 24px;
        }

        .amount-box {
            background: #fff7ed;
            border: 1px solid #fed7aa;
            border-radius: 10px;
            padding: 20px;
            text-align: center;
            margin: 25px 0;
        }

        .amount-box small {
            font-size: 12px;
            color: #9a3412;
            font-weight: 700;
            letter-spacing: .05em;
        }

        .amount-box div {
            margin-top: 6px;
            font-size: 28px;
            font-weight: 800;
            color: #c2410c;
        }

        .details-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 20px;
        }

        .details-table {
            width: 100%;
            border-collapse: collapse;
        }

        .details-table td {
            padding: 10px 0;
            border-bottom: 1px dashed #e2e8f0;
        }

        .details-table tr:last-child td {
            border-bottom: none;
        }

        .details-label {
            color: #64748b;
            font-weight: 600;
            width: 45%;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: .05em;
        }

        .details-value {
            text-align: right;
            font-weight: 600;
            color: #0f172a;
        }

        .overdue {
            color: #c2410c;
        }

        .button {
            display: inline-block;
            background: #d97706;
            color: #ffffff;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 700;
            margin-top: 10px;
        }

        .footer {
            margin-top: 40px;
            padding-top: 24px;
            border-top: 1px solid #f1f5f9;
            text-align: center;
            font-size: 12px;
            color: #64748b;
            line-height: 1.8;
        }

        .footer-company {
            font-size: 14px;
            font-weight: 700;
            color: #334155;
            margin-bottom: 8px;
        }

        .system-info {
            margin-top: 16px;
            font-size: 10px;
            color: #94a3b8;
        }
    </style>
</head>

<body>

    <div class="container">

        @php
            $daysLate = $document->due_date
                ? now()->diffInDays($document->due_date)
                : null;
        @endphp


        <div class="header">

            @if($document->company?->logo_path)
                <img src="{{ asset('storage/' . $document->company->logo_path) }}" class="logo" alt="Logo">
            @endif

            <div class="company-name">
                {{ $document->company->name ?? config('app.name') }}
            </div>

        </div>


        <div class="alert-box">

            <strong>
                ⚠ Pagamento pendente
            </strong>

            A fatura abaixo encontra-se vencida e aguarda regularização.

        </div>


        <div class="greeting">
            Olá, {{ $document->customer_name }}
        </div>


        <p class="message">

            Verificámos que a fatura indicada abaixo ainda não consta como
            liquidada no nosso sistema.

            Gostaríamos de relembrar o seu vencimento e solicitar a
            regularização do pagamento.

        </p>



        <div class="amount-box">

            <small>
                VALOR PENDENTE
            </small>

            <div>
                {{ number_format($document->grand_total, 2, ',', '.') }} MZN
            </div>

        </div>



        <div class="details-card">

            <table class="details-table">

                <tr>
                    <td class="details-label">
                        Fatura Nº
                    </td>

                    <td class="details-value">
                        {{ $document->document_number }}
                    </td>
                </tr>


                <tr>
                    <td class="details-label">
                        Data Emissão
                    </td>

                    <td class="details-value">
                        {{ $document->issue_date?->format('d/m/Y') ?? '—' }}
                    </td>
                </tr>


                <tr>
                    <td class="details-label">
                        Vencimento
                    </td>

                    <td class="details-value overdue">
                        {{ $document->due_date?->format('d/m/Y') ?? '—' }}
                    </td>
                </tr>


                @if($daysLate)

                    <tr>
                        <td class="details-label">
                            Dias em atraso
                        </td>

                        <td class="details-value overdue">
                            {{ $daysLate }} dias
                        </td>
                    </tr>

                @endif


            </table>

        </div>



        <p class="message" style="margin-top:25px;">

            Caso o pagamento já tenha sido efetuado, agradecemos que
            desconsidere esta mensagem ou envie o respetivo comprovativo
            para atualização dos nossos registos.

        </p>


        <p class="message">

            Para qualquer esclarecimento, estamos à disposição.

        </p>



        <div class="footer">

            <div class="footer-company">
                {{ $document->company->name ?? config('app.name') }}
            </div>


            @if($document->company?->address)
                <div>
                    {{ $document->company->address }}
                </div>
            @endif


            @if($document->company?->nuit)
                <div>
                    <strong>NUIT:</strong>
                    {{ $document->company->nuit }}
                </div>
            @endif


            @if($document->company?->phone)
                <div>
                    <strong>Telefone:</strong>
                    {{ $document->company->phone }}
                </div>
            @endif


            @if($document->company?->email)
                <div>
                    <strong>Email:</strong>
                    {{ $document->company->email }}
                </div>
            @endif


            <div class="system-info">
                Mensagem automática enviada pelo sistema de faturação
                de {{ $document->company->name ?? config('app.name') }}.
            </div>

        </div>


    </div>

</body>

</html>