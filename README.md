<div align="center">

# Kutenga ERP

**Sistema de Gestão Empresarial (ERP) multi-empresa**  
Construído com Laravel 13 · React 19 · Inertia.js · TypeScript

</div>

---

## Índice

1. [Visão Geral](#1-visão-geral)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Requisitos do Sistema](#3-requisitos-do-sistema)
4. [Instalação & Configuração](#4-instalação--configuração)
5. [Estrutura do Projecto](#5-estrutura-do-projecto)
6. [Arquitectura Multi-Empresa](#6-arquitectura-multi-empresa)
7. [Módulos](#7-módulos)
8. [Roles & Permissões](#8-roles--permissões)
9. [Queue, Jobs & Schedules](#9-queue-jobs--schedules)
10. [Emails (Mailables)](#10-emails-mailables)
11. [Middleware Personalizado](#11-middleware-personalizado)
12. [Frontend — Convenções React](#12-frontend--convenções-react)
13. [Design System](#13-design-system)
14. [Rotas (Wayfinder)](#14-rotas-wayfinder)
15. [Comandos Úteis](#15-comandos-úteis)
16. [Variáveis de Ambiente](#16-variáveis-de-ambiente)
17. [Módulos em Desenvolvimento](#17-módulos-em-desenvolvimento)

---

## 1. Visão Geral

O **Kutenga ERP** é uma aplicação web multi-empresa que permite gerir as operações de negócio de forma integrada: catálogo de produtos e serviços, controlo de stock multi-armazém, faturação completa, ponto de venda (POS), relatórios financeiros, gestão de utilizadores com roles e permissões granulares, e notificações automáticas em tempo real.

Cada empresa opera em contexto completamente isolado — os dados, utilizadores, configurações e documentos são exclusivos por empresa.

---

## 2. Stack Tecnológico

### Backend

| Pacote | Versão | Finalidade |
|---|---|---|
| `laravel/framework` | ^13.7 | Framework principal |
| `php` | ^8.3 | Linguagem servidor |
| `inertiajs/inertia-laravel` | ^3.0 | Bridge Laravel ↔ React |
| `laravel/fortify` | ^1.34 | Autenticação (login, registo, 2FA, reset password) |
| `spatie/laravel-permission` | ^7.4 | Roles & permissões |
| `spatie/laravel-activitylog` | `*` | Auditoria de acções |
| `spatie/simple-excel` | ^3.10 | Exportação Excel |
| `barryvdh/laravel-dompdf` | `*` | Geração de PDFs |
| `laravel/wayfinder` | ^0.1.14 | Rotas tipadas no frontend |
| `tightenco/ziggy` | ^2.6 | Helper `route()` no JS |

### Frontend

| Pacote | Versão | Finalidade |
|---|---|---|
| `react` | ^19.2 | UI framework |
| `typescript` | ^5.7 | Tipagem estática |
| `vite` | ^8.0 | Build tool |
| `tailwindcss` | ^4.0 | CSS utility framework |
| `@inertiajs/react` | ^3.0 | Adapter React para Inertia |
| `@radix-ui/*` | vários | Primitivas de UI acessíveis |
| `lucide-react` | ^0.475 | Ícones SVG |
| `sonner` | ^2.0 | Toast notifications |
| `babel-plugin-react-compiler` | ^1.0 | Optimizações automáticas React |

---

## 3. Requisitos do Sistema

- **PHP** ≥ 8.3 com extensões: `pdo`, `mbstring`, `openssl`, `tokenizer`, `xml`, `ctype`, `bcmath`
- **Composer** ≥ 2.x
- **Node.js** ≥ 20.x e **npm** ≥ 10.x (ou **pnpm**)
- **Base de dados**: SQLite (dev), MySQL 8+ ou PostgreSQL 14+ (produção)
- **Servidor local recomendado**: [Laravel Herd](https://herd.laravel.com/) ou `php artisan serve`

---

## 4. Instalação & Configuração

### Instalação rápida (um comando)

```bash
composer run setup
```

Este comando executa em sequência:

```
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --force
npm install
npm run build
```

### Instalação manual (passo a passo)

```bash
# 1. Clonar o repositório
git clone <repo-url> kutenga-erp
cd kutenga-erp

# 2. Instalar dependências PHP
composer install

# 3. Copiar e configurar o ambiente
cp .env.example .env
php artisan key:generate

# 4. Configurar a base de dados no .env e correr as migrações
php artisan migrate

# 5. Instalar dependências JS
npm install          # ou: pnpm install

# 6. Compilar assets
npm run dev          # desenvolvimento (hot reload)
npm run build        # produção
```

### Arrancar em modo desenvolvimento

```bash
# Opção A — tudo num só comando (servidor + queue + vite)
composer run dev

# Opção B — janelas separadas
php artisan serve
php artisan queue:listen --tries=1
npm run dev
```

> **Nota:** O `composer run dev` usa `concurrently` para correr os três processos em paralelo com cores distintas no terminal.

### Seeders & Dados de Exemplo

```bash
php artisan db:seed
```

---

## 5. Estrutura do Projecto

```
kutenga-erp-v2/
│
├── app/
│   ├── Actions/              # Business logic actions (single-responsibility)
│   ├── Concerns/             # Traits partilhados entre Models
│   ├── Console/
│   │   └── Commands/         # Artisan commands agendados
│   │       ├── CheckDocumentStatus.php   # Verifica faturas/cotações a expirar
│   │       └── CheckLowStock.php         # Verifica stock abaixo do mínimo
│   ├── Http/
│   │   ├── Controllers/      # Controllers por módulo
│   │   ├── Middleware/       # Middleware personalizado
│   │   └── Requests/         # Form Requests (validação)
│   ├── Mail/                 # Mailables (classes de email)
│   ├── Models/               # Eloquent Models
│   ├── Providers/            # Service Providers
│   ├── Services/
│   │   ├── Billing/          # Serviços de faturação (PDF, etc.)
│   │   └── Inventory/        # Serviços de inventário
│   └── Traits/               # Traits auxiliares
│
├── bootstrap/
│   └── app.php               # Configuração de middleware e exceções
│
├── database/
│   ├── migrations/           # 35+ migrações ordenadas cronologicamente
│   ├── factories/
│   └── seeders/
│
├── resources/
│   ├── css/
│   │   └── app.css           # Design tokens, dark mode (.dark), variáveis CSS
│   └── js/
│       ├── app.tsx           # Entry point React/Inertia
│       ├── pages/            # Páginas Inertia (uma por rota)
│       │   ├── auth/         # Login, registo, reset password
│       │   ├── billing/      # Faturas, cotações, clientes, séries
│       │   ├── inventory/    # Armazéns, ajustes, transferências, stock
│       │   ├── pos/          # Terminal POS, turnos, relatórios POS
│       │   ├── products/     # Produtos & serviços
│       │   ├── categories/   # Categorias
│       │   ├── brands/       # Marcas
│       │   ├── units/        # Unidades de medida
│       │   ├── reports/      # Relatórios financeiros
│       │   ├── notifications/# Página de notificações
│       │   ├── settings/     # Configurações (empresa, perfil, auditoria)
│       │   ├── users/        # Utilizadores e roles
│       │   ├── docs/         # Manual do utilizador
│       │   ├── onboarding/   # Fluxo de onboarding inicial
│       │   ├── dashboard.tsx # Dashboard principal
│       │   └── index.tsx     # Landing page pública
│       ├── components/
│       │   ├── ui/           # Design system (brand.tsx, shadcn/ui)
│       │   ├── app-sidebar.tsx
│       │   ├── app-header.tsx
│       │   ├── notifications-dropdown.tsx
│       │   └── inactivity-lock.tsx
│       ├── layouts/
│       │   ├── kutenga-layout.tsx  # Layout principal (sidebar + header)
│       │   ├── pos-layout.tsx      # Layout do terminal POS
│       │   └── auth-layout.tsx     # Layout de autenticação
│       ├── hooks/            # Custom React hooks (useAppearance, etc.)
│       ├── contexts/         # React contexts (ConfirmDeleteContext)
│       ├── lib/              # Utilitários (cn, formatCurrency)
│       ├── types/            # Tipos TypeScript globais
│       └── routes/           # Rotas geradas pelo Wayfinder
│
├── routes/
│   ├── web.php               # Todas as rotas web (agrupadas por permissão)
│   ├── settings.php          # Rotas de configurações
│   └── console.php           # Agendamento de schedules
│
└── vite.config.ts            # Build config (Tailwind, Wayfinder, React Compiler)
```

---

## 6. Arquitectura Multi-Empresa

O sistema implementa **multi-tenancy por coluna** (soft multi-tenancy): cada registo nas tabelas principais possui um `company_id`.

### Middleware `SetCompanyContext`

Aplicado globalmente a todas as rotas autenticadas. Resolve a empresa activa do utilizador com base na sessão e injeta o contexto via `app()->instance('currentCompany', $company)`.

```php
// bootstrap/app.php
$middleware->web(append: [
    HandleAppearance::class,
    HandleInertiaRequests::class,
    CheckOnboarding::class,
    SetCompanyContext::class,  // ← injeta a empresa activa
]);
```

### Middleware `CheckOnboarding`

Redireciona para `/onboarding` se a empresa do utilizador ainda não concluiu o processo de configuração inicial.

### Troca de Empresa

Um utilizador pode pertencer a múltiplas empresas. A empresa activa é trocada via `POST /context/switch` e a preferência é guardada na sessão.

---

## 7. Módulos

### 7.1 Catálogo

**Rotas:** `GET|POST|PATCH|DELETE /products`, `/categories`, `/brands`, `/units`, `/branches`

- Suporte a dois tipos: **Produto** (rastreável, com stock) e **Serviço** (sem stock)
- Categorias hierárquicas (categoria pai opcional)
- Upload de imagem de produto

**Permissões:** `catalog.view`, `catalog.edit`

---

### 7.2 Inventário

**Rotas prefix:** `/inventory/*`

- Dashboard com KPIs de stock
- Gestão de armazéns (multi-armazém por empresa)
- Balanço de abertura (`/inventory/opening`)
- Movimentos de stock com filtros e paginação
- **Ajustes de stock** — fluxo: Rascunho → Completado | Cancelado
- **Transferências inter-armazém** — fluxo: Pendente → Aprovado → Completado | Cancelado
- Alerta automático de stock mínimo **no momento da venda** (sem depender de schedule)

**Permissões:** `inventory.view`, `inventory.adjust`, `inventory.transfer`

---

### 7.3 Faturação

**Rotas prefix:** `/billing/*`

| Documento | Rota base | Fluxo |
|---|---|---|
| Cotação | `/billing/quotes` | Rascunho → Confirmado → Cancelado |
| Fatura a Crédito | `/billing/invoices` | Rascunho → Confirmado → Pago/Cancelado |
| Fatura-Recibo | `/billing/receipts` | Rascunho → Confirmado → Cancelado |
| Nota de Crédito | `/billing/credit-notes` | Rascunho → Confirmado → Cancelado |
| Nota de Débito | `/billing/debit-notes` | Rascunho → Confirmado → Cancelado |

- Todos os documentos partilham o modelo `Document` (Single Table com discriminação por `type`)
- Séries de documentos configuráveis por tipo (`DocumentSeries`)
- Geração de PDF via `barryvdh/laravel-dompdf`
- Envio por email via job assíncrono
- Abate de stock automático ao confirmar fatura (apenas produtos rastreáveis)
- Registo de pagamentos parciais e controlo de saldo em dívida

**Permissões:** `sales.view`, `sales.create`, `sales.cancel`, `invoice.view`, `invoice.create`, `invoice.cancel`

---

### 7.4 Ponto de Venda (POS)

**Rotas prefix:** `/pos/*`

- Terminal de ecrã completo com layout dedicado (`pos-layout.tsx`)
- Gestão de turnos/sessões de caixa (`PosShift`)
- Vendas registadas como documentos do tipo `receipt`
- Relatórios de desempenho por turno

**Permissões:** `sales.view`, `sales.create`

---

### 7.5 Relatórios

**Rotas:** `GET /reports`, `GET /reports/data`, `GET /reports/export/pdf`, `GET /reports/export/excel`

- Dados carregados via fetch API (sem Inertia — resposta JSON pura)
- Filtros por período e categoria
- Exportação PDF via DomPDF e Excel via `spatie/simple-excel`

**Acesso:** `role:Admin|owner|Manager`

---

### 7.6 Notificações

**Rotas:** `GET /notifications`, `POST /notifications/{id}/read`, `POST /notifications/mark-all-read`

- Modelo `SystemNotification` armazenado em base de dados
- Dropdown em tempo real no cabeçalho (`notifications-dropdown.tsx`)
- Tipos de notificação: `low_stock`, `invoice_expiring`, `invoice_overdue`, `invoice_paid`, `user_created`, `stock_entry`, `new_product`
- Canal opcional de email (configurável por empresa)

---

### 7.7 Configurações da Empresa

**Rotas prefix:** `/settings/*` (settings.php)

Inclui: dados da empresa, NUIT, logo, carimbo, SMTP personalizado, taxas de imposto, moeda padrão, contas bancárias, prefixos de séries, prazo de vencimento padrão, notificações por email.

---

### 7.8 Auditoria

**Rota:** `GET /settings/audits`

Powered by `spatie/laravel-activitylog`. Todos os modelos principais registam automaticamente as alterações com o valor anterior e o novo valor.

**Permissão:** `audits.view`

---

## 8. Roles & Permissões

Usa `spatie/laravel-permission`. Os roles são **escopados por empresa** (`company_id` na tabela `roles`).

### Roles disponíveis

| Role | Descrição |
|---|---|
| `owner` | Proprietário da empresa — acesso total |
| `Admin` | Administrador — quase total, exceto algumas configurações críticas |
| `Manager` | Gestor — catálogo, inventário, faturação, relatórios |
| `Seller` | Vendedor — cotações, faturas, POS |
| `Stockist` | Responsável de stock — inventário e armazéns |

### Permissões granulares

```
catalog.view     catalog.edit
inventory.view   inventory.adjust   inventory.transfer
sales.view       sales.create       sales.cancel
invoice.view     invoice.create     invoice.cancel
audits.view
users.view       users.edit
```

### Aplicação nas Rotas

```php
// Exemplo — routes/web.php
Route::middleware('can:inventory.adjust')->group(function () {
    Route::post('/adjustments', [StockAdjustmentController::class, 'store']);
});

Route::middleware('role:Admin|owner|Manager')->group(function () {
    Route::get('/reports', [ReportController::class, 'index']);
});
```

### Página de Acesso Negado

Quando um utilizador tenta aceder a uma rota sem permissão (`403`), o sistema renderiza a página Inertia `errors/error` com a mensagem personalizada, em vez da página de erro genérica do Laravel.

---

## 9. Queue, Jobs & Schedules

### Driver de Queue

Por defeito: `database` (tabela `jobs`). Em produção, recomenda-se Redis.

```env
QUEUE_CONNECTION=database   # ou redis
```

### Worker

```bash
php artisan queue:listen --tries=1     # desenvolvimento
php artisan queue:work --daemon        # produção (supervisor recomendado)
```

### Jobs Assíncronos

| Job | Disparado por | Acção |
|---|---|---|
| `SendDocumentEmail` | Confirmação de fatura / botão "Enviar Email" | Envia PDF por email ao cliente |
| `SendWelcomeEmail` | Conclusão do onboarding | Email de boas-vindas ao owner |
| `SendUserCreatedEmail` | Criação de utilizador | Email de credenciais ao novo user |
| `SendLowStockAlert` | Abate de stock abaixo do mínimo | Alerta de stock baixo por email |
| `SendInvoiceOverdueAlert` | Schedule diário | Alerta de fatura vencida por email |

### Schedules (Tarefas Agendadas)

Definidas em `routes/console.php`. Requerem o cron do Laravel:

```bash
# Adicionar ao crontab do servidor
* * * * * php /path/to/artisan schedule:run >> /dev/null 2>&1
```

| Comando | Frequência | Acção |
|---|---|---|
| `CheckDocumentStatus` | Diário | Verifica faturas/cotações a expirar e expiradas; cria notificações e envia emails |
| `CheckLowStock` | Diário | Verifica produtos abaixo do stock mínimo (redundância do alerta em tempo real) |

> **Nota:** O alerta de stock baixo também é emitido **em tempo real** no momento do abate, sem esperar pelo schedule.

---

## 10. Emails (Mailables)

Todas as classes Mailable estão em `app/Mail/`:

| Classe | Trigger |
|---|---|
| `WelcomeToKutenga` | Registo / onboarding completo |
| `UserCreatedMail` | Criação de novo utilizador pela empresa |
| `DocumentMail` | Envio de fatura/cotação/recibo ao cliente |
| `InvoiceOverdueMail` | Fatura vencida (via schedule) |
| `LowStockAlertMail` | Stock abaixo do mínimo |

### SMTP por Empresa

O SMTP pode ser configurado individualmente por empresa nas Configurações → Sistema. O sistema sobrescreve dinamicamente a configuração de email do Laravel antes de enviar (`config(['mail.mailers.smtp' => ...])`).

---

## 11. Middleware Personalizado

| Classe | Localização | Acção |
|---|---|---|
| `SetCompanyContext` | `app/Http/Middleware/` | Resolve e injeta a empresa activa no container IoC |
| `CheckOnboarding` | `app/Http/Middleware/` | Redireciona para `/onboarding` se empresa incompleta |
| `HandleAppearance` | `app/Http/Middleware/` | Lê o cookie `appearance` e define o tema (light/dark/system) |
| `HandleInertiaRequests` | `app/Http/Middleware/` | Partilha dados globais com o frontend via `Inertia::share()` |

### Dados partilhados via `HandleInertiaRequests`

```php
// Disponíveis em todas as páginas como props Inertia
[
    'auth'           => auth()->user(),
    'currentCompany' => $currentCompany,
    'flash'          => session()->only(['success', 'error', 'warning', 'info']),
    'sidebarOpen'    => session('sidebar_state', true),
    'notifications'  => $unreadNotifications,
]
```

---

## 12. Frontend — Convenções React

### Layout de Página

Cada página Inertia define o seu layout e breadcrumbs através da propriedade estática `.layout`:

```tsx
// Padrão actual no projecto
export default function MyPage() { ... }

MyPage.layout = {
    breadcrumbs: [
        { title: 'Módulo', href: '/modulo' },
        { title: 'Sub-página', href: '/modulo/sub' },
    ],
};
```

O `AppShell` global aplica o `KutengaLayout` automaticamente e injeta os breadcrumbs.

### Flash Messages

As mensagens de sucesso/erro são exibidas automaticamente via `sonner` (toast) a partir das flash sessions do Laravel:

```php
// Controller
return redirect()->back()->with('success', 'Produto criado com sucesso!');
return redirect()->back()->with('error', 'Ocorreu um erro.');
```

```tsx
// kutenga-layout.tsx — lido e exibido automaticamente
if (props.flash?.success) toast.success(props.flash.success);
if (props.flash?.error)   toast.error(props.flash.error);
```

### Confirmação de Delete

Todos os botões de eliminar usam o `ConfirmDeleteProvider` / `useConfirmDelete` — nunca usar `window.confirm()`:

```tsx
const { confirm } = useConfirmDelete();

confirm({
    title: 'Eliminar produto?',
    description: 'Esta acção é irreversível.',
    onConfirm: () => router.delete(`/products/${id}`),
});
```

### Dark Mode

Gerido pelo hook `useAppearance` que lê/escreve o cookie `appearance`. O CSS usa a classe `.dark` no elemento root com variáveis CSS completas em `resources/css/app.css`.

---

## 13. Design System

Todos os componentes de UI partilhados estão em `resources/js/components/ui/brand.tsx`:

```tsx
import { PageHeader, KpiCard, TableCard, PrimaryButton, OutlineButton, StockBadge } from '@/components/ui/brand';
```

### Componentes Principais

| Componente | Uso |
|---|---|
| `<PageHeader title subtitle actions />` | Cabeçalho padrão de todas as páginas internas |
| `<KpiCard label value icon accent />` | Card de métrica (KPI) com acento de cor |
| `<TableCard>` | Container de tabela com borda e sombra padrão |
| `<PrimaryButton>` | Botão CTA — dourado `#E8A020` |
| `<OutlineButton>` | Botão secundário — borda e fundo card |
| `<StockBadge status />` | Badge de estado de stock |

### Paleta de Cores de Acento

| Nome | Hex | Uso |
|---|---|---|
| `teal` | `#2DB8A0` | Cor principal — acções, links, stock em stock |
| `gold` | `#E8A020` | Cor secundária — CTAs, alertas de atenção |
| `orange` | `orange-500` | Contas a receber, alertas |
| `red` | `red-500` | Erro, esgotado, cancelado |
| `slate` | `slate-600` | Neutro, inactivo |

### Bordas & Raios

Todos os elementos usam `rounded-[4px]` (4px) como raio padrão — nunca `rounded-md` ou `rounded-lg`.

### Tipografia

Fonte: **Instrument Sans** (carregada via Bunny Fonts no Vite).

---

## 14. Rotas (Wayfinder)

O projecto usa [`laravel/wayfinder`](https://github.com/laravel/wayfinder) para gerar automaticamente funções TypeScript tipadas para cada rota nomeada do Laravel.

As rotas são geradas automaticamente durante o build ou podem ser regeneradas manualmente:

```bash
php artisan wayfinder:generate
```

Uso no frontend:

```tsx
import { dashboard, inventoryDashboard } from '@/routes';

// Em vez de strings hardcoded:
<Link href={dashboard()}>Dashboard</Link>
<Link href={inventoryDashboard()}>Inventário</Link>
```

---

## 15. Comandos Úteis

```bash
# Desenvolvimento
composer run dev                        # Servidor + queue + vite em paralelo
php artisan serve                       # Só o servidor
npm run dev                             # Só o Vite (hot reload)

# Base de dados
php artisan migrate                     # Correr migrações pendentes
php artisan migrate:fresh --seed        # Reset total + seed
php artisan db:seed                     # Só seeders

# Queue
php artisan queue:listen --tries=1      # Worker de desenvolvimento
php artisan queue:work --daemon         # Worker de produção

# Schedules (teste manual)
php artisan app:check-document-status   # Verificar faturas/cotações
php artisan app:check-low-stock         # Verificar stock baixo

# Assets
npm run build                           # Build de produção
npm run format                          # Formatar código (Prettier)
npm run lint                            # Lint (ESLint + fix)
npm run types:check                     # Verificar tipos TypeScript

# Qualidade de código PHP
./vendor/bin/pint                       # Formatar PHP (Laravel Pint)
php artisan test                        # Correr testes PHPUnit

# Wayfinder
php artisan wayfinder:generate          # Regenerar rotas tipadas TS
```

---

## 16. Variáveis de Ambiente

Ficheiro base: `.env.example`

### Essenciais

```env
APP_NAME="Kutenga ERP"
APP_ENV=local                   # local | production
APP_KEY=                        # Gerado por: php artisan key:generate
APP_DEBUG=true                  # false em produção
APP_URL=http://localhost
```

### Base de Dados

```env
# SQLite (desenvolvimento)
DB_CONNECTION=sqlite

# MySQL (produção — descomentar e configurar)
# DB_CONNECTION=mysql
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_DATABASE=kutenga_erp
# DB_USERNAME=root
# DB_PASSWORD=secret
```

### Queue & Cache

```env
QUEUE_CONNECTION=database    # database | redis (produção)
CACHE_STORE=database         # database | redis (produção)
SESSION_DRIVER=database
SESSION_LIFETIME=120
```

### Email (Padrão do Sistema)

```env
MAIL_MAILER=log              # log (dev) | smtp (produção)
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USERNAME=user@example.com
MAIL_PASSWORD=secret
MAIL_FROM_ADDRESS=noreply@example.com
MAIL_FROM_NAME="Kutenga ERP"
```

> **Nota:** As configurações SMTP por empresa (definidas nas Configurações → Sistema) sobrescrevem estas variáveis em runtime para os emails enviados em nome da empresa.

---

## 17. Módulos em Desenvolvimento

Os seguintes módulos estão planeados para versões futuras:

| Módulo | Descrição |
|---|---|
| **Compras** | Encomendas a fornecedores, recepção de mercadoria, contas a pagar |
| **Finanças & Contabilidade** | Plano de contas, lançamentos contabilísticos, balancetes, DRE |
| **Recursos Humanos (RH)** | Colaboradores, contratos, processamento salarial, presenças |
| **Logística & Expedição** | Entregas, transportadoras, rastreamento de encomendas |
| **Projetos & Ordens de Trabalho** | Gestão de projectos, tarefas, ordens de produção |
| **Manutenção** | Planos de manutenção preventiva e correctiva de equipamentos |
| **Subscrições & Planos** | Planos por empresa com limites de uso e ecrãs de bloqueio |
| **Onboarding Wizard** | Fluxo multi-passo com recolha completa de dados da empresa |

---

## Contribuição

1. Crie um branch a partir de `main`: `git checkout -b feat/nome-da-funcionalidade`
2. Siga as convenções de código existentes (Pint para PHP, ESLint/Prettier para TS/TSX)
3. Escreva testes para lógica de negócio crítica (`tests/Feature/`)
4. Submeta um Pull Request com descrição clara das alterações

### Verificação antes de commit

```bash
composer run lint           # PHP
npm run lint:check          # TypeScript/TSX
npm run format:check        # Prettier
npm run types:check         # TypeScript strict
php artisan test            # PHPUnit
```

---

<div align="center">

**Kutenga ERP** · Desenvolvido com ❤️ em Moçambique

</div>
