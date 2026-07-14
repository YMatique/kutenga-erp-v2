<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <title>Bem-vindo ao Kutenga ERP</title>
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
        .credentials {
            background: #f1f5f9;
            border-left: 4px solid #2DB8A0;
            padding: 16px;
            border-radius: 0 8px 8px 0;
            margin: 32px 0;
        }
        .credentials p {
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
                
                <p>Foi criada uma conta para ti no <strong>Kutenga ERP</strong> associada à empresa <strong>{{ $user->company->name ?? 'Kutenga' }}</strong>.</p>
                
                <p>Aqui estão as tuas credenciais de acesso temporárias:</p>
                
                <div class="credentials">
                    <p><strong>E-mail:</strong> {{ $user->email }}</p>
                    <p><strong>Palavra-passe:</strong> {{ $password }}</p>
                </div>
                
                <p>Por favor, inicia sessão no sistema e altera a tua palavra-passe nas definições de perfil por questões de segurança.</p>
                
                <center>
                    <a href="{{ route('login') }}" class="btn">Iniciar Sessão</a>
                </center>
                
                <p style="margin-top: 40px;">Se precisares de ajuda, entra em contacto com o administrador do sistema.</p>
                
                <p>Com os melhores cumprimentos,<br>A equipa Kutenga.</p>
            </div>
        </div>
        
        <div class="footer">
            <p>&copy; {{ date('Y') }} Kutenga ERP. Todos os direitos reservados.</p>
        </div>
    </div>
</body>
</html>
