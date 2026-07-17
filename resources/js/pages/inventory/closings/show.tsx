import { Head, Link, useForm, router } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    ClipboardCheck,
    Loader2,
    Lock,
    Minus,
    PackageCheck,
} from 'lucide-react';
import { useState } from 'react';
import KutengaLayout from '@/layouts/kutenga-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Inventário', href: '/inventory' },
    { title: 'Fecho de Stock', href: '/inventory/closings' },
    { title: 'Detalhe', href: '#' },
];

type Item = {
    id: number;
    product_name: string;
    product_sku: string;
    unit: string;
    warehouse_name: string;
    quantity_expected: number;
    quantity_counted: number | null;
    variance: number;
    variance_class: 'positive' | 'negative' | 'zero';
};

export default function InventoryClosingsShow({ closing, items, summary }: any) {
    const [counts, setCounts] = useState<Record<number, string>>(() => {
        const map: Record<number, string> = {};
        items.forEach((item: Item) => {
            if (item.quantity_counted !== null) {
                map[item.id] = String(item.quantity_counted);
            }
        });
        return map;
    });

    const [saving, setSaving] = useState(false);

    const handleSave = () => {
        setSaving(true);
        const payload = items.map((item: Item) => ({
            id: item.id,
            quantity_counted: counts[item.id] !== undefined ? parseFloat(counts[item.id]) : null,
        }));
        router.post(`/inventory/closings/${closing.id}/items`, { items: payload }, {
            onFinish: () => setSaving(false),
        });
    };

    const handleComplete = () => {
        if (!confirm('Concluir este fechamento? Esta ação é irreversível e bloqueará a edição.')) return;
        router.post(`/inventory/closings/${closing.id}/complete`);
    };

    const isCompleted = closing.status === 'completed';

    const varianceIcon = (cls: string) => {
        if (cls === 'positive') return <ChevronUp className="h-3.5 w-3.5 text-emerald-500" />;
        if (cls === 'negative') return <ChevronDown className="h-3.5 w-3.5 text-red-500" />;
        return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
    };

    return (
        <>
            <Head title={`Fecho — ${new Date(closing.reference_date).toLocaleDateString('pt-PT')}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link href="/inventory/closings">
                            <Button variant="outline" size="sm" className="gap-2">
                                <ArrowLeft className="h-4 w-4" />
                                Voltar
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">
                                Fecho de Inventário
                            </h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                Referência: {new Date(closing.reference_date).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })}
                                {' · '}{closing.warehouse}
                                {' · '}Criado por {closing.creator}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {closing.blocks_movements && (
                            <Badge variant="destructive" className="gap-1">
                                <Lock className="h-3 w-3" />
                                Bloqueia movimentos
                            </Badge>
                        )}
                        <Badge variant={isCompleted ? 'default' : 'secondary'}>
                            {isCompleted ? 'Concluído' : 'Rascunho'}
                        </Badge>
                    </div>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        { label: 'Total de Produtos', value: summary.total_items, icon: PackageCheck, color: 'text-blue-500' },
                        { label: 'Contados', value: `${summary.items_counted}/${summary.total_items}`, icon: ClipboardCheck, color: 'text-emerald-500' },
                        { label: 'Excessos', value: summary.items_with_excess, icon: ChevronUp, color: 'text-amber-500' },
                        { label: 'Défices', value: summary.items_with_deficit, icon: AlertTriangle, color: 'text-red-500' },
                    ].map((s) => (
                        <div key={s.label} className="bg-card border border-border rounded-[4px] p-4 flex items-center gap-3 shadow-xs">
                            <div className={`p-2 rounded-lg bg-muted ${s.color}`}>
                                <s.icon className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-foreground">{s.value}</p>
                                <p className="text-xs text-muted-foreground">{s.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Table */}
                <div className="bg-card border border-border rounded-[4px] shadow-xs overflow-hidden">
                    <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                        <h2 className="font-medium text-sm text-foreground">Contagem por Produto</h2>
                        {!isCompleted && (
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="gap-2"
                                >
                                    {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                    Guardar Contagens
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleComplete}
                                    className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Concluir Fecho
                                </Button>
                            </div>
                        )}
                        {isCompleted && closing.completed_at && (
                            <p className="text-xs text-muted-foreground">
                                Concluído em {new Date(closing.completed_at).toLocaleDateString('pt-PT')}
                            </p>
                        )}
                    </div>
                    <div className="overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/40">
                                    <TableHead>Produto</TableHead>
                                    <TableHead>SKU</TableHead>
                                    <TableHead>Armazém</TableHead>
                                    <TableHead className="text-right">Qtd. Esperada</TableHead>
                                    <TableHead className="text-right">Qtd. Contada</TableHead>
                                    <TableHead className="text-right">Variação</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                            Nenhum produto neste fechamento.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    items.map((item: Item) => {
                                        const counted = counts[item.id];
                                        const variance = counted !== undefined
                                            ? parseFloat(counted || '0') - item.quantity_expected
                                            : item.variance;
                                        const varClass = variance > 0 ? 'positive' : variance < 0 ? 'negative' : 'zero';

                                        return (
                                            <TableRow key={item.id} className="hover:bg-muted/20">
                                                <TableCell className="font-medium text-sm">{item.product_name}</TableCell>
                                                <TableCell className="text-xs text-muted-foreground">{item.product_sku}</TableCell>
                                                <TableCell className="text-sm">{item.warehouse_name}</TableCell>
                                                <TableCell className="text-right font-mono text-sm">
                                                    {item.quantity_expected.toFixed(2)}{' '}
                                                    <span className="text-xs text-muted-foreground">{item.unit}</span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {isCompleted ? (
                                                        <span className="font-mono text-sm">
                                                            {item.quantity_counted !== null ? item.quantity_counted.toFixed(2) : '—'}
                                                        </span>
                                                    ) : (
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            step="0.0001"
                                                            className="w-28 text-right font-mono text-sm h-8 ml-auto"
                                                            value={counts[item.id] ?? ''}
                                                            placeholder="—"
                                                            onChange={(e) =>
                                                                setCounts((prev) => ({ ...prev, [item.id]: e.target.value }))
                                                            }
                                                        />
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <span
                                                        className={cn(
                                                            'inline-flex items-center gap-1 font-mono text-sm',
                                                            varClass === 'positive' && 'text-emerald-600 dark:text-emerald-400',
                                                            varClass === 'negative' && 'text-red-600 dark:text-red-400',
                                                            varClass === 'zero' && 'text-muted-foreground',
                                                        )}
                                                    >
                                                        {varianceIcon(varClass)}
                                                        {counted !== undefined
                                                            ? Math.abs(variance).toFixed(2)
                                                            : item.quantity_counted !== null
                                                                ? Math.abs(item.variance).toFixed(2)
                                                                : '—'}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </>
    );
}

InventoryClosingsShow.layout = (page: any) => (
    <KutengaLayout breadcrumbs={breadcrumbs}>
        {page}
    </KutengaLayout>
);
