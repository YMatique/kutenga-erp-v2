import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { KpiCard, TableCard, PageHeader } from '@/components/ui/brand';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
    ShoppingBag, Users, TrendingUp, AlertCircle,
    Plus, CheckCircle2, BarChart2, ChevronRight
} from 'lucide-react';

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

            <div className="space-y-4">
                {/* Header */}
                <PageHeader
                    title="Gestão de Turnos"
                    subtitle="Controlo de todas as sessões de caixa do POS."
                    actions={
                        <>
                            <Link href="/pos/reports">
                                <Button variant="outline" size="sm" className="gap-1.5 rounded-[4px]">
                                    <BarChart2 className="w-4 h-4" /> Relatórios
                                </Button>
                            </Link>
                            {myOpenShift ? (
                                <Link href="/pos">
                                    <Button size="sm" className="gap-1.5 bg-[#2DB8A0] hover:bg-[#27a591] rounded-[4px]">
                                        <ShoppingBag className="w-4 h-4" /> Ir para o POS
                                    </Button>
                                </Link>
                            ) : (
                                <Link href="/pos/shifts/open">
                                    <Button size="sm" className="gap-1.5 bg-[#E8A020] hover:bg-[#d49218] rounded-[4px]">
                                        <Plus className="w-4 h-4" /> Abrir Turno
                                    </Button>
                                </Link>
                            )}
                        </>
                    }
                />

                {/* Alert turno aberto */}
                {myOpenShift && (
                    <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-[4px] px-5 py-3">
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
                    <KpiCard
                        label="Total de Turnos"
                        value={stats.total_shifts}
                        icon={<Users className="h-4 w-4" />}
                        accent="teal"
                    />
                    <KpiCard
                        label="Turnos em Aberto"
                        value={stats.open_shifts}
                        icon={<AlertCircle className="h-4 w-4" />}
                        accent={stats.open_shifts > 0 ? 'teal' : 'slate'}
                        description={stats.open_shifts > 0 ? 'Sessões ativas' : 'Nenhuma ativa'}
                    />
                    <KpiCard
                        label="Vendas Hoje"
                        value={`${fmt(stats.today_sales)} MT`}
                        icon={<TrendingUp className="h-4 w-4" />}
                        accent="gold"
                    />
                    <KpiCard
                        label="Vendas Este Mês"
                        value={`${fmt(stats.month_sales)} MT`}
                        icon={<BarChart2 className="h-4 w-4" />}
                        accent="orange"
                    />
                </div>

                {/* Table */}
                <TableCard>
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                        <h2 className="font-semibold text-slate-800">Histórico de Sessões</h2>
                        <span className="text-sm text-slate-400">{shifts.total} turnos</span>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50 border-b border-slate-100 hover:bg-slate-50">
                                <TableHead className="uppercase text-[10px] tracking-wider text-slate-400 font-semibold">Turno</TableHead>
                                <TableHead className="uppercase text-[10px] tracking-wider text-slate-400 font-semibold">Operador</TableHead>
                                <TableHead className="uppercase text-[10px] tracking-wider text-slate-400 font-semibold">Abertura</TableHead>
                                <TableHead className="uppercase text-[10px] tracking-wider text-slate-400 font-semibold">Fecho</TableHead>
                                <TableHead className="uppercase text-[10px] tracking-wider text-slate-400 font-semibold">Duração</TableHead>
                                <TableHead className="uppercase text-[10px] tracking-wider text-slate-400 font-semibold text-right">Fundo</TableHead>
                                <TableHead className="uppercase text-[10px] tracking-wider text-slate-400 font-semibold text-right">Vendas</TableHead>
                                <TableHead className="uppercase text-[10px] tracking-wider text-slate-400 font-semibold text-right">Caixa Final</TableHead>
                                <TableHead className="uppercase text-[10px] tracking-wider text-slate-400 font-semibold text-center">Estado</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {shifts.data.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={10} className="px-5 py-16 text-center text-slate-400">
                                        Nenhum turno registado ainda.
                                    </TableCell>
                                </TableRow>
                            )}
                            {shifts.data.map((shift: any) => {
                                const diff = shift.ending_cash !== null
                                    ? shift.ending_cash - (shift.starting_cash + shift.sales_total)
                                    : null;
                                return (
                                    <TableRow key={shift.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100 group">
                                        <TableCell className="font-mono font-semibold text-slate-700">
                                            #{String(shift.id).padStart(4, '0')}
                                        </TableCell>
                                        <TableCell className="font-medium text-slate-800">{shift.operator}</TableCell>
                                        <TableCell className="text-slate-500">{fmtDate(shift.opened_at)}</TableCell>
                                        <TableCell className="text-slate-500">{fmtDate(shift.closed_at)}</TableCell>
                                        <TableCell className="text-slate-500 text-sm">{duration(shift.opened_at, shift.closed_at)}</TableCell>
                                        <TableCell className="text-right text-slate-600">{fmt(shift.starting_cash)}</TableCell>
                                        <TableCell className="text-right font-semibold text-slate-900">
                                            {fmt(shift.sales_total)}
                                            <span className="block text-xs font-normal text-slate-400">
                                                {shift.documents_count} {shift.documents_count === 1 ? 'venda' : 'vendas'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {shift.ending_cash !== null ? (
                                                <div>
                                                    <span className="font-semibold">{fmt(shift.ending_cash)}</span>
                                                    {diff !== null && (
                                                        <span className={`block text-xs font-medium ${Math.abs(diff) < 0.01 ? 'text-slate-400' : diff >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                                            {diff >= 0 ? '+' : ''}{fmt(diff)}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-slate-300">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {shift.status === 'open' ? (
                                                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0 gap-1 rounded-[4px]">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                    Aberto
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary" className="gap-1 rounded-[4px]">
                                                    <CheckCircle2 className="w-3 h-3" /> Fechado
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Link
                                                href={`/pos/shifts/${shift.id}`}
                                                className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-xs text-[#2DB8A0] hover:text-[#27a591] font-medium transition-opacity whitespace-nowrap"
                                            >
                                                Detalhe <ChevronRight className="w-3 h-3" />
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>

                    {/* Pagination */}
                    {shifts.last_page > 1 && (
                        <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
                            <span>Página {shifts.current_page} de {shifts.last_page}</span>
                            <div className="flex gap-2">
                                {shifts.prev_page_url && (
                                    <Button variant="outline" size="sm" className="rounded-[4px]" onClick={() => router.visit(shifts.prev_page_url)}>
                                        Anterior
                                    </Button>
                                )}
                                {shifts.next_page_url && (
                                    <Button variant="outline" size="sm" className="rounded-[4px]" onClick={() => router.visit(shifts.next_page_url)}>
                                        Próxima
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </TableCard>
            </div>
        </>
    );
}

History.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={[
        { title: 'POS', href: '/pos' },
        { title: 'Turnos', href: '/pos/shifts' },
    ]}>
        {page}
    </AppLayout>
);
