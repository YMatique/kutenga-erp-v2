import { Head, Link, router } from '@inertiajs/react';
import {
    Archive,
    CheckCircle2,
    Clock,
    FileClock,
    PackageCheck,
    Plus,
    Warehouse,
} from 'lucide-react';
import KutengaLayout from '@/layouts/kutenga-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Inventário', href: '/inventory' },
    { title: 'Fecho de Stock', href: '/inventory/closings' },
];

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
    draft:     { label: 'Rascunho', variant: 'secondary' },
    completed: { label: 'Concluído', variant: 'default' },
};

export default function InventoryClosingsIndex({ closings, stats, warehouses, filters }: any) {
    const handleFilterChange = (key: string, value: string) => {
        router.get('/inventory/closings', { ...filters, [key]: value === 'all' ? '' : value }, { preserveState: true });
    };

    return (
        <KutengaLayout breadcrumbs={breadcrumbs}>
            <Head title="Fecho de Inventário" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Fecho de Inventário</h1>
                        <p className="text-muted-foreground text-sm mt-1">
                            Consolidação e contagem física do stock para auditoria e reconciliação.
                        </p>
                    </div>
                    <Link href="/inventory/closings/create">
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Novo Fecho
                        </Button>
                    </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                        { label: 'Total de Fechamentos', value: stats.total, icon: FileClock, color: 'text-blue-500' },
                        { label: 'Em Rascunho', value: stats.drafts, icon: Clock, color: 'text-amber-500' },
                        { label: 'Concluídos', value: stats.completed, icon: CheckCircle2, color: 'text-emerald-500' },
                    ].map((stat) => (
                        <div
                            key={stat.label}
                            className="bg-card border border-border rounded-[4px] p-4 flex items-center gap-4 shadow-xs"
                        >
                            <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                                <stat.icon className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                                <p className="text-xs text-muted-foreground">{stat.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="bg-card border border-border rounded-[4px] p-4 shadow-xs flex gap-3 flex-wrap">
                    <Select
                        defaultValue={filters.status || 'all'}
                        onValueChange={(v) => handleFilterChange('status', v)}
                    >
                        <SelectTrigger className="w-44">
                            <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os estados</SelectItem>
                            <SelectItem value="draft">Rascunho</SelectItem>
                            <SelectItem value="completed">Concluído</SelectItem>
                        </SelectContent>
                    </Select>

                    {warehouses.length > 0 && (
                        <Select
                            defaultValue={filters.warehouse_id || 'all'}
                            onValueChange={(v) => handleFilterChange('warehouse_id', v)}
                        >
                            <SelectTrigger className="w-52">
                                <SelectValue placeholder="Armazém" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os armazéns</SelectItem>
                                {warehouses.map((w: any) => (
                                    <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>

                {/* Table */}
                <div className="bg-card border border-border rounded-[4px] shadow-xs overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/40">
                                <TableHead>Data de Referência</TableHead>
                                <TableHead>Armazém</TableHead>
                                <TableHead>Produtos</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Bloqueia Movimentos</TableHead>
                                <TableHead>Criado por</TableHead>
                                <TableHead>Concluído em</TableHead>
                                <TableHead />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {closings.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                                        <Archive className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                        Nenhum fechamento de inventário encontrado.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                closings.data.map((c: any) => {
                                    const status = statusMap[c.status] ?? { label: c.status, variant: 'outline' as const };
                                    return (
                                        <TableRow key={c.id} className="hover:bg-muted/30 transition-colors">
                                            <TableCell className="font-medium">
                                                {new Date(c.reference_date).toLocaleDateString('pt-PT')}
                                            </TableCell>
                                            <TableCell>
                                                <span className="flex items-center gap-1.5 text-sm">
                                                    <Warehouse className="h-3.5 w-3.5 text-muted-foreground" />
                                                    {c.warehouse}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="flex items-center gap-1.5 text-sm">
                                                    <PackageCheck className="h-3.5 w-3.5 text-muted-foreground" />
                                                    {c.items_count} produtos
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={status.variant}>{status.label}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                {c.blocks_movements ? (
                                                    <Badge variant="destructive" className="text-xs">Sim</Badge>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">Não</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">{c.creator}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {c.completed_at
                                                    ? new Date(c.completed_at).toLocaleDateString('pt-PT')
                                                    : '—'}
                                            </TableCell>
                                            <TableCell>
                                                <Link href={`/inventory/closings/${c.id}`}>
                                                    <Button variant="outline" size="sm">Ver</Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>

                    {/* Pagination */}
                    {closings.last_page > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                            <p className="text-sm text-muted-foreground">
                                {closings.from}–{closings.to} de {closings.total} fechamentos
                            </p>
                            <div className="flex gap-2">
                                {closings.prev_page_url && (
                                    <Link href={closings.prev_page_url}>
                                        <Button variant="outline" size="sm">Anterior</Button>
                                    </Link>
                                )}
                                {closings.next_page_url && (
                                    <Link href={closings.next_page_url}>
                                        <Button variant="outline" size="sm">Próximo</Button>
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </KutengaLayout>
    );
}
