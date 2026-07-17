<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>A tua conta foi criada</title>
    <style>
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            font-size: 14px;
            color: #1e293b;
            line-height: 1.6;
            background-color: #f8fafc;
            margin: 0;
            padding: 24px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            padding: 32px 0;
        }
        .header h1 {
            color: #0f172a;
            margin: 0;
            font-size: 24px;
            font-weight: 800;
            letter-spacing: -0.025em;
        }
        .card {
            background-color: #ffffff;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
            border-top: 4px solid #2db8a0;
        }
        .greeting {
            font-size: 18px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 16px;
        }
        .message {
            color: #334155;
            font-size: 15px;
            margin-bottom: 24px;
        }
        .credentials-card {
            background-color: #f8fafc;
            border-left: 4px solid #2db8a0;
            padding: 20px;
            border-radius: 0 8px 8px 0;
            margin: 32px 0;
            border-top: 1px solid #e2e8f0;
            border-right: 1px solid #e2e8f0;
            border-bottom: 1px solid #e2e8f0;
        }
        .credentials-card p {
            margin: 8px 0;
            font-size: 14px;
            color: #334155;
        }
        .btn-container {
            text-align: center;
            margin: 32px 0 16px 0;
        }
        .btn {
            display: inline-block;
            background-color: #2db8a0;
            color: #ffffff !important;
            text-decoration: none;
            padding: 14px 28px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 15px;
            box-shadow: 0 4px 6px -1px rgba(45, 184, 160, 0.2);
            transition: all 0.2s;
        }
        .footer {
            text-align: center;
            padding: 32px 0;
            color: #94a3b8;
            font-size: 12px;
            line-height: 1.8;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{ $user->company->name ?? config('app.name') }}</h1>
        </div>
        
        <div class="card">
            <div class="greeting">Olá, {{ $user->name }}! 👋</div>
            
            <p class="message">Foi criada uma conta para ti associada à empresa <strong>{{ $user->company->name ?? config('app.name') }}</strong>.</p>
            
            <p class="message">Aqui estão as tuas credenciais de acesso temporárias:</p>
            
            <div class="credentials-card">
                <p><strong>E-mail:</strong> {{ $user->email }}</p>
                <p><strong>Palavra-passe temporária:</strong> {{ $password }}</p>
            </div>
            
            <p class="message">Por favor, clica no botão abaixo para iniciar sessão e altera a tua palavra-passe nas definições de perfil por questões de segurança.</p>
            
            <div class="btn-container">
                <a href="{{ route('login') }}" class="btn">Iniciar Sessão</a>
            </div>
            
            <p class="message" style="margin-top: 32px; font-size: 14px; color: #64748b;">Se precisares de ajuda, entra em contacto com o administrador da tua empresa.</p>
        </div>
        
        <div class="footer">
            <p>&copy; {{ date('Y') }} {{ $user->company->name ?? config('app.name') }}. Todos os direitos reservados.</p>
        </div>
    </div>
</body>
</html>
