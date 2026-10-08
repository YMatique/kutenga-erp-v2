<?php

return [
    // Portas aceites para impressoras de rede (RAW/ESC-POS 9100-9106, LPD 515, IPP 631).
    // Limitar as portas impede que o servidor seja usado para sondar serviços internos.
    'printer_ports' => [9100, 9101, 9102, 9103, 9104, 9105, 9106, 515, 631],

    // Por omissão só se aceitam impressoras em redes privadas (10.x, 172.16-31.x, 192.168.x).
    // Ative apenas se o servidor tiver de imprimir para um endereço público (ex.: VPN com IP público).
    'allow_public_printer_hosts' => (bool) env('POS_ALLOW_PUBLIC_PRINTER_HOSTS', false),
];
