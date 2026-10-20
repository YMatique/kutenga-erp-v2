import { Head, Link } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    CalendarClock,
    ChevronDown,
    FileText,
    HandCoins,
    Package,
    Plus,
    ShoppingCart,
    TrendingUp,
    UserPlus,
    Wallet,
} from 'lucide-react';
import type { ReactNode } from 'react';
import SalesChart from '@/components/dashboard/sales-chart';
import type { SalesMonth } from '@/components/dashboard/sales-chart';
import { KpiCard, PageHeader, PrimaryButton, TableCard } from '@/components/ui/brand';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatQty, movementDelta, movementLabels } from '@/lib/stock-movements';
import { cn, formatCurrency } from '@/lib/utils';

interface Amount {
    value: number;
}

interface DashboardProps {
    metrics: {
        billed_month: Amount & { previous: number; change: number | null };
        received_month: Amount & { payments: number };
        receivables: Amount & { invoices: number };
        overdue: Amount & { invoices: number };
        stock_alerts: number;
    };
    chart_data: SalesMonth[];
    top_customers: { name: string; value: number }[];
    top_products: { name: string; value: number }[];
    recent_sales: {
        id: number;
        document_number: string;
        url: string;
        customer_name: string;
        grand_total: number;
        issue_date: string;
        state: 'paid' | 'partial' | 'unpaid' | 'overdue';
    }[];
    recent_activity: {
        id: number;
        product_name: string;
        warehouse_name: string;
        user_name: string;
        type: 'in' | 'out' | 'adjustment' | 'opening';
        quantity: number;
        created_at: string;
    }[];
    can: {
        create_invoice: boolean;
        view_invoices: boolean;
        pos: boolean;
        create_customer: boolean;
        catalog: boolean;
        inventory: boolean;
    };
}

