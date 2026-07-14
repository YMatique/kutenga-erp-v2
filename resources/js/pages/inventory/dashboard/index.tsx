import { Head, Link, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowDownRight,
    ArrowUpRight,
    Download,
    Package,
    PackageSearch,
    Plus,
    RefreshCw,
    Warehouse,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { KpiCard, OutlineButton, PageHeader, PrimaryButton, StockBadge, TableCard } from '@/components/ui/brand';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';

const movementLabels: Record<string, { label: string; color: string }> = {
    opening: { label: 'Stock Inicial', color: 'bg-slate-100 text-slate-600' },
    in: { label: 'Entrada', color: 'bg-[#2DB8A0]/10 text-[#2DB8A0]' },
    out: { label: 'Saída', color: 'bg-red-50 text-red-600' },
    adjustment: { label: 'Ajuste', color: 'bg-[#E8A020]/10 text-[#E8A020]' },
};

export default function InventoryDashboard() {
    const { stats, lowStockProducts, outOfStockProducts, warehouseSummary, recentMovements } =
        usePage<any>().props;

    const attentionProducts = [
        ...outOfStockProducts.map((p: any) => ({ ...p, alertStatus: 'out_of_stock' as const })),
        ...lowStockProducts.map((p: any) => ({ ...p, alertStatus: 'low' as const })),
    ];

    const formatCurrency = (val: number | string) =>
        new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(Number(val));

    return (
        <>
            <Head title="Inventário — Dashboard" />

            <div className="space-y-4">
                {/* Page Header */}
                <PageHeader
                    title="Gestão de Inventário"
                    subtitle="Visão geral e controle de estoque"
                    actions={
                        <>
                            <OutlineButton>
                                <Download className="h-3.5 w-3.5" />
                                Exportar Relatório
                            </OutlineButton>
                            <Link href="/products/create">
                                <PrimaryButton>
                                    <Plus className="h-3.5 w-3.5" />
                                    Novo Produto
                                </PrimaryButton>
                            </Link>
                        </>
                    }
                />

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    <KpiCard
                        label="Produtos Ativos"
                        value={stats.products}
                        icon={<Package className="h-4 w-4" />}
                        accent="teal"
                        description="no catálogo"
                    />
                    <KpiCard
                        label="Armazéns"
                        value={stats.warehouses}
                        icon={<Warehouse className="h-4 w-4" />}
                        accent="slate"
                        description="operacionais"
                    />
                    <KpiCard
                        label="Valor do Inventário"
                        value={formatCurrency(stats.inventory_value)}
                        icon={<ArrowUpRight className="h-4 w-4" />}
                        accent="gold"
                        description="valor total em stock"
                    />
                    <KpiCard
                        label="Alertas de Stock"
                        value={Number(stats.low_stock) + Number(stats.out_of_stock)}
                        icon={<AlertTriangle className="h-4 w-4" />}
                        accent={Number(stats.low_stock) + Number(stats.out_of_stock) > 0 ? 'orange' : 'teal'}
                        description={`${stats.low_stock} baixo · ${stats.out_of_stock} esgotado`}
                    />
                </div>

                {/* Attention Products + Warehouse Summary */}
                <div className="grid xl:grid-cols-5 gap-4">

                    {/* Produtos que requerem atenção */}
                    <div className="xl:col-span-3">
                        <TableCard>
                            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                                <div>
                                    <h2 className="text-sm font-semibold text-slate-900">Produtos que Requerem Atenção</h2>
                                    <p className="text-xs text-slate-500 mt-0.5">Stock baixo ou esgotado</p>
                                </div>
                                <Link
                                    href="/inventory/stocks"
                                    className="text-xs text-[#2DB8A0] font-medium hover:underline"
                                >
                                    Ver todos
                                </Link>
                            </div>

                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-slate-100">
                                        <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 h-9">PRODUTO</TableHead>
                                        <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 h-9">CATEGORIA</TableHead>
                                        <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 h-9">ESTADO</TableHead>
                                        <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 h-9 text-right">ACÇÕES</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {attentionProducts.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-32 text-center">
                                                <div className="flex flex-col items-center gap-2 text-slate-400">
                                                    <PackageSearch className="h-7 w-7" />
                                                    <span className="text-sm">Nenhum produto requer atenção.</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        attentionProducts.map((product: any) => (
                                            <TableRow
                                                key={`${product.alertStatus}-${product.id}`}
                                                className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                                            >
                                                <TableCell className="py-3 font-medium text-slate-900 text-sm">
                                                    {product.name}
                                                </TableCell>
                                                <TableCell className="py-3 text-slate-500 text-sm">
                                                    {product.category?.name ?? '—'}
                                                </TableCell>
                                                <TableCell className="py-3">
                                                    <StockBadge status={product.alertStatus === 'out_of_stock' ? 'out_of_stock' : 'low'} />
                                                </TableCell>
                                                <TableCell className="py-3 text-right">
                                                    <Link
                                                        href={`/products/${product.id}`}
                                                        className="text-xs text-[#2DB8A0] font-medium hover:underline"
                                                    >
                                                        Ver
                                                    </Link>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableCard>
                    </div>

                    {/* Stock por Armazém */}
                    <div className="xl:col-span-2 space-y-4">
                        <TableCard className="overflow-visible">
                            <div className="px-5 py-4 border-b border-border">
                                <h2 className="text-sm font-semibold text-foreground">Stock por Armazém</h2>
                                <p className="text-xs text-slate-500 mt-0.5">Quantidade por unidade logística</p>
                            </div>
                            <div className="p-4 space-y-2">
                                {warehouseSummary.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-4">Nenhum armazém.</p>
                                ) : (
                                    warehouseSummary.map((warehouse: any) => (
                                        <div
                                            key={warehouse.id}
                                            className="flex items-center justify-between rounded-[4px] border border-border bg-muted/30 px-4 py-3 hover:border-[#2DB8A0]/40 transition-all"
                                        >
                                            <div className="min-w-0">
                                                <Link
                                                    href={`/inventory/warehouses/${warehouse.id}`}
                                                    className="text-sm font-semibold text-foreground hover:text-[#2DB8A0] transition-colors truncate block"
                                                >
                                                    {warehouse.name}
                                                </Link>
                                                <div className="text-xs text-muted-foreground mt-0.5">
                                                    {warehouse.products} produto{warehouse.products !== 1 ? 's' : ''}
                                                </div>
                                            </div>
                                            <div className="text-right flex-shrink-0 ml-4">
                                                <div className="text-sm font-bold text-foreground">
                                                    {Number(warehouse.quantity).toLocaleString()}
                                                </div>
                                                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">
                                                    unidades
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </TableCard>
                    </div>
                </div>

                {/* Movimentos Recentes */}
                <TableCard>
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                        <div>
                            <h2 className="text-sm font-semibold text-slate-900">Movimentos Recentes</h2>
                            <p className="text-xs text-slate-500 mt-0.5">Últimas entradas e saídas de stock</p>
                        </div>
                        <Link
                            href="/inventory/movements"
                            className="text-xs text-[#2DB8A0] font-medium hover:underline"
                        >
                            Ver todos
                        </Link>
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-slate-100">
                                <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 h-9">PRODUTO</TableHead>
                                <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 h-9">ARMAZÉM</TableHead>
                                <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 h-9">TIPO</TableHead>
                                <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 h-9 text-right">QUANTIDADE</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recentMovements.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-slate-400 text-sm">
                                        Nenhum movimento registado.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                recentMovements.map((movement: any) => {
                                    const typeInfo = movementLabels[movement.type] ?? { label: movement.type, color: 'bg-slate-100 text-slate-600' };

                                    return (
                                        <TableRow
                                            key={movement.id}
                                            className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                                        >
                                            <TableCell className="py-3 font-medium text-slate-900 text-sm">
                                                {movement.product?.name ?? '—'}
                                            </TableCell>
                                            <TableCell className="py-3 text-slate-500 text-sm hover:text-[#2DB8A0] transition-colors">
                                                {movement.warehouse ? (
                                                    <Link href={`/inventory/warehouses/${movement.warehouse.id}`}>
                                                        {movement.warehouse.name}
                                                    </Link>
                                                ) : '—'}
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <span className={`inline-flex items-center text-[11px] font-medium px-2 py-1 rounded-[4px] ${typeInfo.color}`}>
                                                    {typeInfo.label}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-3 text-right">
                                                <span className={`text-sm font-bold ${movement.type === 'out' ? 'text-red-600' : movement.type === 'in' ? 'text-[#2DB8A0]' : 'text-slate-700'}`}>
                                                    {movement.type === 'out' ? '−' : movement.type === 'in' ? '+' : ''}
                                                    {Number(movement.quantity).toLocaleString()}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableCard>
            </div>
        </>
    );
}

InventoryDashboard.layout = (page: any) => (
    <AppLayout breadcrumbs={[
        { title: 'Inventário', href: '#' },
        { title: 'Dashboard', href: '/inventory' },
    ]}>
        {page}
    </AppLayout>
);