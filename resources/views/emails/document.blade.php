<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $document->company->name ?? 'Documento Comercial' }}</title>
    <style>
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            font-size: 14px;
            color: #1e293b;
            line-height: 1.6;
            background-color: #f8fafc;
            margin: 0;
            padding: 24px;
        }
        .container {
            max-width: 600px;
            background-color: #ffffff;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
            margin: 0 auto;
            border-top: 4px solid #10b981;
        }
        .header {
            margin-bottom: 32px;
            border-bottom: 1px solid #f1f5f9;
            padding-bottom: 20px;
        }
        .company-name {
            font-size: 22px;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: -0.025em;
        }
        .greeting {
            font-size: 18px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 16px;
        }
        .message {
            color: #334155;
            font-size: 15px;
            margin-bottom: 24px;
        }
        .details-card {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin: 24px 0;
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
            padding-bottom: 0;
        }
        .details-table tr:first-child td {
            padding-top: 0;
        }
        .details-label {
            color: #64748b;
            font-weight: 500;
            width: 40%;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        .details-value {
            font-weight: 600;
            color: #0f172a;
            text-align: right;
        }
        .total-row .details-value {
            color: #10b981;
            font-size: 18px;
            font-weight: 700;
        }
        .footer {
            margin-top: 40px;
            font-size: 12px;
            color: #64748b;
            text-align: center;
            border-top: 1px solid #f1f5f9;
            padding-top: 24px;
            line-height: 1.8;
        }
        .footer-company {
            font-weight: 700;
            color: #334155;
            font-size: 13px;
            margin-bottom: 6px;
        }
        .system-info {
            font-size: 10px;
            color: #94a3b8;
            margin-top: 16px;
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
            <div class="company-name">{{ $document->company->name ?? config('app.name') }}</div>
        </div>

        <div class="greeting">Olá, {{ $document->customer_name }}</div>

        <p class="message">Enviamos em anexo o seguinte documento comercial referente aos nossos serviços/produtos:</p>

        <div class="details-card">
            <table class="details-table">
                <tr>
                    <td class="details-label">Documento:</td>
                    <td class="details-value">{{ $label }}</td>
                </tr>
                @if($document->document_number)
                <tr>
                    <td class="details-label">Número:</td>
                    <td class="details-value">{{ $document->document_number }}</td>
                </tr>
                @endif
                <tr>
                    <td class="details-label">Data de Emissão:</td>
                    <td class="details-value">{{ $document->issue_date ? $document->issue_date->format('d/m/Y') : '—' }}</td>
                </tr>
                @if($document->document_type !== 'GR' && $document->document_type !== 'FR')
                <tr>
                    <td class="details-label">Vencimento:</td>
                    <td class="details-value">{{ $document->due_date ? $document->due_date->format('d/m/Y') : '—' }}</td>
                </tr>
                @endif
                <tr class="total-row">
                    <td class="details-label">Valor Total:</td>
                    <td class="details-value">{{ number_format($document->grand_total, 2, ',', '.') }} MZN</td>
                </tr>
            </table>
        </div>

        <p class="message">Por favor, consulte o ficheiro PDF em anexo para visualizar os detalhes completos do documento.</p>
        <p class="message" style="margin-bottom: 0;">Se tiver alguma dúvida, não hesite em contactar-nos.</p>

        <div class="footer">
            <div class="footer-company">{{ $document->company->name ?? config('app.name') }}</div>
            @if($document->company && $document->company->address)
                {{ $document->company->address }} <br>
            @endif
            @if($document->company && $document->company->nuit)
                <strong>NUIT:</strong> {{ $document->company->nuit }} 
            @endif
            @if($document->company && $document->company->phone)
                • <strong>Tel:</strong> {{ $document->company->phone }} 
            @endif
            @if($document->company && $document->company->email)
                • <strong>Email:</strong> {{ $document->company->email }}
            @endif
            
            <div class="system-info">
                Esta é uma mensagem automática enviada a partir do sistema de faturação de {{ $document->company->name ?? config('app.name') }}.
            </div>
        </div>
    </div>
</body>
</html>
