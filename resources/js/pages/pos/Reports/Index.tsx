import KutengaLayout from '@/Layouts/kutenga-layout';
import { Head, Link } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Receipt, ShoppingBag, Calculator, Users, BarChart2, ArrowUpRight, Clock } from 'lucide-react';

function KpiCard({ icon: Icon, label, value, sub, color }: any) {
    return (
        <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm flex items-start gap-4">
            <div className={`p-3 rounded-xl ${color}`}>
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <p className="text-sm text-neutral-500">{label}</p>
                <p className="text-2xl font-bold text-neutral-900 mt-0.5 leading-none">{value}</p>
                {sub && <p className="text-xs text-neutral-400 mt-1.5">{sub}</p>}
            </div>
        </div>
    );
}

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
                                className="w-full rounded-t-sm bg-blue-500 hover:bg-blue-600 transition-colors cursor-default max-w-[32px] mx-auto"
                                style={{ height: `${Math.max(pct, 2)}%` }}
                                title={`${d.date}: ${d.total.toFixed(2)} MT (${d.count} vendas)`}
                            />
                        </div>
                        {data.length <= 14 && (
                            <span className="text-[9px] text-neutral-400 rotate-45 origin-left whitespace-nowrap hidden sm:block">{label}</span>
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
        if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
        if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
        return fmt(n);
    };

    const maxProductQty = Math.max(...topProducts.map((p: any) => p.qty), 1);

    return (
        <KutengaLayout breadcrumbs={[
            { title: 'POS', href: '/pos' },
            { title: 'Relatórios' },
        ]}>
            <Head title="Relatórios POS" />

            <div className="p-6 max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-900">Relatórios POS</h1>
                        <p className="text-sm text-neutral-500 mt-1">
                            Dados de {period.label}
                        </p>
                    </div>
                    <Link href="/pos/shifts">
                        <span className="text-sm text-blue-600 hover:text-blue-700 font-medium">Ver Turnos →</span>
                    </Link>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <KpiCard
                        icon={TrendingUp} label="Total Vendas (mês)" color="bg-blue-100 text-blue-600"
                        value={`${fmtShort(kpis.sales_total)} MT`}
                        sub={`${fmt(kpis.sales_total)} MT`}
                    />
                    <KpiCard
                        icon={Receipt} label="Transacções" color="bg-emerald-100 text-emerald-600"
                        value={kpis.transactions}
                        sub="documentos emitidos"
                    />
                    <KpiCard
                        icon={ShoppingBag} label="Ticket Médio" color="bg-purple-100 text-purple-600"
                        value={`${fmtShort(kpis.avg_ticket)} MT`}
                        sub="por transacção"
                    />
                    <KpiCard
                        icon={Calculator} label="IVA Total" color="bg-orange-100 text-orange-600"
                        value={`${fmtShort(kpis.tax_total)} MT`}
                        sub="cobrado no período"
                    />
                    <KpiCard
                        icon={Clock} label="Turnos Abertos" color="bg-neutral-100 text-neutral-600"
                        value={kpis.shifts_count}
                        sub="sessões no mês"
                    />
                </div>

                {/* Charts row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Daily sales chart */}
                    <div className="lg:col-span-2 bg-white rounded-xl border border-neutral-200 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-semibold text-neutral-800">Vendas Diárias</h2>
                            <span className="text-xs text-neutral-400">Últimos 30 dias</span>
                        </div>
                        {dailySales.length > 0 ? (
                            <BarChart data={dailySales} />
                        ) : (
                            <div className="h-32 flex items-center justify-center text-neutral-400 text-sm">
                                Sem vendas no período
                            </div>
                        )}
                    </div>

                    {/* By Operator */}
                    <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <Users className="w-4 h-4 text-neutral-400" />
                            <h2 className="font-semibold text-neutral-800">Por Operador</h2>
                        </div>
                        {byOperator.length === 0 ? (
                            <p className="text-sm text-neutral-400 text-center py-8">Sem dados</p>
                        ) : (
                            <div className="space-y-3">
                                {byOperator.map((op: any, i: number) => {
                                    const maxVal = byOperator[0].total;
                                    const pct = (op.total / maxVal) * 100;
                                    return (
                                        <div key={i}>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="font-medium text-neutral-700 truncate">{op.operator}</span>
                                                <span className="text-neutral-500 shrink-0 ml-2">{fmtShort(op.total)} MT</span>
                                            </div>
                                            <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-500 rounded-full transition-all"
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                            <p className="text-xs text-neutral-400 mt-0.5">{op.transactions} transacções</p>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Products */}
                    <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-neutral-100 flex items-center gap-2">
                            <BarChart2 className="w-4 h-4 text-neutral-400" />
                            <h2 className="font-semibold text-neutral-800">Top 10 Produtos Mais Vendidos</h2>
                        </div>
                        <div className="divide-y divide-neutral-100">
                            {topProducts.length === 0 && (
                                <p className="text-sm text-neutral-400 text-center py-8">Sem dados</p>
                            )}
                            {topProducts.map((p: any, i: number) => {
                                const pct = (p.qty / maxProductQty) * 100;
                                return (
                                    <div key={i} className="px-5 py-3">
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-neutral-400 w-4">{i + 1}.</span>
                                                <span className="text-sm font-medium text-neutral-800 truncate">{p.name}</span>
                                            </div>
                                            <div className="text-right shrink-0 ml-3">
                                                <span className="text-sm font-bold text-neutral-900">{p.qty} un</span>
                                                <span className="text-xs text-neutral-400 ml-1.5">{fmtShort(p.revenue)} MT</span>
                                            </div>
                                        </div>
                                        <div className="h-1.5 bg-neutral-100 rounded-full ml-6">
                                            <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Recent Shifts */}
                    <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
                            <h2 className="font-semibold text-neutral-800">Turnos Recentes</h2>
                            <Link href="/pos/shifts" className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-0.5">
                                Ver todos <ArrowUpRight className="w-3 h-3" />
                            </Link>
                        </div>
                        <div className="divide-y divide-neutral-100">
                            {recentShifts.length === 0 && (
                                <p className="text-sm text-neutral-400 text-center py-8">Sem turnos</p>
                            )}
                            {recentShifts.map((s: any) => (
                                <Link key={s.id} href={`/pos/shifts/${s.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-neutral-50 transition-colors group">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-neutral-800">#{String(s.id).padStart(4,'0')}</span>
                                            {s.status === 'open' ? (
                                                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0 text-xs py-0">Aberto</Badge>
                                            ) : (
                                                <Badge variant="secondary" className="text-xs py-0">Fechado</Badge>
                                            )}
                                        </div>
                                        <p className="text-xs text-neutral-400 mt-0.5">
                                            {s.operator} · {s.documents_count} vendas
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-neutral-900">{fmtShort(s.sales_total)} MT</p>
                                        <p className="text-xs text-neutral-400">
                                            {new Date(s.opened_at).toLocaleDateString('pt-MZ', { day: '2-digit', month: 'short' })}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </KutengaLayout>
    );
}