const saleStates: Record<DashboardProps['recent_sales'][number]['state'], { label: string; cls: string }> = {
    paid: { label: 'Paga', cls: 'bg-[#2DB8A0]/10 text-[#2DB8A0]' },
    partial: { label: 'Parcial', cls: 'bg-[#E8A020]/10 text-[#E8A020]' },
    unpaid: { label: 'Por pagar', cls: 'bg-muted text-muted-foreground' },
    overdue: { label: 'Vencida', cls: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400' },
};

const headClass = 'px-3 sm:px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground';

/** Valores dos indicadores sem cêntimos: cabem nos cartões e ler-se-ão de relance (as tabelas mantêm os cêntimos). */
const formatMoney = (n: number) => formatCurrency(Math.round(n)).replace(/[,.]00(?=\s)/, '');

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Texto da variação face ao mesmo período do mês anterior. */
function changeText(change: number | null, previous: number): string {
    if (change === null) {
        return previous > 0 ? 'sem variação' : 'sem faturação no mês anterior para comparar';
    }

    const arrow = change > 0 ? '▲' : change < 0 ? '▼' : '=';

    return `${arrow} ${Math.abs(change).toLocaleString('pt-MZ', { maximumFractionDigits: 1 })}% face ao mesmo período do mês anterior`;
}

function TopList({ title, icon, items, empty }: { title: string; icon: ReactNode; items: { name: string; value: number }[]; empty: string }) {
    const max = Math.max(...items.map((item) => item.value), 1);

    return (
        <TableCard>
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                {icon}
                <div>
                    <h2 className="text-sm font-semibold text-foreground">{title}</h2>
                    <p className="text-xs text-muted-foreground">Este mês, líquido de notas de crédito</p>
                </div>
            </div>
            {items.length === 0 ? (
                <p className="px-5 py-8 text-center text-xs text-muted-foreground">{empty}</p>
            ) : (
                <ul className="divide-y divide-border">
                    {items.map((item) => (
                        <li key={item.name} className="px-5 py-2.5">
                            <div className="flex items-baseline justify-between gap-3">
                                <span className="text-sm text-foreground truncate">{item.name}</span>
                                <span className="text-xs font-mono font-semibold text-foreground whitespace-nowrap">{formatCurrency(item.value)}</span>
                            </div>
                            <div className="mt-1.5 h-1 rounded-full bg-border overflow-hidden">
                                <div className="h-full rounded-full bg-[#2DB8A0] dark:bg-[#1fa08a]" style={{ width: `${(item.value / max) * 100}%` }} />
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </TableCard>
    );
}

export default function Dashboard({ metrics, chart_data, top_customers, top_products, recent_sales, recent_activity, can }: DashboardProps) {
    const canAct = can.create_invoice || can.pos || can.create_customer || can.catalog;

    const stockCard = (
        <KpiCard
            label="Alertas de Stock"
            value={metrics.stock_alerts}
            icon={<AlertCircle className="h-4 w-4" />}
            accent={metrics.stock_alerts > 0 ? 'orange' : 'teal'}
            description={metrics.stock_alerts > 0 ? 'baixo ou esgotado' : 'stock em dia'}
        />
    );

    return (
        <>
            <Head title="Dashboard" />

            <div className="flex flex-col gap-6">
                <PageHeader
                    title="Dashboard"
                    subtitle="Visão geral do negócio: faturação, cobranças e stock"
                    actions={
                        canAct && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <PrimaryButton>
                                        <Plus className="h-3.5 w-3.5" />
                                        Ações rápidas
                                        <ChevronDown className="h-3.5 w-3.5" />
                                    </PrimaryButton>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    {can.create_invoice && (
                                        <DropdownMenuItem asChild>
                                            <Link href="/billing/invoices/create"><FileText /> Nova fatura</Link>
                                        </DropdownMenuItem>
                                    )}
                                    {can.pos && (
                                        <DropdownMenuItem asChild>
                                            <Link href="/pos"><ShoppingCart /> Nova venda (POS)</Link>
                                        </DropdownMenuItem>
                                    )}
                                    {can.create_customer && (
                                        <DropdownMenuItem asChild>
                                            <Link href="/billing/customers/create"><UserPlus /> Novo cliente</Link>
                                        </DropdownMenuItem>
                                    )}
                                    {can.catalog && (
                                        <>
                                            {(can.create_invoice || can.pos || can.create_customer) && <DropdownMenuSeparator />}
                                            <DropdownMenuItem asChild>
                                                <Link href="/products/create"><Package /> Novo produto</Link>
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )
                    }
                />

                {/* Indicadores: o mês em curso, o que falta receber e o que está em atraso */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-4">
                    <KpiCard
                        label="Faturado este mês"
                        value={formatMoney(metrics.billed_month.value)}
                        icon={<TrendingUp className="h-4 w-4" />}
                        accent="teal"
                        description={changeText(metrics.billed_month.change, metrics.billed_month.previous)}
                    />
                    <KpiCard
                        label="Recebido este mês"
                        value={formatMoney(metrics.received_month.value)}
                        icon={<HandCoins className="h-4 w-4" />}
                        accent="gold"
                        description={plural(metrics.received_month.payments, 'pagamento registado', 'pagamentos registados')}
                    />
                    <KpiCard
                        label="A receber"
                        value={formatMoney(metrics.receivables.value)}
                        icon={<Wallet className="h-4 w-4" />}
                        accent="slate"
                        description={plural(metrics.receivables.invoices, 'fatura em aberto', 'faturas em aberto')}
                    />
                    <KpiCard
                        label="Vencido"
                        value={formatMoney(metrics.overdue.value)}
                        icon={<CalendarClock className="h-4 w-4" />}
                        accent={metrics.overdue.value > 0 ? 'red' : 'slate'}
                        description={
                            metrics.overdue.invoices > 0
                                ? plural(metrics.overdue.invoices, 'fatura vencida', 'faturas vencidas')
                                : 'nada em atraso'
                        }
                    />
                    {can.inventory ? (
                        <Link href="/inventory" className="block rounded-[4px] transition-colors hover:ring-1 hover:ring-[#2DB8A0]/40">
                            {stockCard}
                        </Link>
                    ) : (
                        stockCard
                    )}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                    <div className="xl:col-span-2">
                        <SalesChart months={chart_data} />
                    </div>
                    <div className="space-y-4">
                        <TopList
                            title="Melhores clientes"
                            icon={<Wallet className="h-4 w-4 text-[#2DB8A0]" />}
                            items={top_customers}
                            empty="Ainda não há vendas este mês."
                        />
                        <TopList
                            title="Mais faturado"
                            icon={<Package className="h-4 w-4 text-[#2DB8A0]" />}
                            items={top_products}
                            empty="Ainda não há vendas este mês."
                        />
                    </div>
                </div>

                <div className={cn('grid grid-cols-1 gap-6', can.inventory && 'xl:grid-cols-2')}>
                    {/* Últimas faturas e vendas */}
                    <TableCard>
                        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <ShoppingCart className="h-4 w-4 text-[#2DB8A0]" />
                                <h2 className="text-sm font-semibold text-foreground">Últimas Faturas e Vendas</h2>
                            </div>
                            {can.view_invoices && (
                                <Link href="/billing/invoices" className="text-xs text-[#2DB8A0] hover:underline font-medium">
                                    Ver todas
                                </Link>
                            )}
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/40 border-b border-border text-left">
                                    <tr>
                                        <th className={headClass}>Documento</th>
                                        <th className={`${headClass} hidden sm:table-cell`}>Cliente</th>
                                        <th className={`${headClass} hidden md:table-cell`}>Emissão</th>
                                        <th className={`${headClass} text-right`}>Valor</th>
                                        <th className={`${headClass} text-center`}>Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {recent_sales.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground text-xs">
                                                Ainda não há documentos emitidos.
                                            </td>
                                        </tr>
                                    ) : (
                                        recent_sales.map((sale) => (
                                            <tr key={sale.id} className="hover:bg-muted/50 transition-colors">
                                                <td className="px-3 sm:px-5 py-3 font-semibold text-xs whitespace-nowrap">
                                                    {can.view_invoices ? (
                                                        <Link href={sale.url} className="text-[#2DB8A0] hover:underline">
                                                            {sale.document_number}
                                                        </Link>
                                                    ) : (
                                                        sale.document_number
                                                    )}
                                                </td>
                                                <td className="px-5 py-3 text-muted-foreground text-xs truncate max-w-[150px] hidden sm:table-cell">
                                                    {sale.customer_name}
                                                </td>
                                                <td className="px-5 py-3 text-muted-foreground text-xs hidden md:table-cell">
                                                    {new Date(`${sale.issue_date}T00:00:00`).toLocaleDateString('pt-MZ', { day: '2-digit', month: '2-digit' })}
                                                </td>
                                                <td className="px-3 sm:px-5 py-3 text-right font-mono font-bold text-foreground text-xs whitespace-nowrap">
                                                    {formatCurrency(sale.grand_total)}
                                                </td>
                                                <td className="px-3 sm:px-5 py-3 text-center">
                                                    <span className={cn(
                                                        'inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap',
                                                        saleStates[sale.state].cls,
                                                    )}>
                                                        {saleStates[sale.state].label}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </TableCard>

                    {/* Movimentos de stock: só para quem pode ver o inventário */}
                    {can.inventory && (
                        <TableCard>
                            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Activity className="h-4 w-4 text-[#E8A020]" />
                                    <h2 className="text-sm font-semibold text-foreground">Movimentos de Stock Recentes</h2>
                                </div>
                                <Link href="/inventory/movements" className="text-xs text-[#2DB8A0] hover:underline font-medium">
                                    Ver todos
                                </Link>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/40 border-b border-border text-left">
                                        <tr>
                                            <th className={headClass}>Produto</th>
                                            <th className={`${headClass} hidden sm:table-cell`}>Armazém</th>
                                            <th className={`${headClass} text-right`}>Qtd</th>
                                            <th className={`${headClass} text-center hidden sm:table-cell`}>Tipo</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {recent_activity.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-5 py-8 text-center text-muted-foreground text-xs">
                                                    Ainda não há movimentos de stock.
                                                </td>
                                            </tr>
                                        ) : (
                                            recent_activity.map((act) => {
                                                const info = movementLabels[act.type] ?? movementLabels.adjustment;
                                                const delta = movementDelta(act);

                                                return (
                                                    <tr key={act.id} className="hover:bg-muted/50 transition-colors">
                                                        <td className="px-5 py-3 font-semibold text-foreground text-xs truncate max-w-[170px]">
                                                            {act.product_name}
                                                        </td>
                                                        <td className="px-5 py-3 text-muted-foreground text-xs hidden sm:table-cell">
                                                            {act.warehouse_name}
                                                        </td>
                                                        <td className={cn(
                                                            'px-5 py-3 text-right font-mono font-bold text-xs whitespace-nowrap',
                                                            delta < 0 ? 'text-red-600 dark:text-red-400' : 'text-[#2DB8A0]',
                                                        )}>
                                                            {delta < 0 ? '−' : '+'}{formatQty(Math.abs(delta))}
                                                        </td>
                                                        <td className="px-5 py-3 text-center hidden sm:table-cell">
                                                            <span className={cn('inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap', info.color)}>
                                                                {info.label}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </TableCard>
                    )}
                </div>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
    ],
};
