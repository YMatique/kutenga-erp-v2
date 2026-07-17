<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bem-vindo ao Kutenga ERP</title>

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
            text-align: center;
        }

        .app-name {
            font-size: 22px;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: -.025em;
        }

        .app-name span {
            color: #2db8a0;
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
            background: #eefdfb;
            color: #0f9f85;
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
            <div class="app-name">Kutenga<span>ERP</span></div>
        </div>


        <div class="hero">

            <span class="badge">
                Bem-vindo
            </span>

            <h2>
                Olá, {{ $user->name }}! 👋
            </h2>

            <p>
                É com muito entusiasmo que lhe damos as boas-vindas ao <strong>Kutenga ERP</strong>. A sua conta foi ativada com sucesso e a sua empresa está pronta para faturar!
            </p>

        </div>


        <p class="message">
            Aqui estão os detalhes da empresa configurada no seu registo:
        </p>


        <div class="details-card">

            <table class="details-table">

                <tr>
                    <td class="details-label">
                        Empresa
                    </td>

                    <td class="details-value">
                        {{ $company->name }}
                    </td>
                </tr>


                <tr>
                    <td class="details-label">
                        NUIT
                    </td>

                    <td class="details-value">
                        {{ $company->nuit ?? 'N/D' }}
                    </td>
                </tr>


                <tr>
                    <td class="details-label">
                        Moeda Base
                    </td>

                    <td class="details-value">
                        {{ $company->default_currency ?? 'MZN' }}
                    </td>
                </tr>

            </table>

        </div>


        <p class="message" style="margin-top:25px;">
            O próximo passo é aceder ao seu painel administrativo, adicionar os seus produtos ou serviços e emitir o seu primeiro documento fiscal.
        </p>


        <div class="btn-container">
            <a href="{{ route('dashboard') }}" class="button">
                Ir para o Dashboard
            </a>
        </div>


        <p class="message">
            Caso necessite de ajuda para parametrizar a sua faturação, por favor consulte a nossa central de ajuda ou entre em contacto com a nossa equipa de suporte.
        </p>



        <div class="footer">

            <div class="footer-company">
                Kutenga ERP
            </div>

            <div>
                Recebeu este e-mail porque se registou na nossa plataforma.
            </div>

            <div class="system-info">
                &copy; {{ date('Y') }} Kutenga ERP. Todos os direitos reservados.
            </div>

        </div>


    </div>

</body>

</html>
