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
                                className="group bg-card border border-border rounded-[4px] shadow-xs p-5 flex flex-col gap-4 hover:border-[#2DB8A0] hover:shadow-md transition-all duration-200"
                            >
                                <div className="flex items-start justify-between">
                                    <div className={`h-10 w-10 rounded-[4px] flex items-center justify-center flex-shrink-0 ${item.iconBg}`}>
                                        <Icon className={`h-5 w-5 ${item.iconColor}`} />
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-[#2DB8A0] group-hover:translate-x-0.5 transition-all duration-200" />
                                </div>
                                <div>
                                    <p className="font-semibold text-foreground text-[14px] leading-tight">{item.title}</p>
                                    <p className="text-[12px] text-muted-foreground mt-1 leading-snug">{item.description}</p>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {/* Sales Chart Section */}
                <div className="bg-card border border-border rounded-[4px] shadow-xs p-5">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-[#2DB8A0]" />
                            <h2 className="text-[14px] font-semibold text-slate-800">Evolução do Faturamento (Últimos 6 meses)</h2>
                        </div>
                    </div>

                    <div className="w-full">
                        <svg viewBox="0 0 600 180" width="100%" height="100%" className="overflow-visible font-sans">
                            <defs>
                                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#2DB8A0" stopOpacity="0.25" />
                                    <stop offset="100%" stopColor="#2DB8A0" stopOpacity="0.0" />
                                </linearGradient>
                                <filter id="glow" x="-10%" y="-10%" width="120%" height="120%">
                                    <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#2DB8A0" floodOpacity="0.25" />
                                </filter>
                            </defs>

                            {/* Background Grid Lines and Y-Axis Values */}
                            {[0, 0.25, 0.5, 0.75, 1.0].map((ratio, idx) => {
                                const val = maxChartValue * ratio;
                                const y = 140 - ratio * 110;
                                return (
                                    <g key={idx}>
                                        <line
                                            x1="60"
                                            y1={y}
                                            x2="570"
                                            y2={y}
                                            className="stroke-border/30 dark:stroke-border/10"
                                            strokeDasharray="4 4"
                                            strokeWidth="1"
                                        />
                                        <text
                                            x="50"
                                            y={y + 3}
                                            textAnchor="end"
                                            className="fill-muted-foreground/60 text-[9px] font-mono"
                                        >
                                            {ratio === 0 ? '0' : formatCurrency(val).replace(',00', '').replace('MT', '').trim()}
                                        </text>
                                    </g>
                                );
                            })}

                            {/* Area Gradient under smooth Bézier curve */}
                            {chart_data.length > 0 && (
                                <path
                                    d={(() => {
                                        const points = chart_data.map((item, idx) => ({
                                            x: 60 + (idx * 102),
                                            y: 140 - (item.value / Math.max(maxChartValue, 1)) * 110
                                        }));
                                        let d = `M ${points[0].x} ${points[0].y}`;
                                        for (let i = 0; i < points.length - 1; i++) {
                                            const p0 = points[i];
                                            const p1 = points[i + 1];
                                            const cp1x = p0.x + (p1.x - p0.x) / 3;
                                            const cp1y = p0.y;
                                            const cp2x = p0.x + 2 * (p1.x - p0.x) / 3;
                                            const cp2y = p1.y;
                                            d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
                                        }
                                        return `${d} L ${points[points.length - 1].x} 140 L 60 140 Z`;
                                    })()}
                                    fill="url(#areaGradient)"
                                />
                            )}

                            {/* Main Stroke Line using smooth Bézier curve */}
                            {chart_data.length > 0 && (
                                <path
                                    d={(() => {
                                        const points = chart_data.map((item, idx) => ({
                                            x: 60 + (idx * 102),
                                            y: 140 - (item.value / Math.max(maxChartValue, 1)) * 110
                                        }));
                                        let d = `M ${points[0].x} ${points[0].y}`;
                                        for (let i = 0; i < points.length - 1; i++) {
                                            const p0 = points[i];
                                            const p1 = points[i + 1];
                                            const cp1x = p0.x + (p1.x - p0.x) / 3;
                                            const cp1y = p0.y;
                                            const cp2x = p0.x + 2 * (p1.x - p0.x) / 3;
                                            const cp2y = p1.y;
                                            d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
                                        }
                                        return d;
                                    })()}
                                    fill="none"
                                    stroke="#2DB8A0"
                                    strokeWidth="3.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    filter="url(#glow)"
                                />
                            )}

                            {/* Interactive Circles & Hover Tooltips */}
                            {chart_data.map((item, idx) => {
                                const x = 60 + (idx * 102);
                                const y = 140 - (item.value / Math.max(maxChartValue, 1)) * 110;
                                return (
                                    <g key={idx} className="group/point cursor-pointer">
                                        <circle
                                            cx={x}
                                            cy={y}
                                            r="12"
                                            fill="transparent"
                                        />
                                        <circle
                                            cx={x}
                                            cy={y}
                                            r="4"
                                            fill="#2DB8A0"
                                            className="transition-all duration-300 group-hover/point:r-6"
                                        />
                                        <circle
                                            cx={x}
                                            cy={y}
                                            r="4"
                                            fill="#ffffff"
                                            stroke="#2DB8A0"
                                            strokeWidth="2.5"
                                            className="transition-all duration-300 group-hover/point:r-5"
                                        />
                                        {/* Label text */}
                                        <text
                                            x={x}
                                            y="162"
                                            textAnchor="middle"
                                            className="fill-muted-foreground text-[10px] font-semibold"
                                        >
                                            {item.label}
                                        </text>
                                        {/* Floating tooltip */}
                                        <g className="opacity-0 group-hover/point:opacity-100 transition-opacity duration-200 pointer-events-none z-30">
                                            <rect
                                                x={x - 55}
                                                y={y - 32}
                                                width="110"
                                                height="22"
                                                rx="4"
                                                className="fill-slate-900 dark:fill-slate-800 stroke-border shadow-md"
                                            />
                                            <text
                                                x={x}
                                                y={y - 18}
                                                textAnchor="middle"
                                                className="fill-white text-[9px] font-bold"
                                            >
                                                {formatCurrency(item.value)}
                                            </text>
                                        </g>
                                    </g>
                                );
                            })}
                        </svg>
                    </div>
                </div>

                {/* Dashboard Bottom Row */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {/* Left side: Recent Sales */}
                    <TableCard>
                        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <ShoppingCart className="h-4 w-4 text-[#2DB8A0]" />
                                <h2 className="text-[14px] font-semibold text-foreground">Últimas Faturas e Vendas</h2>
                            </div>
                            <Link href="/billing/documents" className="text-xs text-[#2DB8A0] hover:text-[#239B86] font-medium flex items-center gap-1">
                                Ver todas <ArrowRight className="h-3 w-3" />
                            </Link>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 border-b border-border text-left">
                                    <tr>
                                        <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Nº Documento</th>
                                        <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Cliente</th>
                                        <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-right">Valor</th>
                                        <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-center">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {recent_sales.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-5 py-8 text-center text-muted-foreground text-xs">
                                                Nenhum documento faturado recentemente.
                                            </td>
                                        </tr>
                                    ) : (
                                        recent_sales.map((sale) => (
                                            <tr key={sale.id} className="hover:bg-muted/50 transition-colors">
                                                <td className="px-5 py-3 font-semibold text-foreground text-xs">
                                                    <Link href={`/billing/documents/${sale.id}`} className="hover:underline text-[#2DB8A0]">
                                                        {sale.document_number}
                                                    </Link>
                                                </td>
                                                <td className="px-5 py-3 text-muted-foreground text-xs truncate max-w-[150px]">
                                                    {sale.customer_name}
                                                </td>
                                                <td className="px-5 py-3 text-right font-mono font-bold text-foreground text-xs">
                                                    {formatCurrency(sale.grand_total)}
                                                </td>
                                                <td className="px-5 py-3 text-center">
                                                    <span className={cn(
                                                        'inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-semibold uppercase tracking-wide',
                                                        sale.status === 'confirmed' || sale.status === 'paid'
                                                            ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                                                            : sale.status === 'draft'
                                                            ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                                                            : 'bg-red-500/10 text-red-600 dark:text-red-400'
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
                        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Activity className="h-4 w-4 text-[#E8A020]" />
                                <h2 className="text-[14px] font-semibold text-foreground">Atividades de Stock Recentes</h2>
                            </div>
                            <Link href="/inventory/movements" className="text-xs text-[#E8A020] hover:text-[#c48414] font-medium flex items-center gap-1">
                                Ver todos <ArrowRight className="h-3 w-3" />
                            </Link>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 border-b border-border text-left">
                                    <tr>
                                        <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Produto</th>
                                        <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Armazém</th>
                                        <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-right">Qtd</th>
                                        <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-center">Tipo</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {recent_activity.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-5 py-8 text-center text-muted-foreground text-xs">
                                                Nenhuma movimentação de stock recente.
                                            </td>
                                        </tr>
                                    ) : (
                                        recent_activity.map((act) => {
                                            const cfg = movementTypeConfig[act.type] ?? movementTypeConfig.adjustment;
                                            return (
                                                <tr key={act.id} className="hover:bg-muted/50 transition-colors">
                                                    <td className="px-5 py-3 font-semibold text-foreground text-xs truncate max-w-[150px]">
                                                        {act.product_name}
                                                    </td>
                                                    <td className="px-5 py-3 text-muted-foreground text-xs">
                                                        {act.warehouse_name}
                                                    </td>
                                                    <td className="px-5 py-3 text-right font-mono font-bold text-foreground text-xs">
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
