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
<!DOCTYPE html>
<html lang="pt-PT">
<head>
    <meta charset="UTF-8">
    <title>Recibo {{ $document->document_number ?? 'Rascunho' }}</title>
    <style>
        @page {
            margin: 0;
        }
        body {
            font-family: 'Courier New', 'Courier', monospace;
            font-size: 10px;
            color: #000000;
            line-height: 1.3;
            margin: 0;
            padding: 8px 10px;
            width: 206px; /* 226pt - 20pt padding */
        }
        .c { text-align: center; }
        .r { text-align: right; }
        .b { font-weight: bold; }
        .logo { font-size: 12px; font-weight: bold; margin-bottom: 2px; text-transform: uppercase; }
        .issuer-details { font-size: 8px; margin-bottom: 4px; }
        .title { font-size: 10px; font-weight: bold; margin: 8px 0 2px 0; text-transform: uppercase; }
        .doc-num { font-size: 11px; font-weight: bold; margin-bottom: 4px; }
        .meta { font-size: 8px; margin-bottom: 4px; }
        .sep { border-top: 1px dashed #000000; margin: 6px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 4px; }
        td, th { padding: 2px 0; vertical-align: top; font-size: 9px; }
        .summary-table td { padding: 1.5px 0; }
        .tot-label { font-size: 10px; font-weight: bold; }
        .tot-val { font-size: 11px; font-weight: bold; }
        .foot { font-size: 7.5px; text-align: center; margin-top: 12px; }
        .badge-draft {
            border: 1px dashed #000;
            padding: 1px 3px;
            font-size: 8px;
            font-weight: bold;
            text-transform: uppercase;
            display: inline-block;
            margin-top: 4px;
        }
    </style>
</head>
<body>
    <div class="c logo">{{ $document->company ? $document->company->name : 'Kutenga' }}</div>
    <div class="c issuer-details">
        @if($document->company)
            @if($document->company->address)
                {!! nl2br(e($document->company->address)) !!}<br>
            @endif
            @if($document->company->phone)
                Tel: {{ $document->company->phone }}<br>
            @endif
            NUIT: {{ $document->company->nuit }}
        @else
            Kutenga Solutions Lda.<br>
            Av. 24 de Julho, Maputo<br>
            Tel: +258 84 000 0000<br>
            NUIT: 100200300
        @endif
    </div>

    <div class="sep"></div>

    <div class="c title">{{ $typeLabels[$document->document_type] ?? 'Fatura-Recibo' }}</div>
    <div class="c doc-num">{{ $document->document_number ?? 'RASCUNHO' }}</div>
    <div class="c meta">
        Emissão: {{ $document->issue_date ? $document->issue_date->format('d/m/Y') : now()->format('d/m/Y') }}<br>
        @if($document->series)
            Série: {{ $document->series->code }}
        @endif
    </div>

    @if($document->status === 'draft')
        <div class="c">
            <span class="badge-draft">Rascunho (Sem Valor Fiscal)</span>
        </div>
    @elseif($document->status === 'cancelled')
        <div class="c b" style="margin-top: 4px; text-transform: uppercase;">
            *** DOCUMENTO CANCELADO ***
        </div>
    @endif

    <div class="sep"></div>

    <!-- Customer -->
    <div class="meta">
        <strong>Cliente:</strong> {{ $document->customer_name }}<br>
        <strong>NUIT:</strong> {{ $document->customer_nuit }}<br>
        @if($document->customer_address)
            <strong>Endereço:</strong> {{ $document->customer_address }}
        @endif
    </div>

    <div class="sep"></div>

    <!-- Items -->
    <table>
        <thead>
            <tr style="border-bottom: 1px dashed #000000;">
                <th align="left" style="width: 50%">Artigo</th>
                <th align="right" style="width: 20%">Qtd</th>
                <th align="right" style="width: 30%">Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($document->items as $item)
                <tr>
                    <td>
                        {{ $item->product_name }}
                        @if($item->discount_percent > 0)
                            <br><small style="font-size: 7.5px;">Desc: {{ number_format($item->discount_percent, 1, ',', '.') }}%</small>
                        @endif
                    </td>
                    <td align="right">{{ number_format($item->quantity, 0, ',', '.') }}</td>
                    <td align="right">{{ number_format($item->total, 2, ',', '.') }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="sep"></div>

    <!-- Totals -->
    <table class="summary-table">
        <tr>
            <td style="width: 60%">Subtotal:</td>
            <td align="right" class="b">{{ number_format($document->subtotal, 2, ',', '.') }} MT</td>
        </tr>
        @if($document->discount_total > 0)
            <tr>
                <td>Desconto:</td>
                <td align="right" class="b">-{{ number_format($document->discount_total, 2, ',', '.') }} MT</td>
            </tr>
        @endif
        <tr>
            <td>IVA:</td>
            <td align="right" class="b">{{ number_format($document->tax_total, 2, ',', '.') }} MT</td>
        </tr>
        <tr style="border-top: 1px dashed #000000;">
            <td class="tot-label">TOTAL:</td>
            <td align="right" class="tot-val">{{ number_format($document->grand_total, 2, ',', '.') }} MT</td>
        </tr>
    </table>

    @if($document->notes)
        <div class="sep"></div>
        <div class="meta">
            <strong>Obs:</strong> {{ $document->notes }}
        </div>
    @endif

    <div class="sep"></div>

    <div class="foot">
        <strong>Kutenga ERP</strong><br>
        Software certificado nº 342/AGT<br>
        Obrigado pela sua preferência!
    </div>
</body>
</html>
