<?php

return [
    // Dias de tolerância (só leitura) depois de terminar o prazo da subscrição
    'grace_days' => (int) env('SUBSCRIPTION_GRACE_DAYS', 7),

    // Avisos antes do fim da subscrição (dias)
    'warning_days' => [7, 3, 1],

    // API interna usada pela aplicação externa de gestão de subscrições
    'api' => [
        // Segredo partilhado para assinar os pedidos (HMAC-SHA256). Sem ele a API fica desligada.
        'secret' => env('SUBSCRIPTION_API_SECRET'),
        // Tolerância do timestamp do pedido, em segundos (protege contra repetição)
        'tolerance' => (int) env('SUBSCRIPTION_API_TOLERANCE', 300),
    ],
];
