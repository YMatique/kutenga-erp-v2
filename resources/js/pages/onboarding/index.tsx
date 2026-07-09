import { Head, useForm, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import InputError from '@/components/input-error';
import { Loader2, Building2 } from 'lucide-react';

export default function Onboarding() {
    const { auth } = usePage<any>().props;

    const { data, setData, post, processing, errors } = useForm({
        company_name: '',
        nuit: '',
        email: auth?.user?.email || '',
        phone: '',
        address: '',
        default_currency: 'MZN',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/onboarding');
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <Head title="Bem-vindo - Configurar Empresa" />

            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <div className="mx-auto h-12 w-12 bg-[#2DB8A0]/10 rounded-full flex items-center justify-center mb-4">
                    <Building2 className="h-6 w-6 text-[#2DB8A0]" />
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                    Bem-vindo ao Kutenga ERP!
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                    Para começares a usar o sistema, precisamos de configurar o perfil da tua empresa.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
                <div className="bg-white py-8 px-4 shadow-sm sm:rounded-xl sm:px-10 border border-slate-200">
                    <form onSubmit={submit} className="space-y-6">
                        
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="company_name">Nome da Empresa <span className="text-red-500">*</span></Label>
                                <Input
                                    id="company_name"
                                    type="text"
                                    value={data.company_name}
                                    onChange={(e) => setData('company_name', e.target.value)}
                                    placeholder="Ex: A Minha Empresa, Lda"
                                    className="mt-1"
                                    required
                                    autoFocus
                                />
                                <InputError message={errors.company_name} className="mt-1" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="nuit">NUIT <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="nuit"
                                        type="text"
                                        value={data.nuit}
                                        onChange={(e) => setData('nuit', e.target.value)}
                                        placeholder="Ex: 400000000"
                                        className="mt-1"
                                        required
                                    />
                                    <InputError message={errors.nuit} className="mt-1" />
                                </div>
                                <div>
                                    <Label htmlFor="default_currency">Moeda <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="default_currency"
                                        type="text"
                                        value={data.default_currency}
                                        onChange={(e) => setData('default_currency', e.target.value)}
                                        placeholder="Ex: MZN"
                                        maxLength={3}
                                        className="mt-1"
                                        required
                                    />
                                    <InputError message={errors.default_currency} className="mt-1" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 sm:col-span-1">
                                    <Label htmlFor="email">E-mail Comercial <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="comercial@empresa.com"
                                        className="mt-1"
                                        required
                                    />
                                    <InputError message={errors.email} className="mt-1" />
                                </div>
                                <div className="col-span-2 sm:col-span-1">
                                    <Label htmlFor="phone">Telefone <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="phone"
                                        type="text"
                                        value={data.phone}
                                        onChange={(e) => setData('phone', e.target.value)}
                                        placeholder="+258 84 000 0000"
                                        className="mt-1"
                                        required
                                    />
                                    <InputError message={errors.phone} className="mt-1" />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="address">Morada Completa <span className="text-red-500">*</span></Label>
                                <Textarea
                                    id="address"
                                    value={data.address}
                                    onChange={(e) => setData('address', e.target.value)}
                                    placeholder="Ex: Av. 25 de Setembro, Maputo"
                                    className="mt-1"
                                    required
                                />
                                <InputError message={errors.address} className="mt-1" />
                            </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100">
                            <Button
                                type="submit"
                                className="w-full bg-[#2DB8A0] hover:bg-[#259b86] text-white py-6 text-lg"
                                disabled={processing}
                            >
                                {processing ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        A Configurar Empresa...
                                    </>
                                ) : (
                                    'Completar Registo e Entrar no ERP'
                                )}
                            </Button>
                            <p className="text-xs text-center text-slate-500 mt-4">
                                Ao clicar neste botão, aceitas os nossos Termos de Serviço e Política de Privacidade.
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

// Ensure this page doesn't inherit the default ERP layout
Onboarding.layout = (page: any) => page;
