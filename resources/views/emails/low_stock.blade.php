<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Alerta de Stock Mínimo</title>

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
            border-top: 4px solid #ea580c;
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
            background: #fff5f5;
            border: 1px solid #fed7d7;
            border-radius: 10px;
            padding: 18px;
            text-align: center;
            margin-bottom: 25px;
            color: #c53030;
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

        .danger-value {
            color: #e53e3e;
            font-weight: 700;
        }

        .btn-container {
            text-align: center;
            margin: 25px 0;
        }

        .button {
            display: inline-block;
            background: #ea580c;
            color: #ffffff !important;
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

        <div class="header">

            @if($product->company?->logo_path)
                <img src="{{ asset('storage/' . $product->company->logo_path) }}" class="logo" alt="Logo">
            @endif

            <div class="company-name">
                {{ $product->company->name ?? config('app.name') }}
            </div>

        </div>


        <div class="alert-box">

            <strong>
                ⚠ Alerta de Stock Mínimo
            </strong>

            O stock do produto listado abaixo atingiu ou está abaixo do limite configurado.

        </div>


        <div class="greeting">
            Olá! 👋
        </div>


        <p class="message">

            Informamos que o seguinte produto atingiu o limite de stock mínimo de segurança configurado no catálogo da sua empresa.

        </p>



        <div class="details-card">

            <table class="details-table">

                <tr>
                    <td class="details-label">
                        Produto
                    </td>

                    <td class="details-value">
                        {{ $product->name }}
                    </td>
                </tr>


                <tr>
                    <td class="details-label">
                        SKU
                    </td>

                    <td class="details-value">
                        {{ $product->sku ?? 'N/D' }}
                    </td>
                </tr>


                <tr>
                    <td class="details-label">
                        Stock Mínimo
                    </td>

                    <td class="details-value">
                        {{ $product->min_stock }} unidades
                    </td>
                </tr>


                <tr>
                    <td class="details-label">
                        Stock Atual
                    </td>

                    <td class="details-value danger-value">
                        {{ $stock }} unidades
                    </td>
                </tr>


            </table>

        </div>


        <p class="message" style="margin-top:25px;">

            Recomendamos a emissão de uma ordem de compra ou reposição física do produto para evitar rutura total de stock na faturação ou no ponto de venda.

        </p>


        <div class="btn-container">
            <a href="{{ route('products.show', $product->id) }}" class="button">
                Visualizar Produto
            </a>
        </div>


        <p class="message">

            Pode configurar as definições e limites de stock a qualquer momento no catálogo de produtos do sistema.

        </p>



        <div class="footer">

            <div class="footer-company">
                {{ $product->company->name ?? config('app.name') }}
            </div>


            @if($product->company?->address)
                <div>
                    {{ $product->company->address }}
                </div>
            @endif


            @if($product->company?->nuit)
                <div>
                    <strong>NUIT:</strong>
                    {{ $product->company->nuit }}
                </div>
            @endif


            @if($product->company?->phone)
                <div>
                    <strong>Telefone:</strong>
                    {{ $product->company->phone }}
                </div>
            @endif


            @if($product->company?->email)
                <div>
                    <strong>Email:</strong>
                    {{ $product->company->email }}
                </div>
            @endif


            <div class="system-info">
                Mensagem automática de alerta enviada pelo catálogo de
                {{ $product->company->name ?? config('app.name') }}.
            </div>

        </div>


    </div>

</body>

</html>
