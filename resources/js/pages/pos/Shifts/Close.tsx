import KutengaLayout from '@/Layouts/kutenga-layout';
import { Head } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    LogOut, Calculator, ShoppingBag, Receipt,
    CheckCircle2, ArrowRight, AlertTriangle
} from 'lucide-react';

export default function CloseShift({ shift, salesTotal, totalDocs, expectedCash }: any) {
    const { data, setData, post, processing, errors } = useForm({
        ending_cash: expectedCash.toFixed(2),
        notes: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('pos.shifts.close', shift.id));
    };

    const counted = parseFloat(data.ending_cash || '0');
    const diff = counted - expectedCash;
    const isShortage = diff < -0.01;
    const isExcess = diff > 0.01;

    const fmt = (n: number) =>
        n.toLocaleString('pt-MZ', { minimumFractionDigits: 2 });

    const fmtTime = (d: string) =>
        new Date(d).toLocaleString('pt-MZ', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });

    return (
        <KutengaLayout breadcrumbs={[
            { title: 'POS', href: '/pos' },
            { title: 'Turnos', href: '/pos/shifts' },
            { title: 'Fechar Turno' }
        ]}>
            <Head title="Fechar Turno" />

            <div className="p-6 max-w-5xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900">Fechar Turno #{shift.id}</h1>
                    <p className="text-sm text-neutral-500 mt-1">
                        Aberto em {fmtTime(shift.opened_at)}
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: Resumo do sistema */}
                    <div className="space-y-4">
                        <h2 className="font-semibold text-neutral-800">Resumo do Turno</h2>

                        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm divide-y divide-neutral-100">
                            <div className="flex items-center justify-between px-5 py-4">
                                <div className="flex items-center gap-3 text-neutral-600">
                                    <div className="p-2 bg-blue-50 rounded-lg">
                                        <Calculator className="w-4 h-4 text-blue-500" />
                                    </div>
                                    <span className="text-sm">Fundo de Maneio</span>
                                </div>
                                <span className="font-semibold">{fmt(parseFloat(shift.starting_cash))} MT</span>
                            </div>

                            <div className="flex items-center justify-between px-5 py-4">
                                <div className="flex items-center gap-3 text-neutral-600">
                                    <div className="p-2 bg-green-50 rounded-lg">
                                        <Receipt className="w-4 h-4 text-green-500" />
                                    </div>
                                    <div>
                                        <span className="text-sm block">Total de Vendas</span>
                                        <span className="text-xs text-neutral-400">{totalDocs} {totalDocs === 1 ? 'documento' : 'documentos'}</span>
                                    </div>
                                </div>
                                <span className="font-semibold text-green-600">+{fmt(salesTotal)} MT</span>
                            </div>

                            <div className="flex items-center justify-between px-5 py-5 bg-neutral-50 rounded-b-xl">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-50 rounded-lg">
                                        <ShoppingBag className="w-4 h-4 text-purple-500" />
                                    </div>
                                    <span className="font-semibold text-neutral-800">Total Esperado em Caixa</span>
                                </div>
                                <span className="text-xl font-bold text-neutral-900">{fmt(expectedCash)} MT</span>
                            </div>
                        </div>

                        {/* Difference indicator */}
                        {(isShortage || isExcess) && (
                            <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${
                                isShortage
                                    ? 'bg-red-50 border-red-200 text-red-700'
                                    : 'bg-amber-50 border-amber-200 text-amber-700'
                            }`}>
                                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-sm font-semibold">
                                        {isShortage ? 'Diferença negativa' : 'Excesso de caixa'}
                                    </p>
                                    <p className="text-xs mt-0.5">
                                        {isShortage
                                            ? `Caixa em falta: ${fmt(Math.abs(diff))} MT`
                                            : `Excesso: ${fmt(diff)} MT`}
                                    </p>
                                </div>
                            </div>
                        )}

                        {counted > 0 && !isShortage && !isExcess && (
                            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-700">
                                <CheckCircle2 className="w-4 h-4 shrink-0" />
                                <p className="text-sm font-medium">Caixa conferida sem diferenças.</p>
                            </div>
                        )}
                    </div>

                    {/* Right: Form */}
                    <div className="space-y-4">
                        <h2 className="font-semibold text-neutral-800">Confirmação de Fecho</h2>

                        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6">
                            <form onSubmit={submit} className="space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="ending_cash">Valor Físico Contado em Caixa</Label>
                                    <div className="relative">
                                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 font-medium text-sm">MT</span>
                                        <Input
                                            id="ending_cash"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            className="pl-12 h-14 text-xl font-bold"
                                            value={data.ending_cash}
                                            onChange={(e) => setData('ending_cash', e.target.value)}
                                            required
                                            autoFocus
                                        />
                                    </div>
                                    {errors.ending_cash && (
                                        <p className="text-sm text-red-600">{errors.ending_cash}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="notes">Observações (opcional)</Label>
                                    <Input
                                        id="notes"
                                        placeholder="Ex: diferença de troco, pagamentos por cartão, etc."
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                    />
                                </div>

                                <div className="pt-2 space-y-3">
                                    <Button
                                        type="submit"
                                        className="w-full h-12 bg-red-600 hover:bg-red-700 text-white gap-2"
                                        disabled={processing}
                                    >
                                        <LogOut className="w-4 h-4" />
                                        {processing ? 'A fechar turno...' : 'Confirmar Fecho de Turno'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </KutengaLayout>
    );
}
