<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <title>Bem-vindo ao Kutenga</title>
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
            color: #2DB8A0;
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
        .company-details {
            background: #f1f5f9;
            border-left: 4px solid #2DB8A0;
            padding: 16px;
            border-radius: 0 8px 8px 0;
            margin: 32px 0;
        }
        .company-details p {
            margin: 4px 0;
            font-size: 14px;
        }
        .btn {
            display: inline-block;
            background-color: #2DB8A0;
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
                <h2>Olá, {{ $user->name }}! 👋</h2>
                
                <p>É com muito entusiasmo que te damos as boas-vindas ao <strong>Kutenga ERP</strong>. A tua conta foi ativada com sucesso e a tua empresa está pronta para faturar!</p>
                
                <p>Aqui estão os detalhes do registo da tua empresa que configuraste no onboarding:</p>
                
                <div class="company-details">
                    <p><strong>Empresa:</strong> {{ $company->name }}</p>
                    <p><strong>NUIT:</strong> {{ $company->nuit }}</p>
                    <p><strong>Moeda Base:</strong> {{ $company->default_currency }}</p>
                </div>
                
                <p>O próximo passo é explorares o teu Dashboard, adicionares os teus produtos ou serviços, e emitires a tua primeira fatura com uma apresentação impecável.</p>
                
                <center>
                    <a href="{{ route('dashboard') }}" class="btn">Ir para o Dashboard</a>
                </center>
                
                <p style="margin-top: 40px;">Se precisares de alguma ajuda, não hesites em contactar a nossa equipa de suporte.</p>
                
                <p>Com os melhores cumprimentos,<br>A equipa Kutenga.</p>
            </div>
        </div>
        
        <div class="footer">
            <p>&copy; {{ date('Y') }} Kutenga ERP. Todos os direitos reservados.</p>
            <p>Recebeste este email porque te registaste na nossa plataforma.</p>
        </div>
    </div>
</body>
</html>
