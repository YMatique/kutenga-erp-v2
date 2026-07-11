import { Head, Link, router } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    ShoppingBag, Users, TrendingUp, AlertCircle,
    Plus, CheckCircle2, BarChart2, ChevronRight
} from 'lucide-react';

function StatCard({ icon: Icon, label, value, sub, color }: any) {
    return (
        <div className="bg-white rounded-xl border border-neutral-200 p-5 flex items-start gap-4 shadow-sm">
            <div className={`p-3 rounded-xl ${color}`}><Icon className="w-5 h-5" /></div>
            <div>
                <p className="text-sm text-neutral-500">{label}</p>
                <p className="text-2xl font-bold text-neutral-900 mt-0.5">{value}</p>
                {sub && <p className="text-xs text-neutral-400 mt-1">{sub}</p>}
            </div>
        </div>
    );
}

export default function History({ shifts, stats, myOpenShift }: any) {
    const fmt = (n: number) =>
        n.toLocaleString('pt-MZ', { minimumFractionDigits: 2 });

    const fmtDate = (d: string | null) =>
        d ? new Date(d).toLocaleString('pt-MZ', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        }) : '—';

    const duration = (opened: string, closed: string | null) => {
        if (!closed) return <span className="text-emerald-600 font-medium">Em curso</span>;
        const ms = new Date(closed).getTime() - new Date(opened).getTime();
        const h  = Math.floor(ms / 3600000);
        const m  = Math.floor((ms % 3600000) / 60000);
        return `${h}h ${m}m`;
    };

    return (
        <>
            <Head title="Gestão de Turnos POS" />

            <div className="space-y-4 mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-900">Gestão de Turnos</h1>
                        <p className="text-sm text-neutral-500 mt-1">Controlo de todas as sessões de caixa</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href="/pos/reports">
                            <Button variant="outline" size="sm" className="gap-1.5">
                                <BarChart2 className="w-4 h-4" /> Relatórios
                            </Button>
                        </Link>
                        {myOpenShift ? (
                            <Link href="/pos">
                                <Button size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700">
                                    <ShoppingBag className="w-4 h-4" /> Ir para o POS
                                </Button>
                            </Link>
                        ) : (
                            <Link href="/pos/shifts/open">
                                <Button size="sm" className="gap-1.5">
                                    <Plus className="w-4 h-4" /> Abrir Turno
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Alert turno aberto */}
                {myOpenShift && (
                    <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-5 py-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                        <p className="text-sm font-medium">
                            Turno #{myOpenShift.id} aberto — iniciado às{' '}
                            {new Date(myOpenShift.opened_at).toLocaleTimeString('pt-MZ', { hour: '2-digit', minute: '2-digit' })}.
                        </p>
                        <div className="ml-auto flex gap-2">
                            <Link href={`/pos/shifts/${myOpenShift.id}`} className="text-sm font-medium text-emerald-700 hover:text-emerald-900">
                                Ver detalhe →
                            </Link>
                            <span className="text-emerald-300">|</span>
                            <Link href="/pos/shifts/close" className="text-sm font-semibold text-red-600 hover:text-red-700">
                                Fechar →
                            </Link>
                        </div>
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard icon={Users}      label="Total de Turnos"   value={stats.total_shifts}            color="bg-blue-100 text-blue-600" />
                    <StatCard icon={AlertCircle} label="Turnos em Aberto" value={stats.open_shifts}
                        sub={stats.open_shifts > 0 ? 'Sessões ativas' : 'Nenhuma ativa'}
                        color={stats.open_shifts > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-neutral-100 text-neutral-400'} />
                    <StatCard icon={TrendingUp} label="Vendas Hoje"       value={`${fmt(stats.today_sales)} MT`}  color="bg-purple-100 text-purple-600" />
                    <StatCard icon={BarChart2}  label="Vendas Este Mês"   value={`${fmt(stats.month_sales)} MT`}  color="bg-amber-100 text-amber-600" />
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
                        <h2 className="font-semibold text-neutral-800">Histórico de Sessões</h2>
                        <span className="text-sm text-neutral-400">{shifts.total} turnos</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-neutral-50 border-b border-neutral-100 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                                    <th className="px-5 py-3 text-left">Turno</th>
                                    <th className="px-5 py-3 text-left">Operador</th>
                                    <th className="px-5 py-3 text-left">Abertura</th>
                                    <th className="px-5 py-3 text-left">Fecho</th>
                                    <th className="px-5 py-3 text-left">Duração</th>
                                    <th className="px-5 py-3 text-right">Fundo</th>
                                    <th className="px-5 py-3 text-right">Vendas</th>
                                    <th className="px-5 py-3 text-right">Caixa Final</th>
                                    <th className="px-5 py-3 text-center">Estado</th>
                                    <th className="px-5 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100">
                                {shifts.data.length === 0 && (
                                    <tr>
                                        <td colSpan={10} className="px-5 py-16 text-center text-neutral-400">
                                            Nenhum turno registado ainda.
                                        </td>
                                    </tr>
                                )}
                                {shifts.data.map((shift: any) => {
                                    const diff = shift.ending_cash !== null
                                        ? shift.ending_cash - (shift.starting_cash + shift.sales_total)
                                        : null;
                                    return (
                                        <tr key={shift.id} className="hover:bg-neutral-50 transition-colors group">
                                            <td className="px-5 py-4 font-mono font-semibold text-neutral-700">
                                                #{String(shift.id).padStart(4, '0')}
                                            </td>
                                            <td className="px-5 py-4 font-medium text-neutral-800">{shift.operator}</td>
                                            <td className="px-5 py-4 text-neutral-500">{fmtDate(shift.opened_at)}</td>
                                            <td className="px-5 py-4 text-neutral-500">{fmtDate(shift.closed_at)}</td>
                                            <td className="px-5 py-4 text-neutral-500 text-sm">{duration(shift.opened_at, shift.closed_at)}</td>
                                            <td className="px-5 py-4 text-right text-neutral-600">{fmt(shift.starting_cash)}</td>
                                            <td className="px-5 py-4 text-right font-semibold text-neutral-900">
                                                {fmt(shift.sales_total)}
                                                <span className="block text-xs font-normal text-neutral-400">
                                                    {shift.documents_count} {shift.documents_count === 1 ? 'venda' : 'vendas'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                {shift.ending_cash !== null ? (
                                                    <div>
                                                        <span className="font-semibold">{fmt(shift.ending_cash)}</span>
                                                        {diff !== null && (
                                                            <span className={`block text-xs font-medium ${Math.abs(diff) < 0.01 ? 'text-neutral-400' : diff >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                                                {diff >= 0 ? '+' : ''}{fmt(diff)}
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-neutral-300">—</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                {shift.status === 'open' ? (
                                                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0 gap-1">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                        Aberto
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="gap-1">
                                                        <CheckCircle2 className="w-3 h-3" /> Fechado
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="px-5 py-4">
                                                <Link
                                                    href={`/pos/shifts/${shift.id}`}
                                                    className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium transition-opacity whitespace-nowrap"
                                                >
                                                    Detalhe <ChevronRight className="w-3 h-3" />
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {shifts.last_page > 1 && (
                        <div className="px-5 py-4 border-t border-neutral-100 flex items-center justify-between text-sm text-neutral-500">
                            <span>Página {shifts.current_page} de {shifts.last_page}</span>
                            <div className="flex gap-2">
                                {shifts.prev_page_url && (
                                    <Button variant="outline" size="sm" onClick={() => router.visit(shifts.prev_page_url)}>
                                        Anterior
                                    </Button>
                                )}
                                {shifts.next_page_url && (
                                    <Button variant="outline" size="sm" onClick={() => router.visit(shifts.next_page_url)}>
                                        Próxima
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
