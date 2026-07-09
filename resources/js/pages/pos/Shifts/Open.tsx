import { Head, useForm } from '@inertiajs/react';
import PosLayout from '@/Layouts/pos-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogIn } from 'lucide-react';

export default function OpenShift() {
    const { data, setData, post, processing, errors } = useForm({
        starting_cash: '0.00',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('pos.shifts.store'));
    };

    return (
        <PosLayout title="Abrir Turno">
            <div className="flex-1 flex items-center justify-center p-6">
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-8 w-full max-w-md">
                    <div className="text-center mb-8">
                        <div className="bg-blue-100 text-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <LogIn className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-semibold text-neutral-900">Abrir Novo Turno</h2>
                        <p className="text-neutral-500 mt-2">
                            Para iniciar as vendas no POS, é necessário abrir um turno informando o valor inicial em caixa.
                        </p>
                    </div>

                    <form onSubmit={submit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="starting_cash">Fundo de Maneio (Valor Inicial)</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                                    MT
                                </span>
                                <Input
                                    id="starting_cash"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className="pl-10 text-lg font-medium"
                                    value={data.starting_cash}
                                    onChange={(e) => setData('starting_cash', e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>
                            {errors.starting_cash && (
                                <p className="text-sm text-red-600">{errors.starting_cash}</p>
                            )}
                        </div>

                        <Button 
                            type="submit" 
                            className="w-full text-lg h-12" 
                            disabled={processing}
                        >
                            {processing ? 'Abrindo...' : 'Abrir Turno e Iniciar POS'}
                        </Button>
                    </form>
                </div>
            </div>
        </PosLayout>
    );
}
