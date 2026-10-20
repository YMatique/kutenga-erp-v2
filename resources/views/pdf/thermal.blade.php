@php
    $typeLabels = [
        'FT' => 'Fatura a Crédito',
        'FR' => 'Fatura-Recibo',
        'CT' => 'Cotação / Orçamento',
        'NC' => 'Nota de Crédito',
        'ND' => 'Nota de Débito',
        'GR' => 'Guia de Remessa',
        'RC' => 'Recibo',
    ];

    $widthMm = app(\App\Services\Printing\PosPrintService::class)
        ->paperWidth($document->company, $document->posShift?->cashRegister);

    // Pagamento (vendas POS): método, valor entregue e troco
    $payment = $document->paymentAllocations->first()?->payment;
    $methodLabels = ['cash' => 'Dinheiro', 'card' => 'TPA / Cartão', 'transfer' => 'Transferência'];

    // IVA agrupado por taxa (total da linha menos a base tributável)
    $taxByRate = $document->items
        ->groupBy(fn ($i) => number_format((float) $i->tax_rate, 0))
        ->map(fn ($rows) => $rows->sum(
            fn ($i) => (float) $i->total - ((float) $i->quantity * (float) $i->unit_price * (1 - (float) $i->discount_percent / 100))
        ));

    $shift = $document->posShift;
@endphp

<!DOCTYPE html>
<html lang="pt-PT">

<head>
    <meta charset="UTF-8">

    <title>
        {{ $document->document_number ?? 'Rascunho' }}
    </title>

    <style>
        @page {
            size: {{ $widthMm }}mm auto;
            margin: 0;
        }

        * {
            box-sizing: border-box;
        }

        body {

            width: {{ $widthMm }}mm;

            margin: 0;

            padding: 3mm;

            font-family:
                "Courier New",
                Courier,
                monospace;

            font-size: 10px;

            color: #000;

            line-height: 1.35;

        }


        .center {
            text-align: center;
        }


        .right {
            text-align: right;
        }


        .bold {
            font-weight: bold;
        }


        .company-name {

            font-size: 14px;

            font-weight: bold;

            text-transform: uppercase;

        }


        .company-info {

            font-size: 8px;

            margin-top: 3px;

        }


        .document-title {

            font-size: 12px;

            font-weight: bold;

            text-transform: uppercase;

            margin-top: 8px;

        }


        .document-number {

            font-size: 12px;

            font-weight: bold;

        }


        .meta {

            font-size: 8px;

            margin-top: 4px;

        }


        .separator {

            border-top: 1px dashed #000;

            margin: 6px 0;

        }


        .customer {

            font-size: 9px;

        }


        table {

            width: 100%;

            border-collapse: collapse;

        }


        th {

            font-size: 8px;

            border-bottom: 1px dashed #000;

            padding-bottom: 3px;

            text-align: left;

        }


        td {
            font-size: 9px;
            padding: 2px 0;
            vertical-align: top;
        }


        .product {
            font-weight: bold;
        }


        .item-info {
            font-size: 8px;
        }


        .summary td {
            padding: 2px 0;
        }


        .total {
            border-top: 1px dashed #000;
            font-size: 11px;
            font-weight: bold;
        }


        .status {

            margin-top: 5px;

            text-align: center;

            font-size: 8px;

            font-weight: bold;

            border: 1px dashed #000;

            padding: 3px;

        }


        .cancelled {

            margin-top: 5px;

            text-align: center;

            font-weight: bold;

        }


        .footer {

            margin-top: 10px;

            text-align: center;

            font-size: 8px;

        }
    </style>

</head>


