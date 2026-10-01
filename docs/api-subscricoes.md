# API de Subscrições (interna)

Contrato entre a **Kutenga** e a aplicação externa que gere subscrições e cobrança.
A Kutenga é dona do catálogo de planos e dos limites; a aplicação externa escolhe **que plano** cada empresa tem e **por quanto tempo**.

## Configuração

No `.env` da Kutenga:

```
SUBSCRIPTION_API_SECRET=<segredo longo e aleatório, partilhado com a aplicação externa>
SUBSCRIPTION_GRACE_DAYS=7
```

Sem `SUBSCRIPTION_API_SECRET` a API responde `503` (desligada).
Gerar um segredo: `php -r "echo bin2hex(random_bytes(32));"`.

## Identificar a empresa

Cada empresa tem um `external_id` (UUID), criado automaticamente. A aplicação externa guarda-o e usa-o em todos os pedidos.

## Autenticação (assinatura HMAC)

Todos os pedidos levam dois cabeçalhos:

| Cabeçalho | Valor |
|---|---|
| `X-Kutenga-Timestamp` | segundos Unix atuais |
| `X-Kutenga-Signature` | `hex(HMAC-SHA256(timestamp + "." + corpo_bruto, SECRET))` |

- O corpo bruto é exatamente o texto enviado (vazio nos `GET`).
- Pedidos com mais de 5 minutos de diferença são recusados (`401`), o que impede a repetição de pedidos capturados.
- O segredo nunca viaja na rede.

Exemplo (PHP):

```php
$body = json_encode(['plan' => 'crescimento', 'status' => 'active', 'ends_at' => '2026-12-31']);
$ts = (string) time();
$sig = hash_hmac('sha256', $ts . '.' . $body, $secret);

Http::withHeaders([
    'X-Kutenga-Timestamp' => $ts,
    'X-Kutenga-Signature' => $sig,
    'Idempotency-Key' => $eventId,          // recomendado
])->withBody($body, 'application/json')
  ->put("$base/api/internal/companies/$externalId/subscription");
```

Exemplo (Node):

```js
const sig = crypto.createHmac('sha256', secret).update(`${ts}.${body}`).digest('hex');
```

O comando `php artisan subscription:simulate {empresa} --plan=crescimento --ends=2026-12-31` envia um pedido assinado real e serve de referência.

## Endpoints

### `GET /api/internal/companies/{external_id}/subscription`

Devolve o estado atual e o consumo:

```json
{
  "company_id": "b3f1…",
  "plan": "crescimento",
  "status": "active",
  "state": "active",
  "ends_at": "2026-12-31T00:00:00+00:00",
  "grace_ends_at": "2027-01-07T00:00:00+00:00",
  "limits": { "documents_month": null, "products": null, "warehouses": 5, "cash_registers": 2, "users": 5 },
  "features": { "pos": true },
  "usage": { "documents_month": 12, "products": 40, "warehouses": 1, "cash_registers": 1, "users": 3 }
}
```

`status` é o valor gravado (`active`, `suspended`, `cancelled`, `expired`). `state` é o estado efetivo:

| `state` | Significado |
|---|---|
| `active` | dentro do prazo (ou plano sem data de fim) |
| `grace` | prazo terminado há menos de N dias: **só leitura** |
| `expired` | prazo e tolerância terminados: bloqueio total |
| `suspended` | suspensa ou cancelada: bloqueio imediato |

### `PUT /api/internal/companies/{external_id}/subscription`

Corpo (todos os campos são opcionais, só os enviados são alterados):

| Campo | Tipo | Notas |
|---|---|---|
| `plan` | string | código de um plano ativo (`inicial`, `crescimento`, `empresarial`, …) |
| `status` | string | `active`, `suspended`, `cancelled`, `expired` |
| `ends_at` | data/null | fim do período pago; `null` = sem fim |
| `limits_override` | objeto/null | exceções por empresa, p. ex. `{"users": 8}`; `null` limpa as exceções |

Chaves de `limits_override` aceites: `documents_month`, `products`, `warehouses`, `cash_registers`, `users`. Valor `null` = ilimitado. Chaves desconhecidas dão `422`.

**Idempotência:** envie `Idempotency-Key: <id único do evento>`. Reenviar o mesmo identificador devolve o estado atual com `"replayed": true` sem reaplicar a alteração, por isso é seguro repetir pedidos após falhas de rede.

Respostas: `200` com o mesmo corpo do `GET` (mais `replayed`), `401` assinatura inválida, `404` empresa desconhecida, `422` dados inválidos, `429` demasiados pedidos (60/min), `503` API desligada.

## Fluxos habituais

| Situação | Pedido |
|---|---|
| Nova subscrição / renovação | `PUT` com `plan`, `status: "active"`, `ends_at` |
| Falta de pagamento | `PUT` com `status: "suspended"` |
| Regularização | `PUT` com `status: "active"` e nova `ends_at` |
| Cancelamento | `PUT` com `status: "cancelled"` |
| Tarifa especial | `PUT` com `limits_override` |

## Comportamento na Kutenga

- Os limites são lidos da tabela `plans` (editável por super admin em `/system/plans`), com as exceções da empresa por cima. Uma chave em falta no plano conta como 0.
- Em `grace` a empresa consulta dados mas não cria nem emite nada. Em `expired` e `suspended` só acede à página de subscrição e ao logout.
- Cada alteração fica registada em `subscription_events` (origem, plano anterior e novo, estado, payload) e gera uma notificação à empresa.
- O comando agendado `subscription:check` corre diariamente: avisa 7, 3 e 1 dias antes do fim e regista a expiração depois da tolerância.
