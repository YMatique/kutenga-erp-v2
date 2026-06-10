Aqui está um **README curto e focado apenas na melhoria que implementaste (timeline + novos campos de auditoria)**, sem misturar outras funcionalidades.

---

# 📦 Stock Adjustment — Auditoria & Timeline Enhancement

## 🎯 Objetivo

Esta melhoria adiciona **rastreabilidade completa (audit trail)** ao módulo de ajustes de stock, permitindo visualizar:

* Quem criou o ajuste
* Quando foi criado
* Quem concluiu o ajuste
* Quando foi concluído
* Quem cancelou o ajuste
* Quando foi cancelado
* Histórico visual (timeline) no frontend

---

# 🏗️ Novos Campos (Database)

## stock_adjustments

Adicionar os seguintes campos:

```text
status
completed_by
completed_at
cancelled_by
cancelled_at
```

---

## 📌 Descrição dos campos

| Campo        | Tipo      | Função                        |
| ------------ | --------- | ----------------------------- |
| status       | enum      | draft / completed / cancelled |
| completed_by | FK users  | utilizador que finalizou      |
| completed_at | timestamp | data de conclusão             |
| cancelled_by | FK users  | utilizador que cancelou       |
| cancelled_at | timestamp | data de cancelamento          |

---

# ⚙️ Regras de Negócio

## 1. Conclusão do ajuste

Ao concluir um ajuste:

* status muda para `completed`
* completed_by recebe auth user
* completed_at recebe timestamp atual
* stock é atualizado via StockService

---

## 2. Cancelamento do ajuste

Ao cancelar:

* status muda para `cancelled`
* cancelled_by recebe auth user
* cancelled_at recebe timestamp atual
* **nenhum stock é alterado**

---

## 3. Restrições

* Ajustes com status `completed` não podem ser modificados
* Ajustes cancelados não podem ser executados

---

# 🧠 Service Layer (Atualização)

## complete()

```text
- valida status
- executa stock movements
- atualiza status + auditoria
```

## cancel()

```text
- valida status
- atualiza apenas auditoria
- não altera stock
```

---

# 🖥️ Frontend — Timeline (Show Page)

## 📌 Nova secção: Histórico do Ajuste

A página de detalhes agora inclui uma **timeline de eventos**:

### Eventos exibidos:

* 🟡 Ajuste criado
* 🟢 Ajuste concluído
* 🔴 Ajuste cancelado

---

## Estrutura visual

```text
Histórico do Ajuste

[ Criado ]
por João Admin
10/06/2026 10:30

[ Concluído ]
por João Admin
10/06/2026 10:35

[ Cancelado ] (opcional)
por João Admin
10/06/2026 10:40
```

---

# 🎨 UI/UX Guidelines

## Estados visuais

| Evento    | Cor      |
| --------- | -------- |
| Criado    | cinza    |
| Concluído | verde    |
| Cancelado | vermelho |

---

## Componentes usados

* Card (seção de timeline)
* Separator (divisores)
* Badge (status atual)

---

# 📊 Benefícios da melhoria

✔ rastreabilidade total de inventário
✔ auditoria para auditor e gestão
✔ histórico claro para operações
✔ base para compliance e controlo interno
✔ prepara o sistema para aprovação de ajustes no futuro

---

# 🚀 Extensões futuras (opcional)

* Aprovação de ajuste antes de concluir
* Log detalhado por item (quem alterou cada linha)
* Exportação PDF com histórico completo
* Timeline estilo ERPNext/Odoo

---

Se quiseres, o próximo passo natural é transformar isto num:

👉 **Audit Log central do ERP (para stock, vendas, POS e faturação)**

isso aí já vira nível ERP profissional completo.
