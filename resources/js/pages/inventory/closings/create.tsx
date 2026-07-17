import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Calendar, Info, Loader2, PackageSearch, Warehouse } from 'lucide-react';
import KutengaLayout from '@/layouts/kutenga-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Inventário', href: '/inventory' },
    { title: 'Fecho de Stock', href: '/inventory/closings' },
    { title: 'Novo Fecho', href: '/inventory/closings/create' },
];

export default function InventoryClosingsCreate({ warehouses, stockPreview, today }: any) {
    const { data, setData, post, processing, errors } = useForm({
        reference_date: today,
        warehouse_id: '',
        notes: '',
        blocks_movements: false,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/inventory/closings');
    };

    return (
        <>
            <Head title="Novo Fecho de Inventário" />

            <div className="space-y-6 max-w-5xl">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href="/inventory/closings">
                        <Button variant="outline" size="sm" className="gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Voltar
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Novo Fecho de Inventário</h1>
                        <p className="text-muted-foreground text-sm mt-1">
                            Será gerado automaticamente um snapshot do stock atual.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Form */}
                    <div className="lg:col-span-1">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="bg-card border border-border rounded-[4px] p-5 shadow-xs space-y-4">
                                <h2 className="font-semibold text-foreground text-sm uppercase tracking-wider text-muted-foreground">
                                    Configuração
                                </h2>

                                {/* Reference Date */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="reference_date" className="flex items-center gap-2">
                                        <Calendar className="h-3.5 w-3.5" />
                                        Data de Referência
                                    </Label>
                                    <Input
                                        id="reference_date"
                                        type="date"
                                        value={data.reference_date}
                                        max={today}
                                        onChange={(e) => setData('reference_date', e.target.value)}
                                    />
                                    {errors.reference_date && (
                                        <p className="text-xs text-destructive">{errors.reference_date}</p>
                                    )}
                                </div>

                                {/* Warehouse */}
                                <div className="space-y-1.5">
                                    <Label className="flex items-center gap-2">
                                        <Warehouse className="h-3.5 w-3.5" />
                                        Armazém (opcional)
                                    </Label>
                                    <Select
                                        value={data.warehouse_id}
                                        onValueChange={(v) => setData('warehouse_id', v === 'all' ? '' : v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Todos os armazéns" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos os armazéns</SelectItem>
                                            {warehouses.map((w: any) => (
                                                <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Blocks Movements */}
                                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                                    <div className="space-y-0.5">
                                        <Label className="text-sm font-medium cursor-pointer" htmlFor="blocks_movements">
                                            Bloquear movimentos retroativos
                                        </Label>
                                        <p className="text-xs text-muted-foreground">
                                            Impede movimentos de stock com data anterior a este fecho.
                                        </p>
                                    </div>
                                    <Switch
                                        id="blocks_movements"
                                        checked={data.blocks_movements}
                                        onCheckedChange={(v) => setData('blocks_movements', v)}
                                    />
                                </div>

                                {/* Notes */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="notes">Notas (opcional)</Label>
                                    <Textarea
                                        id="notes"
                                        rows={3}
                                        placeholder="Observações sobre este fecho..."
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Info */}
                            <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-[4px] p-3 text-sm text-blue-700 dark:text-blue-300">
                                <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                <p>
                                    O sistema irá capturar automaticamente as quantidades atuais de cada produto como
                                    referência. Poderá depois inserir as quantidades contadas manualmente.
                                </p>
                            </div>

                            <Button type="submit" disabled={processing} className="w-full gap-2">
                                {processing && <Loader2 className="h-4 w-4 animate-spin" />}
                                Iniciar Fecho de Inventário
                            </Button>
                        </form>
                    </div>

                    {/* Stock Preview */}
                    <div className="lg:col-span-2">
                        <div className="bg-card border border-border rounded-[4px] shadow-xs overflow-hidden">
                            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                                <PackageSearch className="h-4 w-4 text-muted-foreground" />
                                <h2 className="font-medium text-foreground text-sm">
                                    Pré-visualização do Stock Atual
                                </h2>
                                <span className="ml-auto text-xs text-muted-foreground">
                                    {stockPreview.length} produtos
                                </span>
                            </div>
                            <div className="overflow-auto max-h-[500px]">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/40">
                                            <TableHead>Produto</TableHead>
                                            <TableHead>SKU</TableHead>
                                            <TableHead>Armazém</TableHead>
                                            <TableHead className="text-right">Qtd. Actual</TableHead>
                                            <TableHead className="text-right">Unidade</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {stockPreview.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-sm">
                                                    Nenhum produto em stock encontrado.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            stockPreview.map((item: any, i: number) => (
                                                <TableRow key={i} className="hover:bg-muted/20">
                                                    <TableCell className="font-medium text-sm">{item.product_name}</TableCell>
                                                    <TableCell className="text-muted-foreground text-xs">{item.product_sku}</TableCell>
                                                    <TableCell className="text-sm">{item.warehouse_name}</TableCell>
                                                    <TableCell className="text-right font-mono text-sm">
                                                        {Number(item.quantity_current).toFixed(2)}
                                                    </TableCell>
                                                    <TableCell className="text-right text-muted-foreground text-xs">{item.unit}</TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

InventoryClosingsCreate.layout = (page: any) => (
    <KutengaLayout breadcrumbs={breadcrumbs}>
        {page}
    </KutengaLayout>
);
