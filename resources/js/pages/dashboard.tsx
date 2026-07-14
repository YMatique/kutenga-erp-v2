import { Head, Link } from '@inertiajs/react';
import {
    Package,
    BookOpen,
    FileText,
    ShoppingCart,
    ArrowRight,
    Clock,
    TrendingUp,
    Wallet,
    Activity,
    Users,
    AlertCircle,
    ArrowDownCircle,
    ArrowUpCircle,
    RefreshCw,
} from 'lucide-react';
import { PageHeader, KpiCard, TableCard } from '@/components/ui/brand';
import { cn } from '@/lib/utils';

interface Sale {
    id: number;
    document_number: string;
    customer_name: string;
    grand_total: number;
    status: string;
    payment_status: string;
    created_at: string;
}

interface StockMovement {
    id: number;
    product_name: string;
    warehouse_name: string;
    user_name: string;
    type: 'in' | 'out' | 'adjustment' | 'opening';
    quantity: number;
    created_at: string;
}

interface MonthData {
    label: string;
    value: number;
}

interface DashboardProps {
    metrics: {
        total_invoiced: number;
        receivables: number;
        total_clients: number;
        total_items: number;
        low_stock_count: number;
    };
    recent_sales: Sale[];
    recent_activity: StockMovement[];
    chart_data: MonthData[];
}

const quickLinks = [
    {
        href: '/inventory',
        title: 'Inventário',
        description: 'Gerencie o seu stock e movimentos de armazém.',
        icon: Package,
        accent: 'teal' as const,
        iconBg: 'bg-[#2DB8A0]/10',
        iconColor: 'text-[#2DB8A0]',
    },
    {
        href: '/products',
        title: 'Catálogo',
        description: 'Produtos, categorias e listas de preços.',
        icon: BookOpen,
        accent: 'gold' as const,
        iconBg: 'bg-[#E8A020]/10',
        iconColor: 'text-[#E8A020]',
    },
    {
        href: '/billing/documents',
        title: 'Faturação',
        description: 'Emita e acompanhe faturas e recibos.',
        icon: FileText,
        accent: 'teal' as const,
        iconBg: 'bg-[#2DB8A0]/10',
        iconColor: 'text-[#2DB8A0]',
    },
];

const movementTypeConfig: Record<
    StockMovement['type'],
    { label: string; dot: string; cls: string; icon: React.ReactNode }
> = {
    in: {
        label: 'Entrada',
        dot: 'bg-[#2DB8A0]',
        cls: 'bg-[#2DB8A0]/10 text-[#2DB8A0]',
        icon: <ArrowDownCircle className="h-3.5 w-3.5" />,
    },
    out: {
        label: 'Saída',
        dot: 'bg-red-500',
        cls: 'bg-red-50 text-red-600',
        icon: <ArrowUpCircle className="h-3.5 w-3.5" />,
    },
    adjustment: {
        label: 'Ajuste',
        dot: 'bg-amber-500',
        cls: 'bg-amber-50 text-amber-600',
        icon: <RefreshCw className="h-3.5 w-3.5" />,
    },
    opening: {
        label: 'Abertura',
        dot: 'bg-blue-500',
        cls: 'bg-blue-50 text-blue-600',
        icon: <Package className="h-3.5 w-3.5" />,
    },
};

