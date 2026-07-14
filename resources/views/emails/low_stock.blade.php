<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <title>Alerta de Stock - Kutenga ERP</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #f8fafc;
            color: #334155;
            line-height: 1.6;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            padding: 40px 0;
        }
        .header h1 {
            color: #E8A020;
            margin: 0;
            font-size: 32px;
        }
        .card {
            background: #ffffff;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .content p {
            margin-bottom: 24px;
            font-size: 16px;
        }
        .alert-details {
            background: #fffbeb;
            border-left: 4px solid #E8A020;
            padding: 16px;
            border-radius: 0 8px 8px 0;
            margin: 32px 0;
        }
        .alert-details p {
            margin: 4px 0;
            font-size: 14px;
        }
        .btn {
            display: inline-block;
            background-color: #E8A020;
            color: #ffffff !important;
            text-decoration: none;
            padding: 14px 28px;
            border-radius: 8px;
            font-weight: bold;
            text-align: center;
            margin-top: 16px;
        }
        .footer {
            text-align: center;
            padding: 32px 0;
            color: #94a3b8;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Kutenga ERP</h1>
        </div>
        
        <div class="card">
            <div class="content">
                <h2>Alerta de Stock Mínimo Atingido ⚠️</h2>
                
                <p>O produto listado abaixo atingiu ou desceu abaixo do limite mínimo de stock configurado no catálogo da tua empresa.</p>
                
                <div class="alert-details">
                    <p><strong>Produto:</strong> {{ $product->name }}</p>
                    <p><strong>SKU:</strong> {{ $product->sku ?? 'N/D' }}</p>
                    <p><strong>Stock Mínimo Alvo:</strong> {{ $product->min_stock }} unidades</p>
                    <p><strong>Stock Atual Global:</strong> <span style="color: #ef4444; font-weight: bold;">{{ $stock }}</span> unidades</p>
                </div>
                
                <p>Recomendamos a emissão de uma ordem de compra ou reposição física do produto para evitar rutura total de stock no Ponto de Venda ou Faturação.</p>
                
                <center>
                    <a href="{{ route('products.show', $product->id) }}" class="btn">Visualizar Produto</a>
                </center>
                
                <p style="margin-top: 40px;">Podes configurar estes alertas nas Definições da Empresa a qualquer momento.</p>
                
                <p>Com os melhores cumprimentos,<br>A equipa Kutenga.</p>
            </div>
        </div>
        
        <div class="footer">
            <p>&copy; {{ date('Y') }} Kutenga ERP. Todos os direitos reservados.</p>
        </div>
    </div>
</body>
</html>
