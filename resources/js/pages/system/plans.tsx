import { Head, useForm, usePage } from '@inertiajs/react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/brand';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import KutengaLayout from '@/layouts/kutenga-layout';

interface Plan {
    id: number;
    code: string;
    name: string;
    description: string | null;
    price_label: string | null;
    is_active: boolean;
    limits: Record<string, number | null>;
    features: Record<string, boolean>;
}

interface Props {
    plans: Plan[];
    limitLabels: Record<string, string>;
    featureLabels: Record<string, string>;
    [key: string]: unknown;
}

function PlanCard({ plan, limitLabels, featureLabels }: { plan: Plan } & Pick<Props, 'limitLabels' | 'featureLabels'>) {
    const { data, setData, put, processing, errors } = useForm({
        name: plan.name,
        description: plan.description ?? '',
        price_label: plan.price_label ?? '',
        is_active: plan.is_active,
        limits: Object.fromEntries(
            Object.keys(limitLabels).map((k) => [k, plan.limits[k] === null || plan.limits[k] === undefined ? '' : String(plan.limits[k])]),
        ) as Record<string, string>,
        features: { ...plan.features } as Record<string, boolean>,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/system/plans/${plan.id}`, { preserveScroll: true, onSuccess: () => toast.success('Plano atualizado.') });
    };

    return (
        <Card className="p-5">
            <form onSubmit={submit} className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900">{plan.name} <span className="text-xs font-mono text-slate-400">({plan.code})</span></h3>
                    <label className="flex items-center gap-2 text-xs text-slate-600">
                        <input type="checkbox" checked={data.is_active} onChange={(e) => setData('is_active', e.target.checked)} />
                        Ativo
                    </label>
                </div>

                <div className="grid gap-3">
                    <div className="grid gap-1">
                        <Label className="text-xs">Nome</Label>
                        <Input value={data.name} onChange={(e) => setData('name', e.target.value)} className="h-9" />
                        {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                    </div>
                    <div className="grid gap-1">
                        <Label className="text-xs">Descrição</Label>
                        <Input value={data.description} onChange={(e) => setData('description', e.target.value)} className="h-9" />
                    </div>
                    <div className="grid gap-1">
                        <Label className="text-xs">Preço (texto mostrado ao cliente)</Label>
                        <Input value={data.price_label} onChange={(e) => setData('price_label', e.target.value)} className="h-9" />
                    </div>
                </div>

                <div className="border-t border-slate-100 pt-3 grid gap-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Limites (vazio = ilimitado)</p>
                    {Object.entries(limitLabels).map(([key, label]) => (
                        <div key={key} className="grid grid-cols-2 items-center gap-3">
                            <Label className="text-xs text-slate-600">{label}</Label>
                            <Input
                                type="number"
                                min={0}
                                value={data.limits[key]}
                                placeholder="Ilimitado"
                                onChange={(e) => setData('limits', { ...data.limits, [key]: e.target.value })}
                                className="h-9"
                            />
                        </div>
                    ))}
                </div>

                <div className="border-t border-slate-100 pt-3 grid gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Funcionalidades</p>
                    {Object.entries(featureLabels).map(([key, label]) => (
                        <label key={key} className="flex items-center gap-2 text-sm text-slate-700">
                            <input
                                type="checkbox"
                                checked={!!data.features[key]}
                                onChange={(e) => setData('features', { ...data.features, [key]: e.target.checked })}
                            />
                            {label}
                        </label>
                    ))}
                </div>

                <Button type="submit" disabled={processing} className="w-full bg-[#E8A020] hover:bg-[#d49218] rounded-[4px]">
                    {processing ? 'A guardar...' : 'Guardar plano'}
                </Button>
            </form>
        </Card>
    );
}

export default function SystemPlans() {
    const { plans, limitLabels, featureLabels } = usePage<Props>().props;

    return (
        <>
            <Head title="Planos e Limites" />

            <div className="space-y-4">
                <PageHeader
                    title="Planos e Limites"
                    subtitle="Catálogo de planos. Uma alteração aplica-se de imediato a todas as empresas que usam o plano."
                />

                <div className="grid gap-6 md:grid-cols-3">
                    {plans.map((plan) => (
                        <PlanCard key={plan.id} plan={plan} limitLabels={limitLabels} featureLabels={featureLabels} />
                    ))}
                </div>
            </div>
        </>
    );
}

SystemPlans.layout = (page: React.ReactNode) => (
    <KutengaLayout breadcrumbs={[{ title: 'Sistema', href: '#' }, { title: 'Planos', href: '/system/plans' }]}>
        {page}
    </KutengaLayout>
);
