import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { PageHeader, KpiCard, TableCard, OutlineButton } from '@/components/ui/brand';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, FileSpreadsheet, Loader2, TrendingUp, Users, Package, MonitorPlay, AlertCircle } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function ReportsIndex() {
    const [category, setCategory] = useState('sales');

    // Default to current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0);

    const [startDate, setStartDate] = useState(startOfMonth.toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(endOfMonth.toISOString().split('T')[0]);

    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [isExportingPdf, setIsExportingPdf] = useState(false);
    const [isExportingExcel, setIsExportingExcel] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ category, start_date: startDate, end_date: endDate });
            const response = await fetch(`${route('reports.data')}?${params.toString()}`);

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const result = await response.json();
            setData(result);
        } catch (error) {
            toast.error('Erro ao carregar dados do relatório.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [category, startDate, endDate]);

    const handleExport = (type: 'pdf' | 'excel') => {
        if (type === 'pdf') setIsExportingPdf(true);
        if (type === 'excel') setIsExportingExcel(true);

        const params = new URLSearchParams({ category, start_date: startDate, end_date: endDate });
        const url = type === 'pdf' ? route('reports.export.pdf') : route('reports.export.excel');

        window.location.href = `${url}?${params.toString()}`;

        setTimeout(() => {
            setIsExportingPdf(false);
            setIsExportingExcel(false);
        }, 3000);
    };

    // Calculate max chart value for SVG rendering
    const maxChartValue = data?.chart_data?.length ? Math.max(...data.chart_data.map((d: any) => d.value), 1) : 1;

    return (
        <div className="flex flex-col gap-6">
            <Head title="Relatórios e Estatísticas" />

            <PageHeader
                title="Relatórios e Estatísticas"
                subtitle="Análise detalhada do seu negócio por categorias."
                actions={
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-2 bg-card px-2 py-1 rounded-[4px] shadow-xs border border-border">
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="h-7 border-none shadow-none focus-visible:ring-0 w-32 text-xs"
                            />
                            <span className="text-muted-foreground text-xs font-medium">até</span>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="h-7 border-none shadow-none focus-visible:ring-0 w-32 text-xs"
                            />
                        </div>
                        <OutlineButton
                            onClick={() => handleExport('pdf')}
                            disabled={isExportingPdf || loading}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                            {isExportingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                            PDF
                        </OutlineButton>
                        <OutlineButton
                            onClick={() => handleExport('excel')}
                            disabled={isExportingExcel || loading}
                            className="text-[#2DB8A0] hover:text-[#239B86] hover:bg-[#2DB8A0]/10"
                        >
                            {isExportingExcel ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                            Excel
                        </OutlineButton>
                    </div>
                }
            />

            <Tabs value={category} onValueChange={setCategory} className="space-y-6">
                <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full p-1 pb-2 bg-card shadow-xs border border-border rounded-[4px]">
                    <TabsTrigger value="sales" className="rounded-[4px] data-[state=active]:bg-[#2DB8A0]/10 data-[state=active]:text-[#2DB8A0]">
                        <TrendingUp className="w-4 h-4 mr-2" /> Vendas
                    </TabsTrigger>
                    <TabsTrigger value="inventory" className="rounded-[4px] data-[state=active]:bg-[#E8A020]/10 data-[state=active]:text-[#E8A020]">
                        <Package className="w-4 h-4 mr-2" /> Inventário
                    </TabsTrigger>
                    <TabsTrigger value="customers" className="rounded-[4px] data-[state=active]:bg-purple-500/10 data-[state=active]:text-purple-600">
                        <Users className="w-4 h-4 mr-2" /> Clientes
                    </TabsTrigger>
                    <TabsTrigger value="pos" className="rounded-[4px] data-[state=active]:bg-blue-500/10 data-[state=active]:text-blue-600">
                        <MonitorPlay className="w-4 h-4 mr-2" /> POS
                    </TabsTrigger>
                </TabsList>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <>
                        <TabsContent value="sales" className="space-y-6 animate-in fade-in-50 duration-500">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <KpiCard
                                    label="Receita Total"
                                    value={formatCurrency(data?.total_revenue || 0)}
                                    icon={<TrendingUp className="h-4 w-4" />}
                                    accent="teal"
                                    description="Faturas confirmadas/pagas"
                                />
                                <KpiCard
                                    label="Impostos Recolhidos"
                                    value={formatCurrency(data?.total_taxes || 0)}
                                    icon={<FileText className="h-4 w-4" />}
                                    accent="slate"
                                />
                                <KpiCard
                                    label="Faturas Emitidas"
                                    value={data?.total_invoices || 0}
                                    icon={<FileText className="h-4 w-4" />}
                                    accent="slate"
                                />
                                <KpiCard
                                    label="Cotações Emitidas"
                                    value={data?.total_quotes || 0}
                                    icon={<FileText className="h-4 w-4" />}
                                    accent="slate"
                                />
                            </div>

                            <TableCard>
                                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4 text-[#2DB8A0]" />
                                        <h2 className="text-[14px] font-semibold text-foreground">Receitas no Período</h2>
                                    </div>
                                </div>
                                <div className="p-5 overflow-x-auto">
                                    {(!data?.chart_data || data.chart_data.length === 0) ? (
                                        <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                                            Não há dados suficientes para gerar o gráfico.
                                        </div>
                                    ) : (
                                        <svg viewBox="0 0 1000 180" width="100%" height="100%" className="overflow-visible font-sans min-w-[600px]">
                                            <defs>
                                                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#2DB8A0" stopOpacity="0.12" />
                                                    <stop offset="100%" stopColor="#2DB8A0" stopOpacity="0.0" />
                                                </linearGradient>
                                            </defs>
                                            {[0, 0.25, 0.5, 0.75, 1.0].map((ratio, idx) => {
                                                const val = maxChartValue * ratio;
                                                const y = 140 - ratio * 110;
                                                return (
                                                    <g key={idx}>
                                                        <line x1="85" y1={y} x2="960" y2={y} className="stroke-border/40" strokeDasharray="4 4" strokeWidth="1" />
                                                        <text x="75" y={y + 3} textAnchor="end" style={{ fontSize: '9px' }} className="fill-muted-foreground/60 font-mono">
                                                            {ratio === 0 ? '0 MT' : new Intl.NumberFormat('pt-MZ', { maximumFractionDigits: 0 }).format(val) + ' MT'}
                                                        </text>
                                                    </g>
                                                );
                                            })}
                                            <path
                                                d={(() => {
                                                    const spacing = 875 / Math.max(data.chart_data.length - 1, 1);
                                                    const points = data.chart_data.map((item: any, idx: number) => ({
                                                        x: 85 + (idx * spacing),
                                                        y: 140 - (item.value / maxChartValue) * 110
                                                    }));
                                                    if (points.length === 1) {
                                                        return `M 85 140 L ${points[0].x} ${points[0].y} L 960 140 Z`;
                                                    }
                                                    let d = `M ${points[0].x} ${points[0].y}`;
                                                    for (let i = 0; i < points.length - 1; i++) {
                                                        const p0 = points[i];
                                                        const p1 = points[i + 1];
                                                        const cp1x = p0.x + (p1.x - p0.x) * 0.3;
                                                        const cp1y = p0.y + (p1.y - p0.y) * 0.05;
                                                        const cp2x = p0.x + (p1.x - p0.x) * 0.7;
                                                        const cp2y = p0.y + (p1.y - p0.y) * 0.95;
                                                        d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
                                                    }
                                                    return `${d} L ${points[points.length - 1].x} 140 L 85 140 Z`;
                                                })()}
                                                fill="url(#areaGradient)"
                                            />
                                            <path
                                                d={(() => {
                                                    const spacing = 875 / Math.max(data.chart_data.length - 1, 1);
                                                    const points = data.chart_data.map((item: any, idx: number) => ({
                                                        x: 85 + (idx * spacing),
                                                        y: 140 - (item.value / maxChartValue) * 110
                                                    }));
                                                    if (points.length === 1) {
                                                        return `M ${points[0].x} ${points[0].y} L 960 ${points[0].y}`;
                                                    }
                                                    let d = `M ${points[0].x} ${points[0].y}`;
                                                    for (let i = 0; i < points.length - 1; i++) {
                                                        const p0 = points[i];
                                                        const p1 = points[i + 1];
                                                        const cp1x = p0.x + (p1.x - p0.x) * 0.3;
                                                        const cp1y = p0.y + (p1.y - p0.y) * 0.05;
                                                        const cp2x = p0.x + (p1.x - p0.x) * 0.7;
                                                        const cp2y = p0.y + (p1.y - p0.y) * 0.95;
                                                        d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
                                                    }
                                                    return d;
                                                })()}
                                                fill="none" stroke="#2DB8A0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                                            />
                                            {data.chart_data.map((item: any, idx: number) => {
                                                const spacing = 875 / Math.max(data.chart_data.length - 1, 1);
                                                const x = 85 + (idx * spacing);
                                                const y = 140 - (item.value / maxChartValue) * 110;
                                                return (
                                                    <g key={idx} className="group/point cursor-pointer">
                                                        <circle cx={x} cy={y} r="12" fill="transparent" />
                                                        <circle cx={x} cy={y} r="3.5" fill="#2DB8A0" className="transition-all duration-300 group-hover/point:r-5.5" />
                                                        <circle cx={x} cy={y} r="3.5" fill="#ffffff" stroke="#2DB8A0" strokeWidth="2" className="transition-all duration-300 group-hover/point:r-4.5" />
                                                        <text x={x} y="162" textAnchor="middle" style={{ fontSize: '9px' }} className="fill-muted-foreground font-semibold">{item.label}</text>
                                                        <g className="opacity-0 group-hover/point:opacity-100 transition-opacity duration-200 pointer-events-none z-30">
                                                            <rect x={x - 55} y={y - 32} width="110" height="22" rx="4" className="fill-slate-900 stroke-border shadow-md" />
                                                            <text x={x} y={y - 18} textAnchor="middle" style={{ fontSize: '9px' }} className="fill-white font-bold">{formatCurrency(item.value)}</text>
                                                        </g>
                                                    </g>
                                                );
                                            })}
                                        </svg>
                                    )}
                                </div>
                            </TableCard>
                        </TabsContent>

                        <TabsContent value="inventory" className="space-y-6 animate-in fade-in-50 duration-500">
                            <div className="grid grid-cols-2 gap-4">
                                <KpiCard
                                    label="Total Entradas"
                                    value={data?.total_ins || 0}
                                    icon={<Package className="h-4 w-4" />}
                                    accent="teal"
                                    description="Unidades recebidas"
                                />
                                <KpiCard
                                    label="Total Saídas"
                                    value={data?.total_outs || 0}
                                    icon={<Package className="h-4 w-4" />}
                                    accent="orange"
                                    description="Unidades expedidas"
                                />
                            </div>

                            <TableCard>
                                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4 text-red-500" />
                                        <h2 className="text-[14px] font-semibold text-foreground">Alertas de Stock Baixo</h2>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/50 border-b border-border text-left">
                                            <tr>
                                                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Produto</th>
                                                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Referência</th>
                                                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-right">Stock Atual</th>
                                                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-right">Mínimo Permitido</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {(!data?.low_stock_products || data.low_stock_products.length === 0) ? (
                                                <tr>
                                                    <td colSpan={4} className="px-5 py-8 text-center text-muted-foreground text-xs">
                                                        Nenhum alerta de stock baixo no momento.
                                                    </td>
                                                </tr>
                                            ) : (
                                                data.low_stock_products.map((product: any, idx: number) => (
                                                    <tr key={idx} className="hover:bg-muted/50 transition-colors">
                                                        <td className="px-5 py-3 font-semibold text-foreground text-xs">{product.name}</td>
                                                        <td className="px-5 py-3 text-muted-foreground text-xs">{product.reference || '-'}</td>
                                                        <td className="px-5 py-3 text-right font-mono font-bold text-red-600 text-xs">{product.total_stock || 0}</td>
                                                        <td className="px-5 py-3 text-right text-muted-foreground text-xs">{product.min_stock}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </TableCard>
                        </TabsContent>

                        <TabsContent value="customers" className="space-y-6 animate-in fade-in-50 duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <TableCard>
                                    <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Users className="h-4 w-4 text-purple-600" />
                                            <h2 className="text-[14px] font-semibold text-foreground">Top 10 Clientes (Receita)</h2>
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-muted/50 border-b border-border text-left">
                                                <tr>
                                                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Pos</th>
                                                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Cliente</th>
                                                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-right">Total Gasto</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                                {(!data?.top_customers || data.top_customers.length === 0) ? (
                                                    <tr>
                                                        <td colSpan={3} className="px-5 py-8 text-center text-muted-foreground text-xs">
                                                            Nenhum dado encontrado.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    data.top_customers.map((tc: any, i: number) => (
                                                        <tr key={i} className="hover:bg-muted/50 transition-colors">
                                                            <td className="px-5 py-3 text-muted-foreground font-semibold text-xs">{i + 1}º</td>
                                                            <td className="px-5 py-3 font-semibold text-foreground text-xs">{tc.customer?.name || 'Desconhecido'}</td>
                                                            <td className="px-5 py-3 text-right font-mono font-bold text-[#2DB8A0] text-xs">{formatCurrency(tc.total_spent)}</td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </TableCard>

                                <TableCard>
                                    <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <TrendingUp className="h-4 w-4 text-orange-500" />
                                            <h2 className="text-[14px] font-semibold text-foreground">Maiores Saldos Pendentes</h2>
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-muted/50 border-b border-border text-left">
                                                <tr>
                                                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Cliente</th>
                                                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-right">Dívida Pendente</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                                {(!data?.pending_balances || data.pending_balances.length === 0) ? (
                                                    <tr>
                                                        <td colSpan={2} className="px-5 py-8 text-center text-muted-foreground text-xs">
                                                            Nenhum saldo pendente encontrado.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    data.pending_balances.map((pb: any, i: number) => (
                                                        <tr key={i} className="hover:bg-muted/50 transition-colors">
                                                            <td className="px-5 py-3 font-semibold text-foreground text-xs">{pb.customer?.name || 'Desconhecido'}</td>
                                                            <td className="px-5 py-3 text-right font-mono font-bold text-red-500 text-xs">{formatCurrency(pb.pending_balance)}</td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </TableCard>
                            </div>
                        </TabsContent>

                        <TabsContent value="pos" className="space-y-6 animate-in fade-in-50 duration-500">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <KpiCard
                                    label="Total Turnos"
                                    value={data?.total_shifts || 0}
                                    icon={<MonitorPlay className="h-4 w-4" />}
                                    accent="slate"
                                />
                                <KpiCard
                                    label="Vendas POS"
                                    value={formatCurrency(data?.total_sales || 0)}
                                    icon={<TrendingUp className="h-4 w-4" />}
                                    accent="teal"
                                />
                                <KpiCard
                                    label="Caixa Final (Reportado)"
                                    value={formatCurrency(data?.ending_cash || 0)}
                                    icon={<MonitorPlay className="h-4 w-4" />}
                                    accent="gold"
                                    description={`Abertura: ${formatCurrency(data?.starting_cash || 0)}`}
                                />
                                <KpiCard
                                    label="Variação / Quebras"
                                    value={formatCurrency(data?.variance || 0)}
                                    icon={<AlertCircle className="h-4 w-4" />}
                                    accent={(data?.variance || 0) < 0 ? 'red' : 'slate'}
                                />
                            </div>
                        </TabsContent>
                    </>
                )}
            </Tabs>
        </div>
    );
}

ReportsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Relatórios e Estatísticas',
            href: '/reports',
        },
    ],
};
