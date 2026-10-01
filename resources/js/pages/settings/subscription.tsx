import { Head, useForm, usePage } from '@inertiajs/react';
import { CreditCard, Check, Sparkles, Building, CheckCircle2, ShieldAlert } from 'lucide-react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function SubscriptionSettings() {
    const { subscription, auth, plans = [], limitLabels = {}, featureLabels = {} } = usePage<any>().props;
    const isSuperAdmin = !!auth?.user?.is_super_admin;
    const { transform, post, processing } = useForm({
        plan: '',
    });

    if (!subscription) {
        return (
            <div className="flex items-center justify-center p-8">
                <p className="text-slate-500">Nenhuma informação de subscrição disponível.</p>
            </div>
        );
    }

    const currentPlan = subscription.plan;
    const isExpired = ['expired', 'suspended'].includes(subscription.state);
    const endsAt = subscription.ends_at;

    const handlePlanChange = (planName: string) => {
        transform(() => ({ plan: planName }));
        post('/settings/subscription/upgrade', { preserveScroll: true });
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
                                        Plano {plans.find((p: any) => p.code === currentPlan)?.name ?? currentPlan}
                                    </h3>
                                    <Badge className={
                                        isExpired 
                                            ? 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400' 
                                            : 'bg-emerald-100 text-[#2DB8A0] border-[#2DB8A0]/20 dark:bg-emerald-900/30 dark:text-emerald-400'
                                    }>
                                        {subscription.state === 'grace' ? 'Em tolerância' : subscription.state === 'suspended' ? 'Suspensa' : isExpired ? 'Expirada' : 'Ativa'}
                                    </Badge>
                                </div>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                    {subscription.state === 'grace'
                                        ? `Prazo terminado: só consulta até ${formatDate(subscription.grace_ends_at)}. Renove o plano para voltar a criar documentos.`
                                        : subscription.state === 'suspended'
                                        ? 'A subscrição foi suspensa. Contacte o suporte para regularizar.'
                                        : isExpired
                                        ? 'A subscrição expirou e as permissões de edição foram suspensas.'
                                        : endsAt 
                                            ? `Válido até ${formatDate(endsAt)}.` 
                                            : 'Plano gratuito permanente.'
                                    }
                                </p>
                            </div>
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
                        {Object.entries(limitLabels).map(([key, label]) => (
                            <div key={key}>
                                {renderProgressBar(label as string, subscription.usage[key] ?? 0, subscription.limits[key] ?? 0)}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Plan Options Matrix */}
                <div className="space-y-4 pt-4">
                    <div className="text-center max-w-xl mx-auto mb-8">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Atualize ou Altere o seu Plano</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {isSuperAdmin
                                ? 'Como administrador da plataforma, pode alterar o plano desta empresa.'
                                : 'Para alterar o plano, contacte o suporte da Kutenga.'}
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {plans.map((plan: any) => {
                            const isCurrent = currentPlan === plan.code;

                            return (
                                <Card
                                    key={plan.code}
                                    className={`p-6 bg-white dark:bg-slate-900 flex flex-col justify-between border ${
                                        isCurrent ? 'border-[#2DB8A0] ring-1 ring-[#2DB8A0]' : 'border-slate-200 dark:border-slate-800'
                                    }`}
                                >
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-bold text-slate-800 dark:text-slate-100 text-lg">{plan.name}</h4>
                                                <p className="text-slate-400 text-xs mt-0.5">{plan.description}</p>
                                            </div>
                                            {isCurrent && (
                                                <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">Ativo</Badge>
                                            )}
                                        </div>
                                        <div className="my-5">
                                            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{plan.price_label}</span>
                                        </div>
                                        <ul className="space-y-3 text-slate-600 dark:text-slate-400 text-xs border-t border-slate-100 dark:border-slate-800 pt-4">
                                            {Object.entries(limitLabels).map(([key, label]) => {
                                                const value = plan.limits?.[key];

                                                return (
                                                    <li key={key} className="flex items-center gap-2">
                                                        <Check className="w-3.5 h-3.5 text-[#2DB8A0] flex-shrink-0" />
                                                        <span>
                                                            {label as string}: <strong>{value === null || value === undefined ? 'Ilimitado' : value}</strong>
                                                        </span>
                                                    </li>
                                                );
                                            })}
                                            {Object.entries(featureLabels).map(([key, label]) => {
                                                const on = !!plan.features?.[key];

                                                return (
                                                    <li key={key} className={`flex items-center gap-2 ${on ? '' : 'opacity-50'}`}>
                                                        {on ? (
                                                            <Check className="w-3.5 h-3.5 text-[#2DB8A0] flex-shrink-0" />
                                                        ) : (
                                                            <span className="w-3.5 text-center font-bold text-rose-500 flex-shrink-0">×</span>
                                                        )}
                                                        <span>{label as string}{on ? '' : ' indisponível'}</span>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                    <div className="mt-6">
                                        <Button
                                            onClick={() => handlePlanChange(plan.code)}
                                            disabled={processing || !isSuperAdmin || isCurrent}
                                            variant={isCurrent ? 'outline' : 'default'}
                                            className="w-full text-xs font-semibold h-9 rounded bg-[#2db8a0] hover:bg-[#229B86]"
                                        >
                                            {isCurrent ? 'Plano Atual' : `Mudar para ${plan.name}`}
                                        </Button>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </div>
        </>
    );
}
