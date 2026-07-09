import KutengaLayout from '@/Layouts/kutenga-layout';
import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogIn, ShoppingBag } from 'lucide-react';

export default function OpenShift() {
    const { data, setData, post, processing, errors } = useForm({
        starting_cash: '0.00',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('pos.shifts.store'));
    };

    return (
        <KutengaLayout breadcrumbs={[
            { title: 'POS', href: '/pos' },
            { title: 'Turnos', href: '/pos/shifts' },
            { title: 'Abrir Turno' }
        ]}>
            <Head title="Abrir Turno" />

            <div className="p-6 flex items-center justify-center min-h-[calc(100vh-10rem)]">
                <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-10 w-full max-w-md">
                    <div className="text-center mb-8">
                        <div className="bg-blue-100 text-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-md shadow-blue-100">
                            <ShoppingBag className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-neutral-900">Abrir Novo Turno</h2>
                        <p className="text-neutral-500 mt-2 text-sm leading-relaxed">
                            Introduza o valor inicial em caixa (fundo de maneio) para iniciar uma nova sessão de vendas no POS.
                        </p>
                    </div>

                    <form onSubmit={submit} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="starting_cash">Fundo de Maneio</Label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-sm font-medium">MT</span>
                                <Input
                                    id="starting_cash"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className="pl-12 h-14 text-xl font-bold"
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
                            className="w-full h-12 text-base gap-2 mt-2"
                            disabled={processing}
                        >
                            <LogIn className="w-4 h-4" />
                            {processing ? 'A abrir turno...' : 'Abrir Turno e Iniciar POS'}
                        </Button>
                    </form>
                </div>
            </div>
        </KutengaLayout>
    );
}
