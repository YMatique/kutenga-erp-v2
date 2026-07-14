import { Head, useForm } from '@inertiajs/react';
import { LogIn, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';

export default function OpenShift() {
    const { data, setData, post, processing, errors } = useForm({
        starting_cash: '0.00',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/pos/shifts/open');
    };

    return (
        <>
            <Head title="Abrir Turno" />

            <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
                <div className="bg-white rounded-[4px] shadow-xs border border-slate-200 p-10 w-full max-w-md">
                    <div className="text-center mb-8">
                        <div className="bg-[#2DB8A0]/10 text-[#2DB8A0] w-16 h-16 rounded-[4px] flex items-center justify-center mx-auto mb-5 shadow-sm">
                            <ShoppingBag className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900">Abrir Novo Turno</h2>
                        <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                            Introduza o valor inicial em caixa (fundo de maneio) para iniciar uma nova sessão de vendas no POS.
                        </p>
                    </div>

                    <form onSubmit={submit} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="starting_cash">Fundo de Maneio</Label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">MT</span>
                                <Input
                                    id="starting_cash"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className="pl-12 h-14 text-xl font-bold rounded-[4px]"
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
                            className="w-full h-12 text-base gap-2 mt-2 bg-[#E8A020] hover:bg-[#d49218] rounded-[4px]"
                            disabled={processing}
                        >
                            <LogIn className="w-4 h-4" />
                            {processing ? 'A abrir turno...' : 'Abrir Turno e Iniciar POS'}
                        </Button>
                    </form>
                </div>
            </div>
        </>
    );
}

OpenShift.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={[
        { title: 'POS', href: '/pos' },
        { title: 'Turnos', href: '/pos/shifts' },
        { title: 'Abrir Turno', href: '/pos/shifts/open' },
    ]}>
        {page}
    </AppLayout>
);
