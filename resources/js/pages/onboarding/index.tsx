import { Head, useForm, usePage } from '@inertiajs/react';
import { Loader2, Building2, CheckCircle2, Store, Briefcase, FileText, BarChart3 } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export default function Onboarding({ existingCompany }: { existingCompany?: any }) {
    const { auth } = usePage<any>().props;

    const { data, setData, post, processing, errors } = useForm({
        company_name: existingCompany?.name || '',
        nuit: existingCompany?.nuit || '',
        email: existingCompany?.email || auth?.user?.email || '',
        phone: existingCompany?.phone || '',
        address: existingCompany?.address || '',
        default_currency: existingCompany?.default_currency || 'MZN',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/onboarding');
    };

    const isCompletion = !!existingCompany;

    const features = [
        {
            icon: <FileText className="h-5 w-5 text-[#2DB8A0]" />,
            title: "Faturação Simplificada",
            description: "Emite faturas, cotações e recibos em segundos, com design profissional."
        },
        {
            icon: <Store className="h-5 w-5 text-[#2DB8A0]" />,
            title: "Controlo de Inventário",
            description: "Gere os teus produtos, serviços, armazéns e transferências em tempo real."
        },
        {
            icon: <Briefcase className="h-5 w-5 text-[#2DB8A0]" />,
            title: "Gestão de Clientes",
            description: "Mantém um histórico completo de todas as interações e dívidas dos teus clientes."
        },
        {
            icon: <BarChart3 className="h-5 w-5 text-[#2DB8A0]" />,
            title: "Relatórios e Análises",
            description: "Toma decisões informadas com base em dados concretos sobre o teu negócio."
        }
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
            <Head title={isCompletion ? "Completar Perfil" : "Bem-vindo ao Kutenga"} />

            {/* LEFTSIDE: Branding & Information */}
            <div className="hidden md:flex md:w-[45%] lg:w-[40%] bg-slate-950 text-white flex-col justify-between p-12 relative overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#2DB8A0]/10 blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[#2DB8A0]/5 blur-[120px]" />

                <div className="relative z-10">
                    <div className="mb-16 flex items-center text-white">
                        <AppLogo />
                    </div>

                    <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-6">
                        O teu negócio,<br />
                        <span className="text-[#2DB8A0]">no próximo nível.</span>
                    </h1>
                    
                    <p className="text-slate-400 text-lg mb-12 max-w-md leading-relaxed">
                        Estás a um passo de desbloquear o poder do Kutenga ERP. Junta-te a centenas de empresas que já transformaram a sua gestão.
                    </p>

                    <div className="space-y-8">
                        {features.map((feature, idx) => (
                            <div key={idx} className="flex gap-4 items-start">
                                <div className="mt-1 bg-white/5 p-2 rounded-lg border border-white/10">
                                    {feature.icon}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white text-base">{feature.title}</h3>
                                    <p className="text-slate-400 text-sm mt-1 leading-relaxed">{feature.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="relative z-10 mt-12 pt-8 border-t border-white/10 flex items-center justify-between text-sm text-slate-500">
                    <p>&copy; {new Date().getFullYear()} Kutenga ERP</p>
                    <div className="flex gap-4">
                        <a href="#" className="hover:text-white transition-colors">Termos</a>
                        <a href="#" className="hover:text-white transition-colors">Privacidade</a>
                    </div>
                </div>
            </div>

            {/* RIGHTSIDE: Form */}
            <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-20 xl:px-32 relative">
                
                {/* Mobile Logo (only visible on small screens) */}
                <div className="md:hidden flex justify-center mb-8">
                    <AppLogo />
                </div>

                <div className="w-full max-w-[550px] mx-auto">
                    <div className="mb-8">
                        <div className="inline-flex items-center justify-center p-3 bg-[#2DB8A0]/10 rounded-xl mb-6">
                            <Building2 className="h-6 w-6 text-[#2DB8A0]" />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                            {isCompletion ? "Completar os teus dados" : "Configurar Empresa"}
                        </h2>
                        <p className="mt-2 text-slate-500 text-base">
                            {isCompletion 
                                ? "Precisamos de alguns detalhes finais sobre a tua empresa para começarmos a faturar." 
                                : "Preenche os detalhes abaixo para criar o teu espaço de trabalho no Kutenga."}
                        </p>
                    </div>

                    <form onSubmit={submit} className="space-y-6 bg-white p-8 rounded-2xl border border-slate-200/60 shadow-sm">
                        
                        <div className="space-y-5">
                            <div>
                                <Label htmlFor="company_name" className="text-slate-700">Nome da Empresa <span className="text-red-500">*</span></Label>
                                <Input
                                    id="company_name"
                                    type="text"
                                    value={data.company_name}
                                    onChange={(e) => setData('company_name', e.target.value)}
                                    placeholder="Ex: A Minha Empresa, Lda"
                                    className="mt-1.5 bg-slate-50/50"
                                    required
                                    autoFocus
                                />
                                <InputError message={errors.company_name} className="mt-1" />
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <Label htmlFor="nuit" className="text-slate-700">NUIT <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="nuit"
                                        type="text"
                                        value={data.nuit}
                                        onChange={(e) => setData('nuit', e.target.value)}
                                        placeholder="Ex: 400000000"
                                        className="mt-1.5 bg-slate-50/50"
                                        required
                                    />
                                    <InputError message={errors.nuit} className="mt-1" />
                                </div>
                                <div>
                                    <Label htmlFor="default_currency" className="text-slate-700">Moeda Oficial <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="default_currency"
                                        type="text"
                                        value={data.default_currency}
                                        onChange={(e) => setData('default_currency', e.target.value)}
                                        placeholder="Ex: MZN"
                                        maxLength={3}
                                        className="mt-1.5 bg-slate-50/50 uppercase"
                                        required
                                    />
                                    <InputError message={errors.default_currency} className="mt-1" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                <div className="col-span-2 sm:col-span-1">
                                    <Label htmlFor="email" className="text-slate-700">E-mail Comercial <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="geral@empresa.com"
                                        className="mt-1.5 bg-slate-50/50"
                                        required
                                    />
                                    <InputError message={errors.email} className="mt-1" />
                                </div>
                                <div className="col-span-2 sm:col-span-1">
                                    <Label htmlFor="phone" className="text-slate-700">Telefone <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="phone"
                                        type="text"
                                        value={data.phone}
                                        onChange={(e) => setData('phone', e.target.value)}
                                        placeholder="+258 84 000 0000"
                                        className="mt-1.5 bg-slate-50/50"
                                        required
                                    />
                                    <InputError message={errors.phone} className="mt-1" />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="address" className="text-slate-700">Morada Completa <span className="text-red-500">*</span></Label>
                                <Textarea
                                    id="address"
                                    value={data.address}
                                    onChange={(e) => setData('address', e.target.value)}
                                    placeholder="Ex: Av. 25 de Setembro, Edifício X, Maputo"
                                    className="mt-1.5 bg-slate-50/50 resize-none"
                                    rows={3}
                                    required
                                />
                                <InputError message={errors.address} className="mt-1" />
                            </div>
                        </div>

                        <div className="pt-6 mt-6 border-t border-slate-100">
                            <Button
                                type="submit"
                                className="w-full h-12 bg-[#2DB8A0] hover:bg-[#259b86] text-white text-base transition-all shadow-md shadow-[#2DB8A0]/20"
                                disabled={processing}
                            >
                                {processing ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        A processar...
                                    </>
                                ) : (
                                    <>
                                        {isCompletion ? 'Guardar e Entrar no ERP' : 'Criar Empresa e Entrar no ERP'}
                                        <CheckCircle2 className="ml-2 h-5 w-5" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
