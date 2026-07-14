import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Receipt, Package, Calculator, TrendingUp, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { KpiCard, TableCard, PageHeader } from '@/components/ui/brand';
import { Button } from '@/components/ui/button';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';

export default function ShiftShow({ shift, documents, summary }: any) {
    const fmt = (n: number) =>
        n.toLocaleString('pt-MZ', { minimumFractionDigits: 2 });

    const fmtDate = (d: string | null) =>
        d ? new Date(d).toLocaleString('pt-MZ', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        }) : '—';

    const duration = () => {
        const start = new Date(shift.opened_at).getTime();
        const end   = shift.closed_at ? new Date(shift.closed_at).getTime() : Date.now();
        const ms    = end - start;
        const h     = Math.floor(ms / 3600000);
        const m     = Math.floor((ms % 3600000) / 60000);

        return `${h}h ${m}m`;
    };

    const diff = summary.ending_cash !== null
        ? summary.ending_cash - (summary.starting_cash + summary.sales_total)
        : null;

    return (
        <>
            <Head title={`Turno #${shift.id}`} />

            <div className="space-y-6">
                {/* Header */}
                <PageHeader
                    title={`Turno #${String(shift.id).padStart(4, '0')}`}
                    subtitle={`${shift.operator} · ${shift.branch} · ${fmtDate(shift.opened_at)} → ${fmtDate(shift.closed_at)}`}
                    actions={
                        <div className="flex items-center gap-2">
                            {shift.status === 'open' ? (
                                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0 gap-1.5 rounded-[4px]">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Em Aberto
                                </Badge>
                            ) : (
                                <Badge variant="secondary" className="rounded-[4px]">Fechado</Badge>
                            )}
                            <Link href="/pos/shifts">
                                <Button variant="outline" size="sm" className="gap-1 rounded-[4px]">
                                    <ArrowLeft className="w-4 h-4" /> Voltar
                                </Button>
                            </Link>
                            {shift.status === 'open' && (
                                <Link href="/pos/shifts/close">
                                    <Button variant="destructive" size="sm" className="rounded-[4px]">Fechar Turno</Button>
                                </Link>
                            )}
                        </div>
                    }
                />

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <KpiCard
                        label="Documentos Emitidos"
                        value={summary.total_docs}
                        icon={<Receipt className="h-4 w-4" />}
                        accent="teal"
                    />
                    <KpiCard
                        label="Total de Vendas"
                        value={`${fmt(summary.sales_total)} MT`}
                        icon={<TrendingUp className="h-4 w-4" />}
                        accent="teal"
                    />
                    <KpiCard
                        label="IVA Cobrado"
                        value={`${fmt(summary.tax_total)} MT`}
                        icon={<Calculator className="h-4 w-4" />}
                        accent="gold"
                    />
                    <KpiCard
                        label="Duração"
                        value={duration()}
                        icon={<Clock className="h-4 w-4" />}
                        accent="slate"
                    />
                </div>

                {/* Cash Summary */}
                <TableCard>
                    <div className="px-5 py-3 border-b border-slate-100">
                        <h2 className="font-semibold text-slate-800 text-sm">Resumo de Caixa</h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-100">
                        {[
                            { label: 'Fundo Maneio', value: summary.starting_cash },
                            { label: 'Total Vendas', value: summary.sales_total },
                            { label: 'Esperado', value: summary.starting_cash + summary.sales_total },
                            { label: 'Contado', value: summary.ending_cash },
                        ].map((item, i) => (
                            <div key={i} className="px-5 py-4">
                                <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">{item.label}</p>
                                {item.value !== null && item.value !== undefined ? (
                                    <p className="text-lg font-bold text-slate-900 mt-0.5">{fmt(item.value)} MT</p>
                                ) : (
                                    <p className="text-lg font-bold text-slate-300 mt-0.5">—</p>
                                )}
                            </div>
                        ))}
                    </div>
                    {diff !== null && (
                        <div className={`px-5 py-3 border-t border-slate-100 text-sm font-medium flex items-center gap-2 ${
                            Math.abs(diff) < 0.01 ? 'text-emerald-600 bg-emerald-50' :
                            diff < 0 ? 'text-red-600 bg-red-50' : 'text-amber-600 bg-amber-50'
                        }`}>
                            <span>Diferença de caixa:</span>
                            <span className="font-bold">
                                {diff >= 0 ? '+' : ''}{fmt(diff)} MT
                                {Math.abs(diff) < 0.01 ? ' ✓ Sem diferenças' : diff < 0 ? ' ⚠ Falta' : ' ↑ Excesso'}
                            </span>
                        </div>
                    )}
                    {shift.notes && (
                        <div className="px-5 py-3 border-t border-slate-100 text-sm text-slate-500 bg-slate-50">
                            <span className="font-medium text-slate-700">Observações:</span> {shift.notes}
                        </div>
                    )}
                </TableCard>

                {/* Documents Table */}
                <TableCard>
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                        <h2 className="font-semibold text-slate-800">Documentos Emitidos</h2>
                        <span className="text-sm text-slate-400">{documents.length} faturas-recibo</span>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50 border-b border-slate-100 hover:bg-slate-50">
                                <TableHead className="uppercase text-[10px] tracking-wider text-slate-400 font-semibold">Nº Documento</TableHead>
                                <TableHead className="uppercase text-[10px] tracking-wider text-slate-400 font-semibold">Hora</TableHead>
                                <TableHead className="uppercase text-[10px] tracking-wider text-slate-400 font-semibold text-center">Artigos</TableHead>
                                <TableHead className="uppercase text-[10px] tracking-wider text-slate-400 font-semibold text-right">Subtotal</TableHead>
                                <TableHead className="uppercase text-[10px] tracking-wider text-slate-400 font-semibold text-right">IVA</TableHead>
                                <TableHead className="uppercase text-[10px] tracking-wider text-slate-400 font-semibold text-right">Total</TableHead>
                                <TableHead className="uppercase text-[10px] tracking-wider text-slate-400 font-semibold text-center">Estado</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {documents.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="px-5 py-12 text-center text-slate-400 text-sm">
                                        Nenhuma venda registada neste turno.
                                    </TableCell>
                                </TableRow>
                            )}
                            {documents.map((doc: any) => (
                                <TableRow key={doc.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100">
                                    <TableCell className="font-mono font-medium text-[#2DB8A0] text-sm">
                                        {doc.number ?? `#${doc.id}`}
                                    </TableCell>
                                    <TableCell className="text-slate-500">
                                        {new Date(doc.created_at).toLocaleTimeString('pt-MZ', { hour: '2-digit', minute: '2-digit' })}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <span className="inline-flex items-center gap-1 text-slate-600">
                                            <Package className="w-3.5 h-3.5" />{doc.items_count}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right text-slate-600">{fmt(doc.subtotal)}</TableCell>
                                    <TableCell className="text-right text-slate-400">{fmt(doc.tax_total)}</TableCell>
                                    <TableCell className="text-right font-bold text-slate-900">{fmt(doc.grand_total)} MT</TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="secondary" className="text-xs rounded-[4px]">
                                            {doc.status === 'emitted' ? 'Emitido' : doc.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                        {documents.length > 0 && (
                            <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                                <tr>
                                    <td colSpan={3} className="px-4 py-3 text-sm font-semibold text-slate-700">Totais</td>
                                    <td className="px-4 py-3 text-right font-semibold text-slate-700">{fmt(summary.subtotal)} MT</td>
                                    <td className="px-4 py-3 text-right font-semibold text-slate-500">{fmt(summary.tax_total)} MT</td>
                                    <td className="px-4 py-3 text-right font-bold text-slate-900 text-base">{fmt(summary.sales_total)} MT</td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        )}
                    </Table>
                </TableCard>
            </div>
        </>
    );
}

ShiftShow.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={[
        { title: 'POS', href: '/pos' },
        { title: 'Turnos', href: '/pos/shifts' },
        { title: 'Detalhe do Turno', href: '' },
    ]}>
        {page}
    </AppLayout>
);
