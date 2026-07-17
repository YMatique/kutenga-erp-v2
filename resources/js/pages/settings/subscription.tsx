import { Head, useForm, usePage } from '@inertiajs/react';
import { CreditCard, Check, AlertTriangle, Play, Sparkles, Building, CheckCircle2, ShieldAlert } from 'lucide-react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export default function SubscriptionSettings() {
    const { subscription } = usePage<any>().props;
    const { post, processing } = useForm({
        plan: '',
        simulate_expiration: false,
    });

    if (!subscription) {
        return (
            <div className="flex items-center justify-center p-8">
                <p className="text-slate-500">Nenhuma informação de subscrição disponível.</p>
            </div>
        );
    }

    const currentPlan = subscription.plan;
    const isExpired = subscription.status === 'expired';
    const endsAt = subscription.ends_at;

    const handlePlanChange = (planName: string) => {
        post('/settings/subscription/upgrade', {
            data: { plan: planName, simulate_expiration: false },
            preserveScroll: true,
        });
    };

    const handleSimulateExpiration = () => {
        post('/settings/subscription/upgrade', {
            data: { plan: currentPlan, simulate_expiration: true },
            preserveScroll: true,
        });
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('pt-MZ', { day: '2-digit', month: 'long', year: 'numeric' });
    };

    const renderProgressBar = (title: string, current: number, max: number | null) => {
        const isUnlimited = max === null;
        const percentage = isUnlimited ? 100 : Math.min((current / max) * 100, 100);
        const limitLabel = isUnlimited ? 'Ilimitado' : `${current} de ${max}`;
        const isNearLimit = !isUnlimited && current >= max * 0.9;

        return (
            <div className="space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{title}</span>
                    <span className={`font-semibold ${isNearLimit ? 'text-rose-500' : 'text-slate-900 dark:text-slate-100'}`}>
                        {limitLabel}
                    </span>
                </div>
                <div className="relative w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                            isUnlimited ? 'bg-gradient-to-r from-emerald-400 to-[#2DB8A0]' :
                            isNearLimit ? 'bg-rose-500 animate-pulse' : 'bg-[#2DB8A0]'
                        }`}
                        style={{ width: `${percentage}%` }}
                    />
                </div>
            </div>
        );
    };

    return (
        <>
            <Head title="Gerenciamento de Subscrição" />

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Subscrição e Limites"
                    description="Gerencie o plano de subscrição da sua empresa e acompanhe o consumo de recursos."
                />

                {/* Status Card */}
                <Card className={`overflow-hidden border p-6 ${
                    isExpired 
                        ? 'border-rose-200 bg-rose-50/50 dark:border-rose-950/30 dark:bg-rose-950/10' 
                        : 'border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/20'
                }`}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-lg ${
                                isExpired 
                                    ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' 
                                    : 'bg-emerald-100 text-[#2DB8A0] dark:bg-emerald-950/30 dark:text-emerald-400'
                            }`}>
                                {isExpired ? <ShieldAlert className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
                                        Plano {currentPlan === 'inicial' ? 'Inicial (Grátis)' : currentPlan === 'crescimento' ? 'Crescimento' : 'Empresarial'}
                                    </h3>
                                    <Badge className={
                                        isExpired 
                                            ? 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400' 
                                            : 'bg-emerald-100 text-[#2DB8A0] border-[#2DB8A0]/20 dark:bg-emerald-900/30 dark:text-emerald-400'
                                    }>
                                        {isExpired ? 'Expirada' : 'Ativa'}
                                    </Badge>
                                </div>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                    {isExpired 
                                        ? 'A subscrição expirou e as permissões de edição foram suspensas.' 
                                        : endsAt 
                                            ? `Válido até ${formatDate(endsAt)}.` 
                                            : 'Plano gratuito permanente.'
                                    }
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <Button 
                                type="button" 
                                variant="outline" 
                                size="sm"
                                onClick={handleSimulateExpiration}
                                disabled={processing}
                                className="border-rose-200 hover:bg-rose-50 text-rose-600 dark:border-rose-950/30 dark:hover:bg-rose-950/10 dark:text-rose-400 font-medium"
                            >
                                <AlertTriangle className="mr-1.5 h-4 w-4" />
                                Simular Expiração
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Resource Limits Section */}
                <div className="bg-white dark:bg-slate-900/10 border border-slate-200 dark:border-slate-800 rounded-lg p-6 space-y-6">
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <Building className="h-4 w-4 text-slate-400" />
                        Consumo de Recursos (Mês Atual)
                    </h3>
                    <div className="grid md:grid-cols-3 gap-6">
                        {renderProgressBar('Faturas / Documentos', subscription.usage.documents_month, subscription.limits.documents_month)}
                        {renderProgressBar('Artigos / Serviços', subscription.usage.products, subscription.limits.products)}
                        {renderProgressBar('Armazéns / Lojas', subscription.usage.warehouses, subscription.limits.warehouses)}
                    </div>
                </div>

                {/* Plan Options Matrix */}
                <div className="space-y-4 pt-4">
                    <div className="text-center max-w-xl mx-auto mb-8">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Atualize ou Altere o seu Plano</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Selecione o plano ideal para a sua empresa abaixo para simular instantaneamente a transição.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Plan 1: Inicial */}
                        <Card className={`p-6 bg-white dark:bg-slate-900 flex flex-col justify-between border ${
                            currentPlan === 'inicial' 
                                ? 'border-[#2DB8A0] ring-1 ring-[#2DB8A0]' 
                                : 'border-slate-200 dark:border-slate-800'
                        }`}>
                            <div>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Inicial</h4>
                                        <p className="text-slate-400 text-xs mt-0.5">Para novos negócios</p>
                                    </div>
                                    {currentPlan === 'inicial' && (
                                        <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">Ativo</Badge>
                                    )}
                                </div>
                                <div className="my-5">
                                    <span className="text-2xl font-extrabold text-slate-900 dark:text-white">Grátis</span>
                                    <span className="text-slate-400 text-xs"> / sempre</span>
                                </div>
                                <ul className="space-y-3 text-slate-600 dark:text-slate-400 text-xs border-t border-slate-100 dark:border-slate-800 pt-4">
                                    <li className="flex items-center gap-2">
                                        <Check className="w-3.5 h-3.5 text-[#2DB8A0] flex-shrink-0" />
                                        <span>Até 50 faturas eletrónicas / mês</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-3.5 h-3.5 text-[#2DB8A0] flex-shrink-0" />
                                        <span>Catálogo com 100 artigos</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-3.5 h-3.5 text-[#2DB8A0] flex-shrink-0" />
                                        <span>1 Armazém / Loja</span>
                                    </li>
                                    <li className="flex items-center gap-2 opacity-50">
                                        <span className="w-3.5 text-center font-bold text-rose-500 flex-shrink-0">×</span>
                                        <span>POS (Ponto de Venda) indisponível</span>
                                    </li>
                                </ul>
                            </div>
                            <div className="mt-6">
                                <Button 
                                    onClick={() => handlePlanChange('inicial')}
                                    disabled={processing || currentPlan === 'inicial'}
                                    variant={currentPlan === 'inicial' ? 'outline' : 'default'}
                                    className="w-full text-xs font-semibold h-9 rounded bg-[#2db8a0] hover:bg-[#229B86]"
                                >
                                    {currentPlan === 'inicial' ? 'Plano Atual' : 'Mudar para Inicial'}
                                </Button>
                            </div>
                        </Card>

                        {/* Plan 2: Crescimento */}
                        <Card className={`p-6 bg-white dark:bg-slate-900 relative flex flex-col justify-between border ${
                            currentPlan === 'crescimento' 
                                ? 'border-[#2DB8A0] ring-1 ring-[#2DB8A0]' 
                                : 'border-[#2DB8A0]/40'
                        }`}>
                            <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-[#2DB8A0] text-white text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider">
                                Popular
                            </div>
                            <div>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Crescimento</h4>
                                        <p className="text-slate-400 text-xs mt-0.5">Para PMEs em crescimento</p>
                                    </div>
                                    {currentPlan === 'crescimento' && (
                                        <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">Ativo</Badge>
                                    )}
                                </div>
                                <div className="my-5">
                                    <span className="text-2xl font-extrabold text-slate-900 dark:text-white">3,500 MZN</span>
                                    <span className="text-slate-400 text-xs"> / mês</span>
                                </div>
                                <ul className="space-y-3 text-slate-600 dark:text-slate-400 text-xs border-t border-slate-100 dark:border-slate-800 pt-4">
                                    <li className="flex items-center gap-2 font-semibold">
                                        <Check className="w-3.5 h-3.5 text-[#2DB8A0] flex-shrink-0" />
                                        <span>Faturação eletrónica ILIMITADA</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-3.5 h-3.5 text-[#2DB8A0] flex-shrink-0" />
                                        <span>Artigos e categorias ilimitadas</span>
                                    </li>
                                    <li className="flex items-center gap-2 font-semibold">
                                        <Check className="w-3.5 h-3.5 text-[#2DB8A0] flex-shrink-0" />
                                        <span>Stock Multi-Armazém (até 5)</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-3.5 h-3.5 text-[#2DB8A0] flex-shrink-0" />
                                        <span>Ponto de Venda (POS) incluído</span>
                                    </li>
                                    <li className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                        <Check className="w-3.5 h-3.5 text-[#2DB8A0] flex-shrink-0" />
                                        <span>Suporte priorizado 24/7</span>
                                    </li>
                                </ul>
                            </div>
                            <div className="mt-6">
                                <Button 
                                    onClick={() => handlePlanChange('crescimento')}
                                    disabled={processing || currentPlan === 'crescimento'}
                                    variant={currentPlan === 'crescimento' ? 'outline' : 'default'}
                                    className="w-full text-xs font-semibold h-9 rounded bg-[#2db8a0] hover:bg-[#229B86]"
                                >
                                    {currentPlan === 'crescimento' ? 'Plano Atual' : 'Mudar para Crescimento'}
                                </Button>
                            </div>
                        </Card>

                        {/* Plan 3: Empresarial */}
                        <Card className={`p-6 bg-white dark:bg-slate-900 flex flex-col justify-between border ${
                            currentPlan === 'empresarial' 
                                ? 'border-[#2DB8A0] ring-1 ring-[#2DB8A0]' 
                                : 'border-slate-200 dark:border-slate-800'
                        }`}>
                            <div>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Empresarial</h4>
                                        <p className="text-slate-400 text-xs mt-0.5">Para grandes empresas</p>
                                    </div>
                                    {currentPlan === 'empresarial' && (
                                        <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">Ativo</Badge>
                                    )}
                                </div>
                                <div className="my-5">
                                    <span className="text-2xl font-extrabold text-slate-900 dark:text-white">Sob Consulta</span>
                                </div>
                                <ul className="space-y-3 text-slate-600 dark:text-slate-400 text-xs border-t border-slate-100 dark:border-slate-800 pt-4">
                                    <li className="flex items-center gap-2">
                                        <Check className="w-3.5 h-3.5 text-[#2DB8A0] flex-shrink-0" />
                                        <span>Tudo do Plano Crescimento</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-3.5 h-3.5 text-[#2DB8A0] flex-shrink-0" />
                                        <span>Armazéns e filiais ilimitadas</span>
                                    </li>
                                    <li className="flex items-center gap-2 font-semibold">
                                        <Check className="w-3.5 h-3.5 text-[#2DB8A0] flex-shrink-0" />
                                        <span>Acesso a API do Kutenga ERP</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-3.5 h-3.5 text-[#2DB8A0] flex-shrink-0" />
                                        <span>Gestor de conta dedicado</span>
                                    </li>
                                </ul>
                            </div>
                            <div className="mt-6">
                                <Button 
                                    onClick={() => handlePlanChange('empresarial')}
                                    disabled={processing || currentPlan === 'empresarial'}
                                    variant={currentPlan === 'empresarial' ? 'outline' : 'default'}
                                    className="w-full text-xs font-semibold h-9 rounded bg-[#2db8a0] hover:bg-[#229B86]"
                                >
                                    {currentPlan === 'empresarial' ? 'Plano Atual' : 'Mudar para Empresarial'}
                                </Button>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}
