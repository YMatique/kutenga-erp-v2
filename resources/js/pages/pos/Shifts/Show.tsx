import KutengaLayout from '@/Layouts/kutenga-layout';
import { Head, Link } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Receipt, Package, Calculator, TrendingUp, Clock, Printer } from 'lucide-react';

function StatCard({ icon: Icon, label, value, sub, color }: any) {
    return (
        <div className="bg-white rounded-xl border border-neutral-200 p-4 flex items-start gap-3 shadow-sm">
            <div className={`p-2.5 rounded-xl ${color}`}>
                <Icon className="w-4 h-4" />
            </div>
            <div>
                <p className="text-xs text-neutral-500">{label}</p>
                <p className="text-xl font-bold text-neutral-900 mt-0.5">{value}</p>
                {sub && <p className="text-xs text-neutral-400 mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}

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
        <KutengaLayout breadcrumbs={[
            { title: 'POS', href: '/pos' },
            { title: 'Turnos', href: '/pos/shifts' },
            { title: `Turno #${shift.id}` },
        ]}>
            <Head title={`Turno #${shift.id}`} />

            <div className="p-6 max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <Link href="/pos/shifts">
                                <Button variant="ghost" size="sm" className="gap-1 text-neutral-500">
                                    <ArrowLeft className="w-4 h-4" /> Voltar
                                </Button>
                            </Link>
                            <h1 className="text-2xl font-bold text-neutral-900">
                                Turno #{String(shift.id).padStart(4, '0')}
                            </h1>
                            {shift.status === 'open' ? (
                                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0 gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Em Aberto
                                </Badge>
                            ) : (
                                <Badge variant="secondary">Fechado</Badge>
                            )}
                        </div>
                        <p className="text-sm text-neutral-500 mt-2 ml-[5.5rem]">
                            {shift.operator} · {shift.branch} · {fmtDate(shift.opened_at)} → {fmtDate(shift.closed_at)}
                        </p>
                    </div>
                    {shift.status === 'open' && (
                        <Link href="/pos/shifts/close">
                            <Button variant="destructive" size="sm">Fechar Turno</Button>
                        </Link>
                    )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <StatCard icon={Receipt}    label="Documentos emitidos" value={summary.total_docs}             color="bg-blue-100 text-blue-600" />
                    <StatCard icon={TrendingUp} label="Total de Vendas"     value={`${fmt(summary.sales_total)} MT`} color="bg-emerald-100 text-emerald-600" />
                    <StatCard icon={Calculator} label="IVA Cobrado"         value={`${fmt(summary.tax_total)} MT`}   color="bg-purple-100 text-purple-600" />
                    <StatCard icon={Clock}      label="Duração"             value={duration()}                     color="bg-amber-100 text-amber-600" />
                </div>

                {/* Cash Summary */}
                <div className="bg-white rounded-xl border border-neutral-200 shadow-sm">
                    <div className="px-5 py-3 border-b border-neutral-100">
                        <h2 className="font-semibold text-neutral-800 text-sm">Resumo de Caixa</h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-neutral-100">
                        {[
                            { label: 'Fundo Maneio', value: summary.starting_cash },
                            { label: 'Total Vendas', value: summary.sales_total },
                            { label: 'Esperado', value: summary.starting_cash + summary.sales_total },
                            { label: 'Contado', value: summary.ending_cash },
                        ].map((item, i) => (
                            <div key={i} className="px-5 py-4">
                                <p className="text-xs text-neutral-400">{item.label}</p>
                                {item.value !== null && item.value !== undefined ? (
                                    <p className="text-lg font-bold text-neutral-900 mt-0.5">{fmt(item.value)} MT</p>
                                ) : (
                                    <p className="text-lg font-bold text-neutral-300 mt-0.5">—</p>
                                )}
                            </div>
                        ))}
                    </div>
                    {diff !== null && (
                        <div className={`px-5 py-3 border-t border-neutral-100 text-sm font-medium flex items-center gap-2 ${
                            Math.abs(diff) < 0.01 ? 'text-emerald-600 bg-emerald-50' :
                            diff < 0 ? 'text-red-600 bg-red-50' : 'text-amber-600 bg-amber-50'
                        } rounded-b-xl`}>
                            <span>Diferença de caixa:</span>
                            <span className="font-bold">
                                {diff >= 0 ? '+' : ''}{fmt(diff)} MT
                                {Math.abs(diff) < 0.01 ? ' ✓ Sem diferenças' : diff < 0 ? ' ⚠ Falta' : ' ↑ Excesso'}
                            </span>
                        </div>
                    )}
                    {shift.notes && (
                        <div className="px-5 py-3 border-t border-neutral-100 text-sm text-neutral-500 bg-neutral-50 rounded-b-xl">
                            <span className="font-medium text-neutral-700">Observações:</span> {shift.notes}
                        </div>
                    )}
                </div>

                {/* Documents Table */}
                <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
                        <h2 className="font-semibold text-neutral-800">Documentos Emitidos</h2>
                        <span className="text-sm text-neutral-400">{documents.length} faturas-recibo</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-neutral-50 border-b border-neutral-100">
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">Nº Documento</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">Hora</th>
                                    <th className="px-5 py-3 text-center text-xs font-semibold text-neutral-500 uppercase tracking-wide">Artigos</th>
                                    <th className="px-5 py-3 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wide">Subtotal</th>
                                    <th className="px-5 py-3 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wide">IVA</th>
                                    <th className="px-5 py-3 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wide">Total</th>
                                    <th className="px-5 py-3 text-center text-xs font-semibold text-neutral-500 uppercase tracking-wide">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100">
                                {documents.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-5 py-12 text-center text-neutral-400 text-sm">
                                            Nenhuma venda registada neste turno.
                                        </td>
                                    </tr>
                                )}
                                {documents.map((doc: any) => (
                                    <tr key={doc.id} className="hover:bg-neutral-50 transition-colors">
                                        <td className="px-5 py-3 font-mono font-medium text-blue-600 text-sm">
                                            {doc.number ?? `#${doc.id}`}
                                        </td>
                                        <td className="px-5 py-3 text-neutral-500">
                                            {new Date(doc.created_at).toLocaleTimeString('pt-MZ', { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="px-5 py-3 text-center">
                                            <span className="inline-flex items-center gap-1 text-neutral-600">
                                                <Package className="w-3.5 h-3.5" />{doc.items_count}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-right text-neutral-600">{fmt(doc.subtotal)}</td>
                                        <td className="px-5 py-3 text-right text-neutral-400">{fmt(doc.tax_total)}</td>
                                        <td className="px-5 py-3 text-right font-bold text-neutral-900">{fmt(doc.grand_total)} MT</td>
                                        <td className="px-5 py-3 text-center">
                                            <Badge variant="secondary" className="text-xs">
                                                {doc.status === 'emitted' ? 'Emitido' : doc.status}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            {documents.length > 0 && (
                                <tfoot className="bg-neutral-50 border-t-2 border-neutral-200">
                                    <tr>
                                        <td colSpan={3} className="px-5 py-3 text-sm font-semibold text-neutral-700">Totais</td>
                                        <td className="px-5 py-3 text-right font-semibold text-neutral-700">{fmt(summary.subtotal)} MT</td>
                                        <td className="px-5 py-3 text-right font-semibold text-neutral-500">{fmt(summary.tax_total)} MT</td>
                                        <td className="px-5 py-3 text-right font-bold text-neutral-900 text-base">{fmt(summary.sales_total)} MT</td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>
            </div>
        </KutengaLayout>
    );
}