<body>


    {{-- EMPRESA --}}

    <div class="center">

        <div class="company-name">

            {{ $document->company?->name ?? 'Kutenga' }}

        </div>


        <div class="company-info">


            @if($document->company)

                @if($document->company->address)

                    {!! nl2br(e($document->company->address)) !!}

                    <br>

                @endif


                @if($document->company->phone)

                    Tel:
                    {{ $document->company->phone }}

                    <br>

                @endif


                NUIT:
                {{ $document->company->nuit }}


            @else

                Kutenga Solutions Lda.

                <br>

                NUIT: 100200300

            @endif


        </div>

    </div>



    <div class="separator"></div>



    {{-- DOCUMENTO --}}


    <div class="center">


        <div class="document-title">

            {{ \App\Services\Printing\PosPrintService::documentTitle($document) }}

        </div>


        <div class="document-number">

            {{ $document->document_number ?? 'RASCUNHO' }}

        </div>



        <div class="meta">


            Data:

            {{ $document->issue_date
    ? $document->issue_date->format('d/m/Y').' '.\App\Support\BusinessTime::local($document->created_at ?? now())->format('H:i')
    : \App\Support\BusinessTime::now()->format('d/m/Y H:i')
            }}



            @if($document->series)

                <br>

                Série:
                {{ $document->series->code }}

            @endif


        </div>


    </div>



    @if($document->status === 'draft')

        <div class="status">

            RASCUNHO - SEM VALOR FISCAL

        </div>


    @elseif($document->status === 'cancelled')


        <div class="cancelled">

            *** DOCUMENTO CANCELADO ***

        </div>


    @endif



    <div class="separator"></div>



    {{-- CLIENTE --}}


    <div class="customer">


        <strong>Cliente:</strong>

        {{ $document->customer_name }}


        <br>


        <strong>NUIT:</strong>

        {{ $document->customer_nuit }}



        @if($document->customer_address)

            <br>


            <strong>Endereço:</strong>

            {{ $document->customer_address }}

        @endif


    </div>



    <div class="separator"></div>



    {{-- PRODUTOS --}}


    <table>


        <thead>


            <tr>

                <th>
                    Artigo
                </th>


                <th class="right">
                    Total
                </th>


            </tr>


        </thead>


        <tbody>


            @foreach($document->items as $item)


                <tr>


                    <td colspan="2" class="product">


                        {{ $item->product_name }}


                    </td>


                </tr>



                <tr>


                    <td>


                        <span class="item-info">


                            {{ number_format($item->quantity, 2, ',', '.') }}

                            x

                            {{ number_format($item->unit_price, 2, ',', '.') }}


                            @if($item->discount_percent > 0)

                                <br>

                                Desc:

                                {{ number_format($item->discount_percent, 2, ',', '.') }}%

                            @endif


                        </span>


                    </td>


                    <td class="right">


                        {{ number_format($item->total, 2, ',', '.') }}


                    </td>


                </tr>


            @endforeach


        </tbody>


    </table>



    <div class="separator"></div>



    {{-- TOTAIS --}}


    <table class="summary">


        <tr>

            <td>
                Subtotal
            </td>

            <td class="right">

                {{ number_format($document->subtotal, 2, ',', '.') }}

                MT

            </td>

        </tr>



        @if($document->discount_total > 0)


            <tr>


                <td>
                    Desconto
                </td>


                <td class="right">

                    -

                    {{ number_format($document->discount_total, 2, ',', '.') }}

                    MT

                </td>


            </tr>


        @endif



        @foreach($taxByRate as $rate => $amount)
            <tr>
                <td>
                    IVA ({{ $rate }}%)
                </td>
                <td class="right">
                    {{ number_format($amount, 2, ',', '.') }}
                    MT
                </td>
            </tr>
        @endforeach



        <tr class="total">


            <td>

                TOTAL

            </td>


            <td class="right">


                {{ number_format($document->grand_total, 2, ',', '.') }}

                MT


            </td>


        </tr>


    </table>



    @if($payment)
        <table class="summary">
            <tr>
                <td>Pagamento</td>
                <td class="right">{{ $methodLabels[$payment->payment_method] ?? $payment->payment_method }}</td>
            </tr>
            @if($payment->amount_tendered !== null && $payment->payment_method === 'cash')
                <tr>
                    <td>Entregue</td>
                    <td class="right">{{ number_format($payment->amount_tendered, 2, ',', '.') }} MT</td>
                </tr>
                <tr>
                    <td>Troco</td>
                    <td class="right">{{ number_format($payment->change_given ?? 0, 2, ',', '.') }} MT</td>
                </tr>
            @endif
        </table>
    @endif

    @if($shift)
        <div class="meta center">
            Operador: {{ $shift->user?->name }}
            @if($shift->cashRegister)
                | {{ $shift->cashRegister->name }}
            @endif
        </div>
    @endif

    @if($document->notes)
        <div class="separator"></div>
        <div class="customer">
            <strong>Obs:</strong>

            {{ $document->notes }}


        </div>


    @endif



    <div class="separator"></div>



    {{-- FUTURO HASH / QR CODE --}}


    {{--

    HASH:
    {{ $document->hash }}

    --}}


    {{--

    QR CODE

    Implementar futuramente

    --}}



    <div class="footer">


        <strong>Kutenga ERP</strong>


        <br>


        Software certificado nº 342/AGT


        <br>


        {{ $document->company?->receipt_footer ?: 'Obrigado pela preferência!' }}


    </div>


    @if(!empty($autoprint))
        <script>
            window.addEventListener('load', function () {
                setTimeout(function () { window.print(); }, 300);
            });
        </script>
    @endif
</body>


</html>