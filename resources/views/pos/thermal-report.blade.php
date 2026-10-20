@php
    $widthMm = (int) ($paperWidth ?? ($company?->thermal_paper_width ?: 80));
    $money = fn ($v) => number_format((float) $v, 2, ',', '.');
    $methods = ['cash' => 'Dinheiro', 'card' => 'Cartão', 'transfer' => 'Transf.'];
@endphp
<!DOCTYPE html>
<html lang="pt-PT">
<head>
    <meta charset="UTF-8">
    <title>{{ $title }}</title>
    <style>
        @page { size: {{ $widthMm }}mm auto; margin: 0; }
        * { box-sizing: border-box; }
        body { width: {{ $widthMm }}mm; margin: 0; padding: 3mm; font-family: "Courier New", Courier, monospace; font-size: 10px; color: #000; line-height: 1.35; }
        .center { text-align: center; }
        .right { text-align: right; }
        .name { font-size: 13px; font-weight: bold; text-transform: uppercase; }
        .title { font-size: 12px; font-weight: bold; text-transform: uppercase; margin-top: 6px; }
        .meta { font-size: 9px; }
        .sep { border-top: 1px dashed #000; margin: 6px 0; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 1px 0; vertical-align: top; }
        .strong td { font-weight: bold; }
        .footer { margin-top: 8px; text-align: center; font-size: 8px; }
        @media print { body { width: 100%; } }
    </style>
</head>
<body>
    <div class="center">
        <div class="name">{{ $company?->name ?? 'Kutenga' }}</div>
        @if($company?->nuit)<div class="meta">NUIT: {{ $company->nuit }}</div>@endif
        <div class="title">{{ $title }}</div>
        @foreach($meta as $line)
            <div class="meta">{{ $line }}</div>
        @endforeach
        <div class="meta">Impresso: {{ \App\Support\BusinessTime::now()->format('d/m/Y H:i') }}</div>
    </div>

    <div class="sep"></div>

    <table>
        @foreach($summary as [$label, $value])
            <tr class="{{ str_starts_with($label, ' ') ? '' : 'strong' }}">
                <td style="white-space: pre;">{{ $label }}</td>
                <td class="right">{{ ($isMoney ?? true) ? $money($value) . ' MT' : $value }}</td>
            </tr>
        @endforeach
    </table>

    @if(count($rows))
        <div class="sep"></div>
        <table>
            @foreach($rows as $row)
                <tr>
                    <td>{{ $row['time'] }}</td>
                    <td>{{ $row['number'] }}</td>
                    <td>{{ $methods[$row['method']] ?? $row['method'] }}</td>
                    <td class="right">{{ $money($row['total']) }}</td>
                </tr>
            @endforeach
        </table>
    @endif

    <div class="sep"></div>
    <div class="footer">Kutenga ERP</div>

    <script>
        window.addEventListener('load', function () { setTimeout(function () { window.print(); }, 300); });
    </script>
</body>
</html>
