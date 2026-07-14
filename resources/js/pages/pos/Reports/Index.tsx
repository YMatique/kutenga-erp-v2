import { Head, Link } from '@inertiajs/react';
import { TrendingUp, Receipt, ShoppingBag, Calculator, Users, BarChart2, ArrowUpRight, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { KpiCard, TableCard, PageHeader } from '@/components/ui/brand';
import AppLayout from '@/layouts/app-layout';

// Simple bar chart using CSS
function BarChart({ data }: { data: Array<{ date: string; total: number; count: number }> }) {
    const max = Math.max(...data.map(d => d.total), 1);

    return (
        <div className="flex items-end gap-1 h-32 w-full">
            {data.map((d, i) => {
                const pct = (d.total / max) * 100;
                const label = new Date(d.date + 'T00:00:00').toLocaleDateString('pt-MZ', { day: '2-digit', month: 'short' });

                return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group min-w-0">
                        <div className="relative w-full flex items-end justify-center" style={{ height: '96px' }}>
                            <div
                                className="w-full rounded-t-sm bg-[#2DB8A0] hover:bg-[#27a591] transition-colors cursor-default max-w-[32px] mx-auto"
                                style={{ height: `${Math.max(pct, 2)}%` }}
                                title={`${d.date}: ${d.total.toFixed(2)} MT (${d.count} vendas)`}
                            />
                        </div>
                        {data.length <= 14 && (
                            <span className="text-[9px] text-slate-400 rotate-45 origin-left whitespace-nowrap hidden sm:block">{label}</span>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export default function PosReports({ kpis, dailySales, byOperator, topProducts, recentShifts, period }: any) {
    const fmt = (n: number) => n.toLocaleString('pt-MZ', { minimumFractionDigits: 2 });
    const fmtShort = (n: number) => {
        if (n >= 1_000_000) {
return (n / 1_000_000).toFixed(1) + 'M';
}

        if (n >= 1_000)     {
return (n / 1_000).toFixed(1) + 'K';
}

        return fmt(n);
    };

    const maxProductQty = Math.max(...topProducts.map((p: any) => p.qty), 1);

    return (
        <>
            <Head title="Relatórios POS" />

            <div className="space-y-6">
                {/* Header */}
                <PageHeader
                    title="Relatórios POS"
                    subtitle={`Dados de ${period.label}`}
                    actions={
                        <Link href="/pos/shifts" className="text-sm text-[#2DB8A0] hover:text-[#27a591] font-medium">
                            Ver Turnos →
                        </Link>
                    }
                />

                {/* KPIs */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <KpiCard
                        label="Total Vendas (mês)"
                        value={`${fmtShort(kpis.sales_total)} MT`}
                        icon={<TrendingUp className="h-4 w-4" />}
                        accent="teal"
                        description={`${fmt(kpis.sales_total)} MT`}
                    />
                    <KpiCard
                        label="Transacções"
                        value={kpis.transactions}
                        icon={<Receipt className="h-4 w-4" />}
                        accent="teal"
                        description="documentos emitidos"
                    />
                    <KpiCard
                        label="Ticket Médio"
                        value={`${fmtShort(kpis.avg_ticket)} MT`}
                        icon={<ShoppingBag className="h-4 w-4" />}
                        accent="gold"
                        description="por transacção"
                    />
                    <KpiCard
                        label="IVA Total"
                        value={`${fmtShort(kpis.tax_total)} MT`}
                        icon={<Calculator className="h-4 w-4" />}
                        accent="orange"
                        description="cobrado no período"
                    />
                    <KpiCard
                        label="Turnos no Mês"
                        value={kpis.shifts_count}
                        icon={<Clock className="h-4 w-4" />}
                        accent="slate"
                        description="sessões no mês"
                    />
                </div>

                {/* Charts row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Daily sales chart */}
                    <TableCard className="lg:col-span-2">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="font-semibold text-slate-800">Vendas Diárias</h2>
                            <span className="text-xs text-slate-400">Últimos 30 dias</span>
                        </div>
                        <div className="p-5">
                            {dailySales.length > 0 ? (
                                <BarChart data={dailySales} />
                            ) : (
                                <div className="h-32 flex items-center justify-center text-slate-400 text-sm">
                                    Sem vendas no período
                                </div>
                            )}
                        </div>
                    </TableCard>

                    {/* By Operator */}
                    <TableCard>
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                            <Users className="w-4 h-4 text-slate-400" />
                            <h2 className="font-semibold text-slate-800">Por Operador</h2>
                        </div>
                        <div className="p-5">
                            {byOperator.length === 0 ? (
                                <p className="text-sm text-slate-400 text-center py-8">Sem dados</p>
                            ) : (
                                <div className="space-y-3">
                                    {byOperator.map((op: any, i: number) => {
                                        const maxVal = byOperator[0].total;
                                        const pct = (op.total / maxVal) * 100;

                                        return (
                                            <div key={i}>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="font-medium text-slate-700 truncate">{op.operator}</span>
                                                    <span className="text-slate-500 shrink-0 ml-2">{fmtShort(op.total)} MT</span>
                                                </div>
                                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-[#2DB8A0] rounded-full transition-all"
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                                <p className="text-xs text-slate-400 mt-0.5">{op.transactions} transacções</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </TableCard>
                </div>

                {/* Bottom row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Products */}
                    <TableCard>
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                            <BarChart2 className="w-4 h-4 text-slate-400" />
                            <h2 className="font-semibold text-slate-800">Top 10 Produtos Mais Vendidos</h2>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {topProducts.length === 0 && (
                                <p className="text-sm text-slate-400 text-center py-8">Sem dados</p>
                            )}
                            {topProducts.map((p: any, i: number) => {
                                const pct = (p.qty / maxProductQty) * 100;

                                return (
                                    <div key={i} className="px-5 py-3">
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-slate-400 w-4">{i + 1}.</span>
                                                <span className="text-sm font-medium text-slate-800 truncate">{p.name}</span>
                                            </div>
                                            <div className="text-right shrink-0 ml-3">
                                                <span className="text-sm font-bold text-slate-900">{p.qty} un</span>
                                                <span className="text-xs text-slate-400 ml-1.5">{fmtShort(p.revenue)} MT</span>
                                            </div>
                                        </div>
                                        <div className="h-1.5 bg-slate-100 rounded-full ml-6">
                                            <div className="h-full bg-[#2DB8A0] rounded-full" style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </TableCard>

                    {/* Recent Shifts */}
                    <TableCard>
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="font-semibold text-slate-800">Turnos Recentes</h2>
                            <Link href="/pos/shifts" className="text-xs text-[#2DB8A0] hover:text-[#27a591] font-medium flex items-center gap-0.5">
                                Ver todos <ArrowUpRight className="w-3 h-3" />
                            </Link>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {recentShifts.length === 0 && (
                                <p className="text-sm text-slate-400 text-center py-8">Sem turnos</p>
                            )}
                            {recentShifts.map((s: any) => (
                                <Link key={s.id} href={`/pos/shifts/${s.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors group">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-slate-800">#{String(s.id).padStart(4,'0')}</span>
                                            {s.status === 'open' ? (
                                                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0 text-xs py-0 rounded-[4px]">Aberto</Badge>
                                            ) : (
                                                <Badge variant="secondary" className="text-xs py-0 rounded-[4px]">Fechado</Badge>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            {s.operator} · {s.documents_count} vendas
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-slate-900">{fmtShort(s.sales_total)} MT</p>
                                        <p className="text-xs text-slate-400">
                                            {new Date(s.opened_at).toLocaleDateString('pt-MZ', { day: '2-digit', month: 'short' })}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </TableCard>
                </div>
            </div>
        </>
    );
}

PosReports.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={[
        { title: 'POS', href: '/pos' },
        { title: 'Relatórios', href: '/pos/reports' },
    ]}>
        {page}
    </AppLayout>
);
