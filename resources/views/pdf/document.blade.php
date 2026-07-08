<!DOCTYPE html>
<html lang="pt-PT">
<head>
    <meta charset="UTF-8">
    <title>{{ $document->document_type }} {{ $document->document_number ?? 'Rascunho' }}</title>
    <style>
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 11px;
            color: #333333;
            line-height: 1.4;
            margin: 0;
            padding: 0;
        }
        .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
        }
        .header-logo {
            font-size: 20px;
            font-weight: bold;
            color: #1A2332;
            text-transform: uppercase;
        }
        .header-logo span {
            color: #2DB8A0;
        }
        .header-issuer {
            font-size: 10px;
            color: #666666;
            margin-top: 5px;
        }
        .header-title-box {
            text-align: right;
        }
        .document-type-title {
            font-size: 16px;
            font-weight: bold;
            color: #1A2332;
            margin: 0;
            text-transform: uppercase;
        }
        .document-number {
            font-family: 'Courier', monospace;
            font-size: 14px;
            font-weight: bold;
            color: #2DB8A0;
            margin: 5px 0;
        }
        .document-meta {
            font-size: 10px;
            color: #666666;
        }
        .divider {
            border-top: 1px solid #E2E8F0;
            margin: 15px 0;
        }
        .parties-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        .party-box {
            width: 50%;
            vertical-align: top;
        }
        .party-title {
            font-size: 9px;
            font-weight: bold;
            color: #94A3B8;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
        }
        .party-name {
            font-size: 12px;
            font-weight: bold;
            color: #1A2332;
        }
        .party-details {
            font-size: 10px;
            color: #4A5568;
            margin-top: 4px;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
        }
        .items-table th {
            background-color: #F8FAFC;
            border-bottom: 1px solid #E2E8F0;
            color: #475569;
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
            padding: 8px 10px;
            text-align: left;
        }
        .items-table td {
            border-bottom: 1px solid #F1F5F9;
            padding: 10px;
            vertical-align: middle;
        }
        .item-row-num {
            color: #94A3B8;
            font-size: 10px;
            width: 5%;
        }
        .item-desc {
            font-weight: bold;
            color: #1A2332;
            font-size: 10px;
        }
        .item-sku {
            font-family: 'Courier', monospace;
            font-size: 9px;
            color: #94A3B8;
            margin-top: 2px;
        }
        .text-right {
            text-align: right;
        }
        .font-mono {
            font-family: 'Courier', monospace;
        }
        .summary-wrapper-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        .summary-table {
            width: 45%;
            margin-left: auto;
            border-collapse: collapse;
        }
        .summary-table td {
            padding: 5px 8px;
            font-size: 10px;
        }
        .summary-label {
            color: #64748B;
            text-align: right;
        }
        .summary-value {
            text-align: right;
            font-weight: bold;
            color: #1A2332;
            width: 40%;
        }
        .total-row {
            background-color: #F8FAFC;
            border-top: 1px solid #E2E8F0;
            border-bottom: 2px double #1A2332;
        }
        .total-label {
            font-size: 11px;
            font-weight: bold;
            color: #1A2332;
        }
        .total-value {
            font-size: 13px;
            font-weight: bold;
            color: #2DB8A0;
        }
        .notes-box {
            margin-top: 40px;
            padding: 10px 12px;
            background-color: #F8FAFC;
            border-left: 3px solid #E2E8F0;
            border-radius: 2px;
        }
        .notes-title {
            font-size: 9px;
            font-weight: bold;
            color: #64748B;
            text-transform: uppercase;
            margin-bottom: 4px;
        }
        .notes-content {
            font-size: 9px;
            color: #4A5568;
            white-space: pre-wrap;
        }
        .footer {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            text-align: center;
            border-t: 1px solid #E2E8F0;
            padding-top: 10px;
            font-size: 9px;
            color: #94A3B8;
        }
        .footer-logo {
            font-weight: bold;
            color: #1A2332;
            margin-bottom: 2px;
        }
        .badge-draft {
            background-color: #FEF3C7;
            color: #D97706;
            border: 1px solid #FCD34D;
            padding: 2px 5px;
            border-radius: 3px;
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
            display: inline-block;
        }
        .badge-cancelled {
            background-color: #FEE2E2;
            color: #DC2626;
            border: 1px solid #FCA5A5;
            padding: 2px 5px;
            border-radius: 3px;
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
            display: inline-block;
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
    @endphp

    <!-- HEADER -->
    <table class="header-table">
        <tr>
            <td style="width: 50%; vertical-align: top;">
                @if($document->company && $document->company->logo_path && file_exists(storage_path('app/public/' . $document->company->logo_path)))
                    <div style="margin-bottom: 8px;">
                        <img src="{{ storage_path('app/public/' . $document->company->logo_path) }}" style="max-height: 50px; max-width: 150px; object-fit: contain;">
                    </div>
                @else
                    <div class="header-logo">{{ $document->company ? $document->company->name : 'Kutenga' }}<span>ERP</span></div>
                @endif
                <div class="header-issuer">
                    @if($document->company)
                        <strong>{{ $document->company->name }}</strong><br>
                        {{ $document->company->address }}<br>
                        NUIT: {{ $document->company->nuit }}
                    @else
                        <strong>Kutenga Solutions Lda.</strong><br>
                        Av. 24 de Julho, Maputo<br>
                        Moçambique<br>
                        NUIT: 100200300
                    @endif
                </div>
            </td>
            <td class="header-title-box" style="width: 50%; vertical-align: top;">
                <h1 class="document-type-title">{{ $typeLabels[$document->document_type] ?? $document->document_type }}</h1>
                <div class="document-number">
                    {{ $document->document_number ?? 'RASCUNHO' }}
                </div>
                <div class="document-meta">
                    <strong>Data Emissão:</strong> {{ $document->issue_date ? $document->issue_date->format('d/m/Y') : '—' }}<br>
                    @if($document->document_type !== 'GR' && $document->document_type !== 'FR')
                        <strong>Vencimento:</strong> {{ $document->due_date ? $document->due_date->format('d/m/Y') : '—' }}<br>
                    @endif
                    @if($document->series)
                        <strong>Série:</strong> {{ $document->series->code }}
                    @endif
                </div>

                @if($document->status === 'draft')
                    <div style="margin-top: 10px;">
                        <span class="badge-draft">Rascunho (Sem Valor Fiscal)</span>
                    </div>
                @elseif($document->status === 'cancelled')
                    <div style="margin-top: 10px;">
                        <span class="badge-cancelled">Documento Cancelado</span>
                    </div>
                @endif
            </td>
        </tr>
    </table>

    <div class="divider"></div>

    <!-- PARTIES -->
    <table class="parties-table">
        <tr>
            <td class="party-box" style="width: 50%;">
                <div class="party-title">Entidade Emitente</div>
                @if($document->company)
                    <div class="party-name">{{ $document->company->name }}</div>
                    <div class="party-details">
                        {{ $document->company->address }}<br>
                        @if($document->company->phone)
                            Tel: {{ $document->company->phone }}<br>
                        @endif
                        @if($document->company->email)
                            Email: {{ $document->company->email }}<br>
                        @endif
                        NUIT: {{ $document->company->nuit }}
                    </div>
                @else
                    <div class="party-name">Kutenga Solutions Lda.</div>
                    <div class="party-details">
                        Av. 24 de Julho, Maputo<br>
                        Tel: +258 84 000 0000<br>
                        Email: financeiro@kutenga.co<br>
                        NUIT: 100200300
                    </div>
                @endif
            </td>
            <td class="party-box" style="width: 50%; padding-left: 20px;">
                <div class="party-title">{{ $document->document_type === 'CT' ? 'Cliente' : 'Faturado A' }}</div>
                <div class="party-name">{{ $document->customer_name }}</div>
                <div class="party-details">
                    NUIT: {{ $document->customer_nuit }}<br>
                    @if($document->customer_address)
                        Endereço: {{ $document->customer_address }}<br>
                    @endif
                    @if($document->customer_phone)
                        Tel: {{ $document->customer_phone }}<br>
                    @endif
                    @if($document->customer_email)
                        Email: {{ $document->customer_email }}<br>
                    @endif
                </div>
            </td>
        </tr>
    </table>

    <!-- ITEMS TABLE -->
    <table class="items-table">
        <thead>
            <tr>
                <th class="item-row-num">#</th>
                <th style="width: {{ $document->document_type === 'CT' ? '55%' : '45%' }};">Descrição</th>
                <th class="text-right" style="width: 10%;">Qtd</th>
                <th class="text-right" style="width: 15%;">Preço Unit.</th>
                @if($document->document_type !== 'CT')
                    <th class="text-right" style="width: 10%;">Desc.</th>
                @endif
                <th class="text-right" style="width: 10%;">IVA</th>
                <th class="text-right" style="width: 15%;">Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($document->items as $index => $item)
                <tr>
                    <td class="item-row-num">{{ $index + 1 }}</td>
                    <td>
                        <div class="item-desc">{{ $item->product_name }}</div>
                        @if($item->product_sku)
                            <div class="item-sku">SKU: {{ $item->product_sku }}</div>
                        @endif
                    </td>
                    <td class="text-right font-mono">{{ number_format($item->quantity, 2, ',', '.') }}</td>
                    <td class="text-right font-mono">{{ number_format($item->unit_price, 2, ',', '.') }}</td>
                    @if($document->document_type !== 'CT')
                        <td class="text-right font-mono" style="color: #64748B;">
                            {{ $item->discount_percent > 0 ? number_format($item->discount_percent, 2, ',', '.') . '%' : '—' }}
                        </td>
                    @endif
                    <td class="text-right font-mono" style="color: #64748B;">{{ number_format($item->tax_rate, 0) }}%</td>
                    <td class="text-right font-mono" style="font-weight: bold;">{{ number_format($item->total, 2, ',', '.') }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <!-- SUMMARY -->
    <table class="summary-wrapper-table">
        <tr>
            <td style="width: 50%; vertical-align: top;">
                @if($document->company && $document->company->stamp_path && file_exists(storage_path('app/public/' . $document->company->stamp_path)))
                    <div style="margin-top: 10px;">
                        <div style="font-size: 8px; font-weight: bold; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px;">Assinatura / Carimbo</div>
                        <img src="{{ storage_path('app/public/' . $document->company->stamp_path) }}" style="max-height: 75px; max-width: 150px; object-fit: contain;">
                    </div>
                @endif
            </td>
            <td style="width: 50%; vertical-align: top;">
                <table class="summary-table">
                    <tr>
                        <td class="summary-label">Subtotal:</td>
                        <td class="summary-value font-mono">{{ number_format($document->subtotal, 2, ',', '.') }} MZN</td>
                    </tr>
                    @if($document->document_type !== 'CT' && $document->discount_total > 0)
                        <tr>
                            <td class="summary-label" style="color: #10B981;">Desconto:</td>
                            <td class="summary-value font-mono" style="color: #10B981;">- {{ number_format($document->discount_total, 2, ',', '.') }} MZN</td>
                        </tr>
                    @endif
                    <tr>
                        <td class="summary-label">IVA:</td>
                        <td class="summary-value font-mono">{{ number_format($document->tax_total, 2, ',', '.') }} MZN</td>
                    </tr>
                    <tr class="total-row">
                        <td class="summary-label total-label">Total Geral:</td>
                        <td class="summary-value total-value font-mono">{{ number_format($document->grand_total, 2, ',', '.') }} MZN</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    <!-- NOTES -->
    @if($document->notes)
        <div class="notes-box">
            <div class="notes-title">Observações / Notas</div>
            <div class="notes-content">{{ $document->notes }}</div>
        </div>
    @endif

    <!-- FOOTER -->
    <div class="footer">
        <div class="footer-logo">Kutenga ERP</div>
        <div>Software certificado nº 342/AGT • Emitido em conformidade com as regras fiscais vigentes.</div>
        <div>Processado por computador • Obrigado pela sua preferência!</div>
    </div>

</body>
</html>
