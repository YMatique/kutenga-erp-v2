import { Head, useForm } from '@inertiajs/react';
import PosLayout from '@/Layouts/pos-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogOut, Calculator } from 'lucide-react';

export default function CloseShift({ shift, salesTotal }: any) {
    const { data, setData, post, processing, errors } = useForm({
        ending_cash: (parseFloat(shift.starting_cash) + parseFloat(salesTotal)).toFixed(2),
        notes: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('pos.shifts.close', shift.id));
    };

    return (
        <PosLayout title="Fechar Turno">
            <div className="flex-1 flex items-center justify-center p-6 bg-neutral-100">
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-8 w-full max-w-2xl flex gap-8">
                    
                    {/* Resumo do Sistema */}
                    <div className="flex-1 border-r border-neutral-200 pr-8">
                        <div className="mb-6 flex items-center gap-3 text-neutral-800">
                            <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                                <Calculator className="w-6 h-6" />
                            </div>
                            <h2 className="text-xl font-semibold">Resumo do Sistema</h2>
                        </div>
                        
                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between items-center py-2 border-b border-neutral-100">
                                <span className="text-neutral-500">Fundo de Maneio (Abertura)</span>
                                <span className="font-medium">{parseFloat(shift.starting_cash).toFixed(2)} MT</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-neutral-100">
                                <span className="text-neutral-500">Total de Vendas no Turno</span>
                                <span className="font-medium text-green-600">+{parseFloat(salesTotal).toFixed(2)} MT</span>
                            </div>
                            <div className="flex justify-between items-center py-4 mt-4 bg-neutral-50 rounded-lg px-4">
                                <span className="font-bold text-neutral-900">Total Esperado em Caixa</span>
                                <span className="font-bold text-xl text-neutral-900">
                                    {(parseFloat(shift.starting_cash) + parseFloat(salesTotal)).toFixed(2)} MT
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Formulário de Fecho */}
                    <div className="flex-1">
                        <div className="mb-6 flex items-center gap-3 text-neutral-800">
                            <div className="bg-red-100 text-red-600 p-2 rounded-lg">
                                <LogOut className="w-6 h-6" />
                            </div>
                            <h2 className="text-xl font-semibold">Confirmar Fecho</h2>
                        </div>

                        <form onSubmit={submit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="ending_cash">Valor Contado em Caixa</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                                        MT
                                    </span>
                                    <Input
                                        id="ending_cash"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="pl-10 text-lg font-medium border-red-200 focus-visible:ring-red-500"
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
                                <Label htmlFor="notes">Notas / Justificação (Opcional)</Label>
                                <Input
                                    id="notes"
                                    placeholder="Ex: Diferença de trocos, etc."
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                />
                                {errors.notes && (
                                    <p className="text-sm text-red-600">{errors.notes}</p>
                                )}
                            </div>

                            <Button 
                                type="submit" 
                                className="w-full text-lg h-12 bg-red-600 hover:bg-red-700" 
                                disabled={processing}
                            >
                                {processing ? 'Fechando...' : 'Confirmar Fecho de Turno'}
                            </Button>
                        </form>
                    </div>

                </div>
            </div>
        </PosLayout>
    );
}
