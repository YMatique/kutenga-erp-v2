<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>A tua conta foi criada</title>

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
            border-top: 4px solid #2db8a0;
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

        .hero {
            background: #f8fafc;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 24px;
        }

        .hero h2 {
            margin: 0 0 8px;
            font-size: 18px;
            color: #0f172a;
        }

        .hero p {
            margin: 0;
            color: #475569;
        }

        .badge {
            display: inline-block;
            background: #eef2f6;
            color: #475569;
            padding: 6px 12px;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            margin-bottom: 20px;
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
            margin: 25px 0;
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

        .btn-container {
            text-align: center;
            margin: 25px 0;
        }

        .button {
            display: inline-block;
            background: #2db8a0;
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

            @if($user->company?->logo_path)
                <img src="{{ asset('storage/' . $user->company->logo_path) }}" class="logo" alt="Logo">
            @endif

            <div class="company-name">
                {{ $user->company->name ?? config('app.name') }}
            </div>

        </div>


        <div class="hero">

            <span class="badge">
                Novo Utilizador
            </span>

            <h2>
                Olá, {{ $user->name }}! 👋
            </h2>

            <p>
                Foi criada uma conta de acesso para si no sistema associado à empresa
                <strong>{{ $user->company->name ?? config('app.name') }}</strong>.
            </p>

        </div>


        <p class="message">
            Seguem abaixo as suas credenciais temporárias para o primeiro acesso:
        </p>


        <div class="details-card">

            <table class="details-table">

                <tr>
                    <td class="details-label">
                        E-mail
                    </td>

                    <td class="details-value">
                        {{ $user->email }}
                    </td>
                </tr>


                <tr>
                    <td class="details-label">
                        Palavra-passe
                    </td>

                    <td class="details-value">
                        <code>{{ $password }}</code>
                    </td>
                </tr>

            </table>

        </div>


        <p class="message" style="margin-top:25px;">
            Por favor, clique no botão abaixo para iniciar sessão. Recomendamos que altere a sua palavra-passe nas definições de perfil após o primeiro acesso por motivos de segurança.
        </p>


        <div class="btn-container">
            <a href="{{ route('login') }}" class="button">
                Iniciar Sessão
            </a>
        </div>


        <p class="message">
            Se tiver alguma dúvida ou dificuldade no acesso, contacte o administrador do sistema.
        </p>



        <div class="footer">

            <div class="footer-company">
                {{ $user->company->name ?? config('app.name') }}
            </div>


            @if($user->company?->address)
                <div>
                    {{ $user->company->address }}
                </div>
            @endif


            @if($user->company?->nuit)
                <div>
                    <strong>NUIT:</strong>
                    {{ $user->company->nuit }}
                </div>
            @endif


            @if($user->company?->phone)
                <div>
                    <strong>Telefone:</strong>
                    {{ $user->company->phone }}
                </div>
            @endif


            @if($user->company?->email)
                <div>
                    <strong>Email:</strong>
                    {{ $user->company->email }}
                </div>
            @endif


            <div class="system-info">
                Mensagem automática de boas-vindas enviada pela empresa
                {{ $user->company->name ?? config('app.name') }}.
            </div>

        </div>


    </div>

</body>

</html>