export default function Dashboard({ metrics, recent_sales, recent_activity, chart_data }: DashboardProps) {
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(val);
    };

    // Find the max value in chart data to scale the height of the chart bars
    const maxChartValue = Math.max(...chart_data.map(d => d.value), 1);

    return (
        <>
            <Head title="Dashboard" />

            <div className="flex flex-col gap-6">
                {/* Page Header */}
                <PageHeader
                    title="Dashboard"
                    subtitle="Bem-vindo de volta ao Kutenga ERP. Acompanhe a performance do seu negócio."
                />

                {/* KPI Metrics Row */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <KpiCard
                        label="Faturado Total"
                        value={formatCurrency(metrics.total_invoiced)}
                        icon={<TrendingUp className="h-4 w-4" />}
                        accent="teal"
                    />
                    <KpiCard
                        label="Contas a Receber"
                        value={formatCurrency(metrics.receivables)}
                        icon={<Wallet className="h-4 w-4" />}
                        accent="orange"
                    />
                    <KpiCard
                        label="Total Clientes"
                        value={metrics.total_clients}
                        icon={<Users className="h-4 w-4" />}
                        accent="slate"
                    />
                    <KpiCard
                        label="Catálogo de Itens"
                        value={metrics.total_items}
                        icon={<Package className="h-4 w-4" />}
                        accent="slate"
                    />
                    <KpiCard
                        label="Alertas de Stock"
                        value={metrics.low_stock_count}
                        icon={<AlertCircle className="h-4 w-4" />}
                        accent={metrics.low_stock_count > 0 ? 'red' : 'slate'}
                        description={metrics.low_stock_count > 0 ? 'precisam de reposição' : 'estoque em dia'}
                    />
                </div>

                {/* Quick Links Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {quickLinks.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="group bg-white border border-slate-200 rounded-[4px] shadow-xs p-5 flex flex-col gap-4 hover:border-[#2DB8A0] hover:shadow-md transition-all duration-200"
                            >
                                <div className="flex items-start justify-between">
                                    <div className={`h-10 w-10 rounded-[4px] flex items-center justify-center flex-shrink-0 ${item.iconBg}`}>
                                        <Icon className={`h-5 w-5 ${item.iconColor}`} />
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-[#2DB8A0] group-hover:translate-x-0.5 transition-all duration-200" />
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-900 text-[14px] leading-tight">{item.title}</p>
                                    <p className="text-[12px] text-slate-500 mt-1 leading-snug">{item.description}</p>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {/* Sales Chart Section */}
                <div className="bg-white border border-slate-200 rounded-[4px] shadow-xs p-5">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-[#2DB8A0]" />
                            <h2 className="text-[14px] font-semibold text-slate-800">Evolução do Faturamento (Últimos 6 meses)</h2>
                        </div>
                    </div>

                    <div className="flex items-end justify-between h-48 pt-6 border-b border-slate-100 px-4 md:px-8 gap-4">
                        {chart_data.map((item, idx) => {
                            const pct = Math.max(10, (item.value / maxChartValue) * 100);
                            return (
                                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                                    <div className="relative w-full flex justify-center h-full items-end">
                                        {/* Value tooltip on hover */}
                                        <span className="absolute -top-6 bg-slate-800 text-white text-[10px] px-2 py-0.5 rounded-[4px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none shadow-sm z-10">
                                            {formatCurrency(item.value)}
                                        </span>
                                        <div
                                            style={{ height: `${pct}%` }}
                                            className="w-full sm:w-16 rounded-t-[4px] bg-gradient-to-t from-[#2DB8A0]/90 to-[#2DB8A0]/70 hover:from-[#239B86] hover:to-[#2DB8A0] transition-all duration-300 shadow-xs relative"
                                        />
                                    </div>
                                    <span className="text-[11px] text-slate-500 font-medium whitespace-nowrap mt-1">
                                        {item.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Dashboard Bottom Row */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {/* Left side: Recent Sales */}
                    <TableCard>
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <ShoppingCart className="h-4 w-4 text-[#2DB8A0]" />
                                <h2 className="text-[14px] font-semibold text-slate-800">Últimas Faturas e Vendas</h2>
                            </div>
                            <Link href="/billing/documents" className="text-xs text-[#2DB8A0] hover:text-[#239B86] font-medium flex items-center gap-1">
                                Ver todas <ArrowRight className="h-3 w-3" />
                            </Link>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 border-b border-slate-100 text-left">
                                    <tr>
                                        <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Nº Documento</th>
                                        <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Cliente</th>
                                        <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400 text-right">Valor</th>
                                        <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400 text-center">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {recent_sales.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-5 py-8 text-center text-slate-400 text-xs">
                                                Nenhum documento faturado recentemente.
                                            </td>
                                        </tr>
                                    ) : (
                                        recent_sales.map((sale) => (
                                            <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-5 py-3 font-semibold text-slate-900 text-xs">
                                                    <Link href={`/billing/documents/${sale.id}`} className="hover:underline text-[#2DB8A0]">
                                                        {sale.document_number}
                                                    </Link>
                                                </td>
                                                <td className="px-5 py-3 text-slate-700 text-xs truncate max-w-[150px]">
                                                    {sale.customer_name}
                                                </td>
                                                <td className="px-5 py-3 text-right font-mono font-bold text-slate-900 text-xs">
                                                    {formatCurrency(sale.grand_total)}
                                                </td>
                                                <td className="px-5 py-3 text-center">
                                                    <span className={cn(
                                                        'inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-semibold uppercase tracking-wide',
                                                        sale.status === 'confirmed' || sale.status === 'paid'
                                                            ? 'bg-green-50 text-green-700'
                                                            : sale.status === 'draft'
                                                            ? 'bg-yellow-50 text-yellow-700'
                                                            : 'bg-red-50 text-red-700'
                                                    )}>
                                                        {sale.status === 'confirmed' || sale.status === 'paid' ? 'Emitida' : sale.status === 'draft' ? 'Rascunho' : 'Cancelada'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </TableCard>

                    {/* Right side: Recent Activity */}
                    <TableCard>
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Activity className="h-4 w-4 text-[#E8A020]" />
                                <h2 className="text-[14px] font-semibold text-slate-800">Atividades de Stock Recentes</h2>
                            </div>
                            <Link href="/inventory/movements" className="text-xs text-[#E8A020] hover:text-[#c48414] font-medium flex items-center gap-1">
                                Ver todos <ArrowRight className="h-3 w-3" />
                            </Link>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 border-b border-slate-100 text-left">
                                    <tr>
                                        <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Produto</th>
                                        <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Armazém</th>
                                        <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400 text-right">Qtd</th>
                                        <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400 text-center">Tipo</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {recent_activity.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-5 py-8 text-center text-slate-400 text-xs">
                                                Nenhuma movimentação de stock recente.
                                            </td>
                                        </tr>
                                    ) : (
                                        recent_activity.map((act) => {
                                            const cfg = movementTypeConfig[act.type] ?? movementTypeConfig.adjustment;
                                            return (
                                                <tr key={act.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-5 py-3 font-semibold text-slate-900 text-xs truncate max-w-[150px]">
                                                        {act.product_name}
                                                    </td>
                                                    <td className="px-5 py-3 text-slate-500 text-xs">
                                                        {act.warehouse_name}
                                                    </td>
                                                    <td className="px-5 py-3 text-right font-mono font-bold text-slate-800 text-xs">
                                                        {act.quantity}
                                                    </td>
                                                    <td className="px-5 py-3 text-center">
                                                        <span className={cn(
                                                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[10px] font-semibold uppercase tracking-wide',
                                                            cfg.cls
                                                        )}>
                                                            {cfg.label}
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
