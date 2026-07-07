<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Documento Kutenga ERP</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 14px;
            color: #333333;
            line-height: 1.6;
            background-color: #f4f5f7;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 600px;
            background-color: #ffffff;
            padding: 30px;
            border-radius: 6px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.05);
            margin: 0 auto;
            border-top: 4px solid #2DB8A0;
        }
        .header {
            font-size: 22px;
            font-weight: bold;
            color: #1A2332;
            margin-bottom: 20px;
        }
        .header span {
            color: #2DB8A0;
        }
        .greeting {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 15px;
        }
        .details-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        .details-table td {
            padding: 8px 10px;
            border-bottom: 1px solid #eef0f2;
        }
        .details-label {
            color: #718096;
            font-weight: bold;
            width: 35%;
        }
        .details-value {
            font-weight: bold;
            color: #2d3748;
        }
        .footer {
            margin-top: 30px;
            font-size: 11px;
            color: #a0aec0;
            text-align: center;
            border-top: 1px solid #eef0f2;
            padding-top: 15px;
        }
    </style>
</head>
<body>
    @php
        $typeLabels = [
            'FT' => 'Fatura a Crédito',
            'FR' => 'Fatura-Recibo',
            'CT' => 'Cotação / Orçamento',
            'NC' => 'Nota de Crédito',
            'ND' => 'Nota de Débito',
            'GR' => 'Guia de Remessa',
        ];
        $label = $typeLabels[$document->document_type] ?? $document->document_type;
    @endphp

    <div class="container">
        <div class="header">Kutenga<span style="color: #2DB8A0;">ERP</span></div>

        <div class="greeting">Olá, {{ $document->customer_name }}</div>

        <p>Enviamos em anexo o seguinte documento comercial referente aos nossos serviços/produtos:</p>

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
            <tr>
                <td class="details-label">Valor Total:</td>
                <td class="details-value" style="color: #2DB8A0;">{{ number_format($document->grand_total, 2, ',', '.') }} MZN</td>
            </tr>
        </table>

        <p>Por favor, consulte o ficheiro PDF em anexo para visualizar os detalhes completos do documento.</p>

        <p>Se tiver alguma dúvida, não hesite em contactar-nos.</p>

        <div class="footer">
            Esta é uma mensagem automática enviada através do Kutenga ERP.<br>
            <strong>Kutenga Solutions Lda.</strong> • Av. 24 de Julho, Maputo • NUIT: 100200300
        </div>
    </div>
</body>
</html>
