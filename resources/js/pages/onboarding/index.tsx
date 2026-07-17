import { useState } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import { Loader2, Building2, CheckCircle2, Store, Briefcase, FileText, BarChart3, ChevronRight, ChevronLeft } from 'lucide-react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export default function Onboarding({ existingCompany }: { existingCompany?: any }) {
    const { auth } = usePage<any>().props;

    const [currentStep, setCurrentStep] = useState(1);

    const { data, setData, post, processing, errors } = useForm({
        company_name: existingCompany?.name || '',
        nuit: existingCompany?.nuit || '',
        email: existingCompany?.email || auth?.user?.email || '',
        phone: existingCompany?.phone || '',
        address: existingCompany?.address || '',
        default_currency: existingCompany?.default_currency || 'MZN',
        invoice_prefix: existingCompany?.invoice_prefix || 'FT',
        default_due_days: existingCompany?.default_due_days || 15,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/onboarding');
    };

    const nextStep = () => {
        // Validate current step before proceeding
        if (currentStep === 1) {
            if (!data.company_name || !data.nuit) return;
        } else if (currentStep === 2) {
            if (!data.email || !data.phone || !data.address) return;
        }
        setCurrentStep((prev) => Math.min(prev + 1, 3));
    };

    const prevStep = () => {
        setCurrentStep((prev) => Math.max(prev - 1, 1));
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
                        <img src="/kutenga-logo.png" alt="Kutenga ERP" className="h-10 object-contain brightness-0 invert" />
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
                
                {/* Mobile Logo */}
                <div className="md:hidden flex justify-center mb-8">
                    <img src="/kutenga-logo.png" alt="Kutenga ERP" className="h-12 object-contain" />
                </div>

                <div className="w-full max-w-[550px] mx-auto">
                    <div className="mb-8">
                        {/* Step Indicators */}
                        <div className="flex items-center justify-between mb-8">
                            {[1, 2, 3].map((step) => (
                                <div key={step} className="flex items-center">
                                    <div className={cn(
                                        "flex h-8 w-8 items-center justify-center rounded-full border-2 font-semibold text-sm transition-colors",
                                        currentStep === step 
                                            ? "border-[#2DB8A0] bg-[#2DB8A0] text-white" 
                                            : currentStep > step 
                                                ? "border-[#2DB8A0] bg-[#2DB8A0]/10 text-[#2DB8A0]" 
                                                : "border-slate-200 text-slate-400 bg-white"
                                    )}>
                                        {currentStep > step ? <CheckCircle2 className="h-4 w-4" /> : step}
                                    </div>
                                    {step < 3 && (
                                        <div className={cn(
                                            "h-1 w-12 sm:w-24 mx-2 rounded-full transition-colors",
                                            currentStep > step ? "bg-[#2DB8A0]/50" : "bg-slate-200"
                                        )} />
                                    )}
                                </div>
                            ))}
                        </div>

                        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                            {currentStep === 1 && "Informações Básicas"}
                            {currentStep === 2 && "Contactos e Morada"}
                            {currentStep === 3 && "Configurações"}
                        </h2>
                        <p className="mt-2 text-slate-500 text-base">
                            {currentStep === 1 && "Precisamos de alguns detalhes da tua empresa."}
                            {currentStep === 2 && "Como podemos contactar a tua empresa?"}
                            {currentStep === 3 && "Define as configurações padrões de faturação."}
                        </p>
                    </div>

                    <form onSubmit={submit} className="space-y-6 bg-white p-8 rounded-2xl border border-slate-200/60 shadow-sm">
                        
                        {/* Step 1: Basic Info */}
                        {currentStep === 1 && (
                            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
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
                            </div>
                        )}

                        {/* Step 2: Contact Info */}
                        {currentStep === 2 && (
                            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
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
                                            autoFocus
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
                        )}

                        {/* Step 3: Optional Settings */}
                        {currentStep === 3 && (
                            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
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
                                        autoFocus
                                    />
                                    <InputError message={errors.default_currency} className="mt-1" />
                                </div>

                                <div className="grid grid-cols-2 gap-5">
                                    <div className="col-span-2 sm:col-span-1">
                                        <Label htmlFor="invoice_prefix" className="text-slate-700">Prefixo de Fatura <span className="text-xs font-normal text-slate-400">(Opcional)</span></Label>
                                        <Input
                                            id="invoice_prefix"
                                            type="text"
                                            value={data.invoice_prefix}
                                            onChange={(e) => setData('invoice_prefix', e.target.value)}
                                            placeholder="Ex: FT"
                                            className="mt-1.5 bg-slate-50/50 uppercase"
                                        />
                                        <InputError message={errors.invoice_prefix} className="mt-1" />
                                    </div>
                                    <div className="col-span-2 sm:col-span-1">
                                        <Label htmlFor="default_due_days" className="text-slate-700">Prazo de Pagamento <span className="text-xs font-normal text-slate-400">(Opcional)</span></Label>
                                        <div className="relative mt-1.5">
                                            <Input
                                                id="default_due_days"
                                                type="number"
                                                min="0"
                                                value={data.default_due_days}
                                                onChange={(e) => setData('default_due_days', parseInt(e.target.value) || 0)}
                                                className="bg-slate-50/50 pr-12"
                                            />
                                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-sm text-slate-500">
                                                dias
                                            </div>
                                        </div>
                                        <InputError message={errors.default_due_days} className="mt-1" />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="pt-6 mt-6 border-t border-slate-100 flex gap-3">
                            {currentStep > 1 && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={prevStep}
                                    className="h-12 w-12 shrink-0 border-slate-200 text-slate-600 hover:bg-slate-50"
                                >
                                    <ChevronLeft className="h-5 w-5" />
                                </Button>
                            )}
                            
                            {currentStep < 3 ? (
                                <Button
                                    type="button"
                                    onClick={nextStep}
                                    className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white text-base transition-all"
                                    disabled={
                                        (currentStep === 1 && (!data.company_name || !data.nuit)) ||
                                        (currentStep === 2 && (!data.email || !data.phone || !data.address))
                                    }
                                >
                                    Continuar
                                    <ChevronRight className="ml-2 h-5 w-5" />
                                </Button>
                            ) : (
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
                                            {isCompletion ? 'Guardar e Entrar no ERP' : 'Criar Empresa e Entrar'}
                                            <CheckCircle2 className="ml-2 h-5 w-5" />
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
