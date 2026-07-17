import React, { useState } from "react";
import { Head } from "@inertiajs/react";
import {
    BookOpen, LayoutGrid, Package, Warehouse, Receipt,
    ShoppingCart, Users, Settings, Bell, BarChart,
    ChevronRight, ChevronDown, Search, PlayCircle,
    CheckCircle2, AlertCircle, Info, Lock,
    Star, Lightbulb, HelpCircle,
    ShoppingBag, DollarSign, UserCheck, Truck,
    ClipboardList, Hammer, Clock3,
} from "lucide-react";
import { PageHeader } from "@/components/ui/brand";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface GuideSection {
    heading: string;
    body: React.ReactNode;
}

interface Guide {
    id: string;
    icon: React.ReactNode;
    title: string;
    category: string;
    accentColor: string;
    iconBg: string;
    summary: string;
    sections: GuideSection[];
}

// ─── Guide Data ───────────────────────────────────────────────────────────────

function useDashboardGuide(): Guide {
    return {
        id: "dashboard",
        icon: <LayoutGrid className="h-5 w-5" />,
        title: "Dashboard",
        category: "Geral",
        accentColor: "text-[#2DB8A0]",
        iconBg: "bg-[#2DB8A0]/10",
        summary: "O painel principal do seu negócio. Indicadores e resumos à primeira vista.",
        sections: [
            {
                heading: "O que encontra no Dashboard",
                body: (
                    <div className="space-y-3 text-sm text-muted-foreground">
                        <p>O Dashboard é a primeira página após o login. Contém:</p>
                        <ul className="space-y-2 mt-2">
                            {[
                                "Total faturado — valor total de faturas emitidas",
                                "Contas a receber — valor em dívida pelos clientes",
                                "Total de clientes cadastrados",
                                "Total de produtos/serviços no catálogo",
                                "Alertas de stock baixo",
                                "Gráfico de vendas mensais",
                                "Últimas vendas e movimentos de stock recentes",
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-[#2DB8A0] flex-shrink-0 mt-0.5" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ),
            },
            {
                heading: "Atalhos rápidos",
                body: (
                    <p className="text-sm text-muted-foreground">
                        Na parte inferior do dashboard encontra atalhos para os módulos mais usados:
                        {" "}<strong className="text-foreground">Inventário</strong>,
                        {" "}<strong className="text-foreground">Catálogo</strong> e
                        {" "}<strong className="text-foreground">Faturação</strong>.
                        Clique em qualquer um para ir directamente ao módulo.
                    </p>
                ),
            },
        ],
    };
}

function useCatalogGuide(): Guide {
    return {
        id: "catalog",
        icon: <Package className="h-5 w-5" />,
        title: "Catálogo de Produtos & Serviços",
        category: "Catálogo",
        accentColor: "text-[#E8A020]",
        iconBg: "bg-[#E8A020]/10",
        summary: "Registe todos os seus produtos e serviços, categorias, marcas e unidades de medida.",
        sections: [
            {
                heading: "Diferença entre Produto e Serviço",
                body: (
                    <div className="space-y-2 text-sm text-muted-foreground">
                        <p>Ao criar um item, escolha o tipo:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                            <div className="p-3 rounded-[4px] border border-border bg-muted/30">
                                <p className="font-semibold text-foreground text-sm mb-1">📦 Produto</p>
                                <p className="text-xs">Tem stock, marca e unidade de medida. O stock é controlado a cada venda.</p>
                            </div>
                            <div className="p-3 rounded-[4px] border border-border bg-muted/30">
                                <p className="font-semibold text-foreground text-sm mb-1">🛠️ Serviço</p>
                                <p className="text-xs">Não tem stock, marca nem unidade. Pode ser faturado sem afectar o inventário.</p>
                            </div>
                        </div>
                    </div>
                ),
            },
            {
                heading: "Como adicionar um produto",
                body: (
                    <ol className="space-y-3 text-sm text-muted-foreground">
                        {[
                            "Aceda a Catálogo → Produtos & Serviços no menu lateral.",
                            "Clique no botão 'Novo Produto' no canto superior direito.",
                            "Preencha o nome, tipo (produto ou serviço), categoria, preço de custo e venda.",
                            "Para produtos: seleccione a unidade de medida, marca e defina a quantidade mínima de alerta.",
                            "Faça upload da imagem (recomendado: formato quadrado, mín. 300×300 px).",
                            "Clique em 'Guardar'. O produto fica disponível para faturação imediatamente.",
                        ].map((s, i) => (
                            <li key={i} className="flex gap-3">
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#E8A020]/10 text-[#E8A020] text-xs font-bold flex-shrink-0">
                                    {i + 1}
                                </span>
                                <span className="mt-0.5">{s}</span>
                            </li>
                        ))}
                    </ol>
                ),
            },
            {
                heading: "Categorias, Marcas e Unidades",
                body: (
                    <div className="text-sm text-muted-foreground space-y-2">
                        <p>Configure estas entidades de apoio antes de criar produtos:</p>
                        <ul className="space-y-1.5 mt-2">
                            <li><strong className="text-foreground">Categorias</strong> — organize por família (ex: Electrónica, Vestuário). A categoria pai é opcional.</li>
                            <li><strong className="text-foreground">Marcas</strong> — registe as marcas dos seus produtos (ex: Samsung, Nike).</li>
                            <li><strong className="text-foreground">Unidades</strong> — define a unidade de medida (ex: Unidade, Kg, Litro, Caixa).</li>
                        </ul>
                    </div>
                ),
            },
        ],
    };
}

function useInventoryGuide(): Guide {
    return {
        id: "inventory",
        icon: <Warehouse className="h-5 w-5" />,
        title: "Inventário & Stock",
        category: "Inventário",
        accentColor: "text-[#2DB8A0]",
        iconBg: "bg-[#2DB8A0]/10",
        summary: "Controle o stock em múltiplos armazéns, realize ajustes, transferências e acompanhe movimentos.",
        sections: [
            {
                heading: "Dashboard de Inventário",
                body: (
                    <p className="text-sm text-muted-foreground">
                        Aceda em <strong className="text-foreground">Inventário → Dashboard</strong> para ver:
                        total em stock, produtos com stock baixo, produtos esgotados e movimentos recentes.
                    </p>
                ),
            },
            {
                heading: "Balanço de Abertura (Stock Inicial)",
                body: (
                    <div className="space-y-2 text-sm text-muted-foreground">
                        <p>Se está a começar com stock já existente, registe o stock inicial:</p>
                        <ol className="space-y-2 mt-2">
                            {[
                                "Aceda a Inventário → Opening Balance.",
                                "Seleccione o armazém de destino.",
                                "Adicione os produtos e as quantidades iniciais.",
                                "Confirme para registar as quantidades no sistema.",
                            ].map((s, i) => (
                                <li key={i} className="flex gap-2">
                                    <span className="text-[#2DB8A0] font-bold flex-shrink-0">{i + 1}.</span>
                                    {s}
                                </li>
                            ))}
                        </ol>
                    </div>
                ),
            },
            {
                heading: "Ajustes de Stock",
                body: (
                    <div className="space-y-2 text-sm text-muted-foreground">
                        <p>Use ajustes para corrigir quantidades ou registar perdas/quebras:</p>
                        <ol className="space-y-2 mt-2">
                            {[
                                "Aceda a Inventário → Ajustes de Stock → Novo Ajuste.",
                                "Seleccione o armazém, o motivo e a data.",
                                "Adicione os produtos e as quantidades (positivo = entrada, negativo = saída).",
                                "Clique em 'Completar'. Após confirmação não pode ser alterado.",
                            ].map((s, i) => (
                                <li key={i} className="flex gap-2">
                                    <span className="text-[#2DB8A0] font-bold flex-shrink-0">{i + 1}.</span>
                                    {s}
                                </li>
                            ))}
                        </ol>
                        <div className="flex gap-2 mt-3 p-3 bg-amber-50 dark:bg-amber-500/10 rounded-[4px] border border-amber-200 dark:border-amber-500/20">
                            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-700 dark:text-amber-300">Um ajuste em <strong>Rascunho</strong> pode ser cancelado. Após <strong>Completar</strong>, o ajuste é definitivo.</p>
                        </div>
                    </div>
                ),
            },
            {
                heading: "Transferências entre Armazéns",
                body: (
                    <div className="space-y-2 text-sm text-muted-foreground">
                        <p>Mova stock de um armazém para outro sem perdas:</p>
                        <ol className="space-y-2 mt-2">
                            {[
                                "Aceda a Inventário → Transferências → Nova Transferência.",
                                "Seleccione o armazém de origem e o de destino.",
                                "Adicione os produtos e as quantidades a transferir.",
                                "Envie a transferência. O responsável deve aprová-la.",
                                "Após aprovação, clique em 'Completar' para efetivar a movimentação.",
                            ].map((s, i) => (
                                <li key={i} className="flex gap-2">
                                    <span className="text-[#2DB8A0] font-bold flex-shrink-0">{i + 1}.</span>
                                    {s}
                                </li>
                            ))}
                        </ol>
                    </div>
                ),
            },
            {
                heading: "Alertas de Stock Baixo",
                body: (
                    <p className="text-sm text-muted-foreground">
                        Quando o stock atinge a <strong className="text-foreground">quantidade mínima</strong> definida no produto,
                        o sistema gera automaticamente uma notificação. Consulte os alertas no ícone 🔔 no topo ou na página{" "}
                        <strong className="text-foreground">Notificações</strong>.
                    </p>
                ),
            },
        ],
    };
}

function useBillingGuide(): Guide {
    return {
        id: "billing",
        icon: <Receipt className="h-5 w-5" />,
        title: "Faturação",
        category: "Faturação",
        accentColor: "text-[#2DB8A0]",
        iconBg: "bg-[#2DB8A0]/10",
        summary: "Emita cotações, faturas, recibos, notas de crédito e débito. Envie por email e acompanhe pagamentos.",
        sections: [
            {
                heading: "Tipos de Documentos",
                body: (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        {[
                            { name: "Cotação", desc: "Proposta comercial sem compromisso financeiro. Pode ser convertida em fatura." },
                            { name: "Fatura a Crédito", desc: "Documento com prazo de pagamento. Controla contas a receber." },
                            { name: "Fatura-Recibo", desc: "Venda com pagamento imediato. Combina fatura e recibo num só." },
                            { name: "Nota de Crédito", desc: "Devolução total ou parcial de um valor faturado." },
                            { name: "Nota de Débito", desc: "Cobrança adicional sobre um documento já emitido." },
                        ].map((d, i) => (
                            <div key={i} className="p-3 rounded-[4px] border border-border bg-muted/30">
                                <p className="font-semibold text-foreground text-sm mb-1">📄 {d.name}</p>
                                <p className="text-xs text-muted-foreground">{d.desc}</p>
                            </div>
                        ))}
                    </div>
                ),
            },
            {
                heading: "Como emitir uma Fatura",
                body: (
                    <ol className="space-y-3 text-sm text-muted-foreground">
                        {[
                            "Aceda a Faturação → Faturas a Crédito (ou Faturas-Recibo).",
                            "Clique em 'Nova Fatura'.",
                            "Seleccione o cliente. Se não existe, crie-o em Faturação → Clientes.",
                            "Adicione os produtos/serviços. Os preços vêm do catálogo automaticamente.",
                            "Defina a data de emissão e o prazo de vencimento.",
                            "Clique em 'Confirmar'. O stock é abatido automaticamente.",
                            "Para enviar por email, clique em 'Enviar por Email' na página da fatura.",
                        ].map((s, i) => (
                            <li key={i} className="flex gap-3">
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2DB8A0]/10 text-[#2DB8A0] text-xs font-bold flex-shrink-0">
                                    {i + 1}
                                </span>
                                <span className="mt-0.5">{s}</span>
                            </li>
                        ))}
                    </ol>
                ),
            },
            {
                heading: "Registar um Pagamento",
                body: (
                    <div className="space-y-2 text-sm text-muted-foreground">
                        <p>Para faturas a crédito, registe os pagamentos recebidos:</p>
                        <ol className="space-y-2 mt-2">
                            {[
                                "Abra a fatura em questão.",
                                "Clique em 'Registar Pagamento'.",
                                "Indique o valor pago e a data.",
                                "O sistema actualiza automaticamente o saldo em dívida.",
                            ].map((s, i) => (
                                <li key={i} className="flex gap-2">
                                    <span className="text-[#2DB8A0] font-bold">{i + 1}.</span>
                                    {s}
                                </li>
                            ))}
                        </ol>
                    </div>
                ),
            },
            {
                heading: "Séries de Documentos",
                body: (
                    <div className="space-y-2 text-sm text-muted-foreground">
                        <p>Aceda a <strong className="text-foreground">Faturação → Séries</strong> para configurar a numeração dos documentos.</p>
                        <div className="flex gap-2 p-3 bg-blue-50 dark:bg-blue-500/10 rounded-[4px] border border-blue-200 dark:border-blue-500/20 mt-1">
                            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-blue-700 dark:text-blue-300">
                                Configure as séries antes de emitir os primeiros documentos. Exemplo: prefixo{" "}
                                <code className="font-mono">FT2026/</code> gerará FT2026/1, FT2026/2, etc.
                            </p>
                        </div>
                    </div>
                ),
            },
            {
                heading: "Descarregar o PDF",
                body: (
                    <p className="text-sm text-muted-foreground">
                        Em qualquer documento confirmado, clique em{" "}
                        <strong className="text-foreground">Descarregar PDF</strong> para obter
                        a versão impressa com os dados da empresa, logotipo e carimbo.
                    </p>
                ),
            },
        ],
    };
}

function usePosGuide(): Guide {
    return {
        id: "pos",
        icon: <ShoppingCart className="h-5 w-5" />,
        title: "Ponto de Venda (POS)",
        category: "Vendas",
        accentColor: "text-[#E8A020]",
        iconBg: "bg-[#E8A020]/10",
        summary: "Terminal de venda rápida para balcão. Ideal para vendas a retalho com pagamento imediato.",
        sections: [
            {
                heading: "Como usar o POS",
                body: (
                    <ol className="space-y-3 text-sm text-muted-foreground">
                        {[
                            "Aceda a Ponto de Venda → Abrir Turno e registe o fundo de caixa inicial.",
                            "Após abrir o turno, clique em 'Ir para o POS'.",
                            "No terminal, pesquise ou clique nos produtos para adicioná-los ao carrinho.",
                            "Ajuste as quantidades directamente no carrinho.",
                            "Clique em 'Finalizar Venda', seleccione o método de pagamento e confirme.",
                            "O sistema emite o documento de venda e actualiza o stock automaticamente.",
                        ].map((s, i) => (
                            <li key={i} className="flex gap-3">
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#E8A020]/10 text-[#E8A020] text-xs font-bold flex-shrink-0">
                                    {i + 1}
                                </span>
                                <span className="mt-0.5">{s}</span>
                            </li>
                        ))}
                    </ol>
                ),
            },
            {
                heading: "Fechar o Turno",
                body: (
                    <div className="space-y-2 text-sm text-muted-foreground">
                        <p>No final do dia ou do turno:</p>
                        <ol className="space-y-2 mt-2">
                            {[
                                "Aceda a Ponto de Venda → Turnos / Sessões.",
                                "Clique no turno activo.",
                                "Seleccione 'Fechar Turno' e registe o valor em caixa.",
                                "O sistema gera automaticamente o relatório de fecho do turno.",
                            ].map((s, i) => (
                                <li key={i} className="flex gap-2">
                                    <span className="text-[#E8A020] font-bold">{i + 1}.</span>
                                    {s}
                                </li>
                            ))}
                        </ol>
                    </div>
                ),
            },
        ],
    };
}

function useReportsGuide(): Guide {
    return {
        id: "reports",
        icon: <BarChart className="h-5 w-5" />,
        title: "Relatórios",
        category: "Relatórios",
        accentColor: "text-[#2DB8A0]",
        iconBg: "bg-[#2DB8A0]/10",
        summary: "Analise a performance do negócio com relatórios filtráveis por período. Exporte em PDF ou Excel.",
        sections: [
            {
                heading: "Como gerar um relatório",
                body: (
                    <ol className="space-y-3 text-sm text-muted-foreground">
                        {[
                            "Aceda a Relatórios no menu lateral.",
                            "Seleccione o tipo de relatório no topo (Vendas, Clientes, Inventário, etc.).",
                            "Defina o período usando os campos de data de início e fim.",
                            "O relatório é actualizado automaticamente ao alterar os filtros.",
                            "Para exportar, clique em 'PDF' ou 'Excel' conforme pretende.",
                        ].map((s, i) => (
                            <li key={i} className="flex gap-3">
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2DB8A0]/10 text-[#2DB8A0] text-xs font-bold flex-shrink-0">
                                    {i + 1}
                                </span>
                                <span className="mt-0.5">{s}</span>
                            </li>
                        ))}
                    </ol>
                ),
            },
        ],
    };
}

function useNotificationsGuide(): Guide {
    return {
        id: "notifications",
        icon: <Bell className="h-5 w-5" />,
        title: "Notificações",
        category: "Geral",
        accentColor: "text-[#2DB8A0]",
        iconBg: "bg-[#2DB8A0]/10",
        summary: "Alertas automáticos sobre eventos importantes: stock baixo, faturas a vencer, novos utilizadores.",
        sections: [
            {
                heading: "Como ver as notificações",
                body: (
                    <div className="space-y-2 text-sm text-muted-foreground">
                        <p>Existem duas formas de consultar notificações:</p>
                        <ul className="space-y-2 mt-2">
                            <li className="flex gap-2">
                                <CheckCircle2 className="h-4 w-4 text-[#2DB8A0] flex-shrink-0 mt-0.5" />
                                <span><strong className="text-foreground">Sino no cabeçalho</strong> — veja as notificações recentes clicando no ícone 🔔 em qualquer página.</span>
                            </li>
                            <li className="flex gap-2">
                                <CheckCircle2 className="h-4 w-4 text-[#2DB8A0] flex-shrink-0 mt-0.5" />
                                <span><strong className="text-foreground">Página de Notificações</strong> — histórico completo com filtros em Notificações no menu lateral.</span>
                            </li>
                        </ul>
                    </div>
                ),
            },
            {
                heading: "Tipos de alertas",
                body: (
                    <div className="space-y-2">
                        {[
                            { emoji: "📦", label: "Stock Baixo",             desc: "Produto atingiu a quantidade mínima." },
                            { emoji: "⏰", label: "Fatura Prestes a Vencer", desc: "Fatura com prazo próximo do limite." },
                            { emoji: "🔴", label: "Fatura Vencida",          desc: "Fatura ultrapassou o prazo de pagamento." },
                            { emoji: "✅", label: "Fatura Paga",             desc: "Pagamento registado com sucesso." },
                            { emoji: "👤", label: "Novo Utilizador",          desc: "Um novo membro entrou na empresa." },
                        ].map((n, i) => (
                            <div key={i} className="flex items-center gap-3 p-2.5 rounded-[4px] border border-border/60 hover:border-[#2DB8A0]/30 transition-colors text-sm">
                                <span className="text-lg">{n.emoji}</span>
                                <div>
                                    <span className="font-medium text-foreground">{n.label}</span>
                                    <span className="text-muted-foreground"> — {n.desc}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ),
            },
        ],
    };
}

function useUsersGuide(): Guide {
    return {
        id: "users",
        icon: <Users className="h-5 w-5" />,
        title: "Utilizadores & Permissões",
        category: "Administração",
        accentColor: "text-slate-600",
        iconBg: "bg-slate-100 dark:bg-slate-800",
        summary: "Adicione membros da equipa, atribua funções e controle quem pode aceder a cada módulo.",
        sections: [
            {
                heading: "Como adicionar um utilizador",
                body: (
                    <ol className="space-y-3 text-sm text-muted-foreground">
                        {[
                            "Aceda a Utilizadores → Usuários no menu lateral.",
                            "Clique em 'Novo Utilizador'.",
                            "Preencha nome, email e palavra-passe.",
                            "Atribua uma função (role): Owner, Admin, Manager, Seller ou Stockist.",
                            "Clique em 'Guardar'. O utilizador receberá um email de boas-vindas.",
                        ].map((s, i) => (
                            <li key={i} className="flex gap-3">
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold flex-shrink-0">
                                    {i + 1}
                                </span>
                                <span className="mt-0.5">{s}</span>
                            </li>
                        ))}
                    </ol>
                ),
            },
            {
                heading: "Funções disponíveis (Roles)",
                body: (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="text-left pb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground pr-4">Função</th>
                                    <th className="text-left pb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Acesso</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { role: "Owner",    access: "Acesso total a todos os módulos, incluindo configurações e faturação." },
                                    { role: "Admin",    access: "Igual ao Owner, exceto algumas configurações críticas da empresa." },
                                    { role: "Manager",  access: "Catálogo, inventário, faturação e relatórios. Sem gestão de utilizadores." },
                                    { role: "Seller",   access: "Criação de cotações, faturas e acesso ao POS. Sem acesso ao stock." },
                                    { role: "Stockist", access: "Gestão de stock, ajustes e transferências. Sem acesso à faturação." },
                                ].map((r, i) => (
                                    <tr key={i} className="border-b border-border/50 last:border-0">
                                        <td className="py-2.5 pr-4">
                                            <span className="font-mono font-semibold text-foreground text-xs bg-muted px-1.5 py-0.5 rounded-[3px]">{r.role}</span>
                                        </td>
                                        <td className="py-2.5 text-muted-foreground">{r.access}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ),
            },
        ],
    };
}

function useSettingsGuide(): Guide {
    return {
        id: "settings",
        icon: <Settings className="h-5 w-5" />,
        title: "Configurações da Empresa",
        category: "Administração",
        accentColor: "text-slate-600",
        iconBg: "bg-slate-100 dark:bg-slate-800",
        summary: "Configure os dados da empresa, logotipo, SMTP de email, impostos, moeda e muito mais.",
        sections: [
            {
                heading: "Dados da Empresa",
                body: (
                    <div className="text-sm text-muted-foreground space-y-2">
                        <p>Aceda a <strong className="text-foreground">Configurações → Sistema</strong> para preencher:</p>
                        <ul className="space-y-1.5 mt-2">
                            {[
                                "Nome, NUIT, telefone e email da empresa",
                                "Morada completa",
                                "Logotipo (aparece nos documentos PDF)",
                                "Carimbo da empresa",
                                "Moeda padrão e taxa de imposto (IVA)",
                                "Prazo de vencimento padrão para faturas",
                                "Prefixos de séries de documentos",
                                "Contas bancárias para indicar nos documentos",
                            ].map((item, i) => (
                                <li key={i} className="flex gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-[#2DB8A0] flex-shrink-0 mt-0.5" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                ),
            },
            {
                heading: "Configurar Email (SMTP)",
                body: (
                    <div className="space-y-2 text-sm text-muted-foreground">
                        <p>Para o sistema enviar emails em nome da sua empresa:</p>
                        <ol className="space-y-2 mt-2">
                            {[
                                "Aceda a Configurações → Sistema → aba Email/SMTP.",
                                "Preencha o host SMTP, porta, utilizador e palavra-passe.",
                                "Compatível com Gmail, Outlook, Zoho ou qualquer servidor SMTP.",
                                "Clique em 'Testar Ligação' para confirmar.",
                            ].map((s, i) => (
                                <li key={i} className="flex gap-2">
                                    <span className="text-[#2DB8A0] font-bold">{i + 1}.</span>
                                    {s}
                                </li>
                            ))}
                        </ol>
                    </div>
                ),
            },
            {
                heading: "Auditoria",
                body: (
                    <p className="text-sm text-muted-foreground">
                        Aceda a <strong className="text-foreground">Configurações → Auditoria</strong> para ver um registo completo
                        de todas as acções realizadas: quem fez, o quê, quando e quais foram os valores anteriores e novos.
                    </p>
                ),
            },
        ],
    };
}

function useAccountGuide(): Guide {
    return {
        id: "account",
        icon: <Lock className="h-5 w-5" />,
        title: "Conta & Sessão",
        category: "Geral",
        accentColor: "text-slate-600",
        iconBg: "bg-slate-100 dark:bg-slate-800",
        summary: "Gira o seu perfil, palavra-passe e as definições de segurança da sessão.",
        sections: [
            {
                heading: "Recuperação de Palavra-passe",
                body: (
                    <ol className="space-y-2 text-sm text-muted-foreground">
                        {[
                            "Na página de login, clique em 'Esqueceu a palavra-passe?'.",
                            "Introduza o seu email e clique em 'Enviar link de recuperação'.",
                            "Aceda ao email e clique no link recebido.",
                            "Defina uma nova palavra-passe e confirme.",
                        ].map((s, i) => (
                            <li key={i} className="flex gap-2">
                                <span className="text-[#2DB8A0] font-bold">{i + 1}.</span>
                                {s}
                            </li>
                        ))}
                    </ol>
                ),
            },
            {
                heading: "Ecrã de Bloqueio por Inactividade",
                body: (
                    <div className="space-y-2 text-sm text-muted-foreground">
                        <p>
                            Por razões de segurança, o sistema bloqueia automaticamente a sessão após inactividade.
                            Para desbloquear, introduza a sua palavra-passe.
                        </p>
                        <div className="flex gap-2 p-3 bg-blue-50 dark:bg-blue-500/10 rounded-[4px] border border-blue-200 dark:border-blue-500/20">
                            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-blue-700 dark:text-blue-300">
                                A sessão não é encerrada — os seus dados são preservados. Apenas confirma a identidade.
                            </p>
                        </div>
                    </div>
                ),
            },
            {
                heading: "Modo Claro / Escuro",
                body: (
                    <p className="text-sm text-muted-foreground">
                        Alterne entre modo claro e escuro clicando no ícone ☀️/🌙 no cabeçalho (ao lado das notificações).
                        A preferência é guardada automaticamente.
                    </p>
                ),
            },
        ],
    };
}

// ─── Main Page ───────────────────────────────────────────────────────────────

const categories = ["Todos", "Geral", "Catálogo", "Inventário", "Faturação", "Vendas", "Relatórios", "Administração"];

export default function DocsUserManual() {
    const guides: Guide[] = [
        useDashboardGuide(),
        useCatalogGuide(),
        useInventoryGuide(),
        useBillingGuide(),
        usePosGuide(),
        useReportsGuide(),
        useNotificationsGuide(),
        useUsersGuide(),
        useSettingsGuide(),
        useAccountGuide(),
    ];

    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("Todos");
    const [openGuide, setOpenGuide] = useState<string | null>("dashboard");
    const [closedSections, setClosedSections] = useState<Record<string, boolean>>({});

    const filteredGuides = guides.filter(g => {
        const matchesCat = selectedCategory === "Todos" || g.category === selectedCategory;
        const q = search.toLowerCase();
        const matchesSearch =
            q === "" ||
            g.title.toLowerCase().includes(q) ||
            g.summary.toLowerCase().includes(q) ||
            g.sections.some(s => s.heading.toLowerCase().includes(q));
        return matchesCat && matchesSearch;
    });

    const toggleSection = (key: string) => {
        setClosedSections(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <>
            <Head title="Manual do Utilizador — Kutenga ERP" />

            <div className="flex flex-col gap-6 pb-8">
                {/* Page Header */}
                <PageHeader
                    title={
                        <span className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-[#2DB8A0]" />
                            Manual do Utilizador
                        </span>
                    }
                    subtitle="Aprenda a usar cada módulo do Kutenga ERP passo a passo."
                />

                {/* Quick Tips */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                        {
                            icon: <Lightbulb className="h-4 w-4" />,
                            color: "bg-[#E8A020]/10 text-[#E8A020] border-[#E8A020]/20",
                            text: "Use o menu lateral para navegar entre módulos. A seta colapsa ou expande a barra lateral.",
                        },
                        {
                            icon: <Bell className="h-4 w-4" />,
                            color: "bg-[#2DB8A0]/10 text-[#2DB8A0] border-[#2DB8A0]/20",
                            text: "O sino 🔔 no topo mostra notificações em tempo real. Um ponto vermelho indica alertas por ler.",
                        },
                        {
                            icon: <HelpCircle className="h-4 w-4" />,
                            color: "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700",
                            text: "Clique em qualquer módulo abaixo para ver o guia detalhado com instruções passo a passo.",
                        },
                    ].map((tip, i) => (
                        <div key={i} className={cn("flex gap-3 p-3.5 rounded-[4px] border text-sm", tip.color)}>
                            <span className="flex-shrink-0 mt-0.5">{tip.icon}</span>
                            <span>{tip.text}</span>
                        </div>
                    ))}
                </div>

                {/* Search & Category Filter */}
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Pesquisar no manual…"
                            className="pl-8 pr-3 h-9 text-sm border border-border rounded-[4px] bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#2DB8A0]/30 focus:border-[#2DB8A0] w-64 transition-colors"
                        />
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={cn(
                                    "px-3 h-8 text-xs font-medium rounded-[4px] border transition-colors",
                                    selectedCategory === cat
                                        ? "bg-[#2DB8A0] text-white border-[#2DB8A0]"
                                        : "bg-card text-muted-foreground border-border hover:text-foreground hover:border-[#2DB8A0]/40",
                                )}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Guide cards */}
                {filteredGuides.length === 0 ? (
                    <div className="bg-card border border-border rounded-[4px] p-12 text-center text-muted-foreground text-sm shadow-xs">
                        Nenhum guia encontrado para <strong>"{search}"</strong>.
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {filteredGuides.map(guide => {
                            const isOpen = openGuide === guide.id;
                            return (
                                <div
                                    key={guide.id}
                                    className={cn(
                                        "bg-card border rounded-[4px] shadow-xs overflow-hidden transition-colors duration-150",
                                        isOpen ? "border-[#2DB8A0]/40" : "border-border",
                                    )}
                                >
                                    {/* Guide header button */}
                                    <button
                                        onClick={() => setOpenGuide(isOpen ? null : guide.id)}
                                        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-accent/40 transition-colors"
                                    >
                                        <div className={cn("h-10 w-10 rounded-[4px] flex items-center justify-center flex-shrink-0", guide.iconBg, guide.accentColor)}>
                                            {guide.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-semibold text-foreground text-[15px]">{guide.title}</span>
                                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-[3px] bg-muted text-muted-foreground">
                                                    {guide.category}
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{guide.summary}</p>
                                        </div>
                                        <ChevronRight className={cn("h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform duration-200", isOpen && "rotate-90")} />
                                    </button>

                                    {/* Expanded sections */}
                                    {isOpen && (
                                        <div className="border-t border-border">
                                            {/* Header bar */}
                                            <div className="flex items-center gap-2 px-5 py-2.5 bg-muted/30 border-b border-border/50">
                                                <PlayCircle className="h-3.5 w-3.5 text-[#2DB8A0]" />
                                                <span className="text-xs text-muted-foreground font-medium">
                                                    {guide.sections.length} {guide.sections.length === 1 ? "secção" : "secções"}
                                                </span>
                                            </div>

                                            <div className="divide-y divide-border/50">
                                                {guide.sections.map((section, si) => {
                                                    const key = `${guide.id}-${si}`;
                                                    const isSecClosed = closedSections[key] === true;
                                                    return (
                                                        <div key={si}>
                                                            <button
                                                                onClick={() => toggleSection(key)}
                                                                className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-accent/30 transition-colors"
                                                            >
                                                                <span className="text-sm font-semibold text-foreground">{section.heading}</span>
                                                                <ChevronDown className={cn("h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform duration-150", isSecClosed && "-rotate-90")} />
                                                            </button>
                                                            {!isSecClosed && (
                                                                <div className="px-5 pb-5 pt-1">
                                                                    {section.body}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Coming Soon Modules */}
                <div className="bg-card border border-border rounded-[4px] shadow-xs overflow-hidden">
                    <div className="px-5 py-4 border-b border-border bg-muted/30">
                        <div className="flex items-center gap-2 mb-1">
                            <Clock3 className="h-5 w-5 text-[#E8A020]" />
                            <h2 className="text-[15px] font-semibold text-foreground">Módulos em Desenvolvimento</h2>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#E8A020]/10 text-[#E8A020] border border-[#E8A020]/20">EM BREVE</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            O Kutenga ERP está em constante evolução. Os módulos abaixo estão planeados e serão disponibilizados em versões futuras.
                        </p>
                    </div>
                    <div className="p-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {([
                                {
                                    icon: <ShoppingBag className="h-5 w-5" />,
                                    iconBg: "bg-violet-100 dark:bg-violet-500/10",
                                    iconColor: "text-violet-600 dark:text-violet-400",
                                    title: "Compras",
                                    desc: "Gestão de encomendas a fornecedores, recepção de mercadoria e controlo de contas a pagar.",
                                },
                                {
                                    icon: <DollarSign className="h-5 w-5" />,
                                    iconBg: "bg-green-100 dark:bg-green-500/10",
                                    iconColor: "text-green-600 dark:text-green-400",
                                    title: "Finanças & Contabilidade",
                                    desc: "Plano de contas, lançamentos contabilísticos, balancetes e demonstrações financeiras.",
                                },
                                {
                                    icon: <UserCheck className="h-5 w-5" />,
                                    iconBg: "bg-blue-100 dark:bg-blue-500/10",
                                    iconColor: "text-blue-600 dark:text-blue-400",
                                    title: "Recursos Humanos (RH)",
                                    desc: "Gestão de colaboradores, contratos, folhas de salário e registo de presenças.",
                                },
                                {
                                    icon: <Truck className="h-5 w-5" />,
                                    iconBg: "bg-orange-100 dark:bg-orange-500/10",
                                    iconColor: "text-orange-600 dark:text-orange-400",
                                    title: "Logística & Expedição",
                                    desc: "Gestão de entregas, transportadoras e rastreamento de encomendas ao cliente.",
                                },
                                {
                                    icon: <ClipboardList className="h-5 w-5" />,
                                    iconBg: "bg-cyan-100 dark:bg-cyan-500/10",
                                    iconColor: "text-cyan-600 dark:text-cyan-400",
                                    title: "Projetos & Ordens de Trabalho",
                                    desc: "Gestão de projectos, tarefas, ordens de produção e acompanhamento de progresso.",
                                },
                                {
                                    icon: <Hammer className="h-5 w-5" />,
                                    iconBg: "bg-rose-100 dark:bg-rose-500/10",
                                    iconColor: "text-rose-600 dark:text-rose-400",
                                    title: "Manutenção",
                                    desc: "Planos de manutenção preventiva e correctiva de equipamentos e ativos da empresa.",
                                },
                            ] as { icon: React.ReactNode; iconBg: string; iconColor: string; title: string; desc: string }[]).map((mod, i) => (
                                <div
                                    key={i}
                                    className="relative flex gap-3 p-4 rounded-[4px] border border-dashed border-border hover:border-[#E8A020]/40 transition-colors bg-muted/20"
                                >
                                    {/* Coming soon ribbon */}
                                    <div className="absolute top-2 right-2">
                                        <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-[3px] bg-[#E8A020]/10 text-[#E8A020]">
                                            Em breve
                                        </span>
                                    </div>
                                    <div className={cn("h-9 w-9 rounded-[4px] flex items-center justify-center flex-shrink-0", mod.iconBg, mod.iconColor)}>
                                        {mod.icon}
                                    </div>
                                    <div className="pr-12">
                                        <p className="font-semibold text-foreground text-sm mb-1">{mod.title}</p>
                                        <p className="text-xs text-muted-foreground leading-relaxed">{mod.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 flex gap-2 items-start p-3 bg-[#E8A020]/5 border border-[#E8A020]/20 rounded-[4px]">
                            <Star className="h-4 w-4 text-[#E8A020] flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-muted-foreground">
                                Os módulos em desenvolvimento são actualizados de forma contínua. Se precisar de uma funcionalidade específica
                                com urgência, contacte a equipa de suporte para verificar o roadmap e prioridades.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Bottom note */}
                <div className="flex gap-3 p-4 bg-muted/30 border border-border rounded-[4px] text-sm text-muted-foreground">
                    <Star className="h-4 w-4 text-[#E8A020] flex-shrink-0 mt-0.5" />
                    <span>
                        Manual em constante actualização. Se tiver dúvidas ou encontrar algo que não está explicado,
                        contacte o suporte ou o administrador da sua empresa.
                    </span>
                </div>
            </div>
        </>
    );
}

DocsUserManual.layout = {
    breadcrumbs: [
        { title: "Manual do Utilizador", href: "/docs" },
    ],
};
