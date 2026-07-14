<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <title>Relatório de {{ ucfirst($category) }}</title>
    <style>
        body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 12px; color: #333; }
        .header { text-align: center; margin-bottom: 30px; }
        .title { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
        .subtitle { font-size: 14px; color: #666; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f4f4f4; font-weight: bold; }
        .text-right { text-align: right; }
        .mt-4 { margin-top: 20px; }
    </style>
</head>
<body>

    <div class="header">
        <div class="title">{{ $company }}</div>
        <div class="subtitle">Relatório de {{ ucfirst($category) }}</div>
        <div>Período: {{ $date_range['start'] }} a {{ $date_range['end'] }}</div>
    </div>

    @if($category === 'sales')
        <table>
            <thead>
                <tr>
                    <th>Indicador</th>
                    <th class="text-right">Valor</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Total Receitas (Confirmadas e Pagas)</td>
                    <td class="text-right">{{ number_format($data['total_revenue'], 2) }} MZN</td>
                </tr>
                <tr>
                    <td>Total Impostos Recolhidos</td>
                    <td class="text-right">{{ number_format($data['total_taxes'], 2) }} MZN</td>
                </tr>
                <tr>
                    <td>Total Faturas Emitidas (FT)</td>
                    <td class="text-right">{{ $data['total_invoices'] }}</td>
                </tr>
                <tr>
                    <td>Total Cotações (CT)</td>
                    <td class="text-right">{{ $data['total_quotes'] }}</td>
                </tr>
            </tbody>
        </table>
    @elseif($category === 'inventory')
        <table>
            <thead>
                <tr>
                    <th>Indicador</th>
                    <th class="text-right">Valor (Qtd)</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Total Entradas (Ins)</td>
                    <td class="text-right">{{ number_format($data['total_ins'], 2) }}</td>
                </tr>
                <tr>
                    <td>Total Saídas (Outs)</td>
                    <td class="text-right">{{ number_format($data['total_outs'], 2) }}</td>
                </tr>
            </tbody>
        </table>

        @if(count($data['low_stock_products']) > 0)
            <div class="mt-4">
                <strong>Alertas de Stock Baixo:</strong>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Produto</th>
                        <th>Stock Atual</th>
                        <th>Mínimo Permitido</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($data['low_stock_products'] as $product)
                        <tr>
                            <td>{{ $product['name'] }}</td>
                            <td>{{ $product['total_stock'] ?? 0 }}</td>
                            <td>{{ $product['min_stock'] }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        @endif
    @elseif($category === 'customers')
        <div class="mt-4">
            <strong>Top Clientes (Receita)</strong>
        </div>
        <table>
            <thead>
                <tr>
                    <th>Cliente</th>
                    <th class="text-right">Total Gasto</th>
                </tr>
            </thead>
            <tbody>
                @foreach($data['top_customers'] as $tc)
                    <tr>
                        <td>{{ $tc['customer']['name'] ?? 'N/A' }}</td>
                        <td class="text-right">{{ number_format($tc['total_spent'], 2) }} MZN</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @elseif($category === 'pos')
        <table>
            <thead>
                <tr>
                    <th>Indicador</th>
                    <th class="text-right">Valor</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Total Turnos</td>
                    <td class="text-right">{{ $data['total_shifts'] }}</td>
                </tr>
                <tr>
                    <td>Total Esperado</td>
                    <td class="text-right">{{ number_format($data['total_expected'], 2) }} MZN</td>
                </tr>
                <tr>
                    <td>Total Reportado</td>
                    <td class="text-right">{{ number_format($data['total_reported'], 2) }} MZN</td>
                </tr>
                <tr>
                    <td>Variação / Quebras</td>
                    <td class="text-right">{{ number_format($data['total_variances'], 2) }} MZN</td>
                </tr>
            </tbody>
        </table>
    @endif

</body>
</html>
