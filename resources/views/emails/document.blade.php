<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $document->company->name ?? 'Documento Comercial' }}</title>

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
            border-top: 4px solid #10b981;
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

        .hero {
            background: #f8fafc;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 24px;
        }

        .hero h2 {
            margin: 0 0 8px;
            font-size: 18px;
            color: #0f172a;
        }

        .hero p {
            margin: 0;
            color: #475569;
        }

        .badge {
            display: inline-block;
            background: #ecfdf5;
            color: #059669;
            padding: 6px 12px;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            margin-bottom: 20px;
        }

        .message {
            color: #334155;
            font-size: 15px;
            margin-bottom: 24px;
        }

        .amount-box {
            text-align: center;
            background: #ecfdf5;
            padding: 20px;
            border-radius: 10px;
            margin: 25px 0;
        }

        .amount-box small {
            color: #64748b;
            font-size: 12px;
            font-weight: 600;
            letter-spacing: .05em;
        }

        .amount-box div {
            margin-top: 5px;
            font-size: 28px;
            font-weight: 800;
            color: #059669;
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
            font-weight: 500;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: .05em;
        }

        .details-value {
            text-align: right;
            font-weight: 600;
            color: #0f172a;
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

    @php
        $typeLabels = [
            'FT' => 'Fatura',
            'FR' => 'Fatura-Recibo',
            'CT' => 'Cotação / Orçamento',
            'NC' => 'Nota de Crédito',
            'ND' => 'Nota de Débito',
            'GR' => 'Guia de Remessa',
        ];

        $label = $typeLabels[$document->document_type] ?? $document->document_type;
    @endphp


    <div class="container">

        <div class="header">

            @if($document->company?->logo_path)
                <img src="{{ asset('storage/' . $document->company->logo_path) }}" class="logo" alt="Logo">
            @endif

            <div class="company-name">
                {{ $document->company->name ?? config('app.name') }}
            </div>

        </div>


        <div class="hero">

            <span class="badge">
                {{ $label }}
            </span>

            <h2>
                Olá, {{ $document->customer_name }}
            </h2>

            <p>
                O seu documento comercial foi emitido com sucesso
                e encontra-se anexado neste email.
            </p>

        </div>


        <div class="amount-box">

            <small>
                VALOR TOTAL
            </small>

            <div>
                {{ number_format($document->grand_total, 2, ',', '.') }} MZN
            </div>

        </div>


        <p class="message">
            Seguem abaixo os detalhes principais do documento:
        </p>


        <div class="details-card">

            <table class="details-table">

                @if($document->document_number)
                    <tr>
                        <td class="details-label">
                            Documento Nº
                        </td>

                        <td class="details-value">
                            {{ $document->document_number }}
                        </td>
                    </tr>
                @endif


                <tr>
                    <td class="details-label">
                        Data Emissão
                    </td>

                    <td class="details-value">
                        {{ $document->issue_date?->format('d/m/Y') ?? '—' }}
                    </td>
                </tr>


                @if($document->document_type !== 'GR' && $document->document_type !== 'FR')

                    <tr>
                        <td class="details-label">
                            Vencimento
                        </td>

                        <td class="details-value">
                            {{ $document->due_date?->format('d/m/Y') ?? '—' }}
                        </td>
                    </tr>

                @endif


            </table>

        </div>


        <p class="message" style="margin-top:25px;">
            Consulte o ficheiro PDF anexado para visualizar todos
            os detalhes do documento.
        </p>


        <p class="message">
            Caso tenha alguma dúvida, não hesite em contactar-nos.
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