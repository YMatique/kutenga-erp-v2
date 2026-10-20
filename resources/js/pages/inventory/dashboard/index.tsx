import { Head, Link, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeftRight,
    ChevronDown,
    ClipboardCheck,
    ClipboardList,
    Download,
    Package,
    PackagePlus,
    PackageSearch,
    Plus,
    Wallet,
    Warehouse,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { KpiCard, OutlineButton, PageHeader, PrimaryButton, StockBadge, TableCard } from '@/components/ui/brand';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { formatQty, movementDelta, movementLabels } from '@/lib/stock-movements';
import ActivityChart from './activity-chart';

const headClass = 'text-[10px] font-semibold uppercase tracking-wider text-muted-foreground h-9';

const formatCurrency = (val: number | string) =>
    new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(Number(val));

export default function InventoryDashboard() {
    const { stats, attentionProducts, warehouseSummary, recentMovements, queue, activity, can } = usePage<any>().props;

    const alerts = Number(stats.low_stock) + Number(stats.out_of_stock);
    const hidden = alerts - attentionProducts.length;

    // O que está à espera de ser tratado; só aparece o que tem alguma coisa
    const workQueue = [
        { count: queue.transfers_pending, label: 'Transferências por aprovar', hint: 'pendentes', href: '/inventory/transfers?status=pending' },
        { count: queue.transfers_approved, label: 'Transferências por concluir', hint: 'com stock reservado', href: '/inventory/transfers?status=approved' },
        { count: queue.adjustments_draft, label: 'Ajustes por concluir', hint: 'em rascunho', href: '/inventory/adjustments?status=draft' },
        { count: queue.closings_open, label: 'Fechos em contagem', hint: 'inventário em curso', href: '/inventory/closings?status=draft' },
    ].filter((item) => Number(item.count) > 0);

    const canAct = can.adjust || can.transfer || can.catalog;

    return (
        <>
            <Head title="Inventário — Dashboard" />

            <div className="space-y-4">
                {/* Page Header */}
                <PageHeader
                    title="Gestão de Inventário"
                    subtitle="Visão geral e controlo de stock"
                    actions={
                        <>
                            <a href="/inventory/export?format=xlsx">
                                <OutlineButton>
                                    <Download className="h-3.5 w-3.5" />
                                    Exportar Relatório
                                </OutlineButton>
                            </a>
                            {canAct && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <PrimaryButton>
                                            <Plus className="h-3.5 w-3.5" />
                                            Ações rápidas
                                            <ChevronDown className="h-3.5 w-3.5" />
                                        </PrimaryButton>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56">
                                        {can.adjust && (
                                            <DropdownMenuItem asChild>
                                                <Link href="/inventory/adjustments/create"><ClipboardList /> Novo ajuste de stock</Link>
                                            </DropdownMenuItem>
                                        )}
                                        {can.transfer && (
                                            <DropdownMenuItem asChild>
                                                <Link href="/inventory/transfers/create"><ArrowLeftRight /> Nova transferência</Link>
                                            </DropdownMenuItem>
                                        )}
                                        {can.adjust && (
                                            <>
                                                <DropdownMenuItem asChild>
                                                    <Link href="/inventory/opening"><PackagePlus /> Definir stock inicial</Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild>
                                                    <Link href="/inventory/closings/create"><ClipboardCheck /> Novo fecho de inventário</Link>
                                                </DropdownMenuItem>
                                            </>
                                        )}
                                        {can.catalog && (
                                            <>
                                                {(can.adjust || can.transfer) && <DropdownMenuSeparator />}
                                                <DropdownMenuItem asChild>
                                                    <Link href="/products/create"><Package /> Novo produto</Link>
                                                </DropdownMenuItem>
                                            </>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </>
                    }
                />

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    <KpiCard
                        label="Produtos com Stock"
                        value={stats.products}
                        icon={<Package className="h-4 w-4" />}
                        accent="teal"
                        description="com controlo de stock"
                    />
                    <KpiCard
                        label="Armazéns"
                        value={stats.warehouses}
                        icon={<Warehouse className="h-4 w-4" />}
                        accent="slate"
                        description="ativos"
                    />
                    <KpiCard
                        label="Valor do Inventário"
                        value={formatCurrency(stats.inventory_value)}
                        icon={<Wallet className="h-4 w-4" />}
                        accent="gold"
                        description="custo × quantidade em stock"
                    />
                    <KpiCard
                        label="Alertas de Stock"
                        value={alerts}
                        icon={<AlertTriangle className="h-4 w-4" />}
                        accent={alerts > 0 ? 'orange' : 'teal'}
                        description={`${stats.low_stock} baixo · ${stats.out_of_stock} esgotado`}
                    />
                </div>

                {/* Trabalho por tratar */}
                {workQueue.length > 0 && (
                    <div>
                        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Por tratar</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                            {workQueue.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="flex items-center gap-4 rounded-[4px] border border-border bg-card px-5 py-3 shadow-xs transition-colors hover:border-[#2DB8A0]/50"
                                >
                                    <span className="text-[26px] font-bold leading-none text-foreground">{item.count}</span>
                                    <span className="min-w-0">
                                        <span className="block text-sm font-medium text-foreground truncate">{item.label}</span>
                                        <span className="block text-xs text-muted-foreground">{item.hint}</span>
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Attention Products + Warehouse Summary */}
                <div className="grid xl:grid-cols-5 gap-4">

                    {/* Produtos que requerem atenção */}
                    <div className="xl:col-span-3">
                        <TableCard>
                            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                                <div>
                                    <h2 className="text-sm font-semibold text-foreground">Produtos que Requerem Atenção</h2>
                                    <p className="text-xs text-muted-foreground mt-0.5">Os mais urgentes: esgotados e abaixo do stock mínimo</p>
                                </div>
                                <Link
                                    href="/inventory/stocks"
                                    className="text-xs text-[#2DB8A0] font-medium hover:underline"
                                >
                                    Ver stock
                                </Link>
                            </div>

                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border">
                                        <TableHead className={headClass}>Produto</TableHead>
                                        <TableHead className={`${headClass} hidden sm:table-cell`}>Categoria</TableHead>
                                        <TableHead className={`${headClass} text-right`}>Stock / Mínimo</TableHead>
                                        <TableHead className={headClass}>Estado</TableHead>
                                        <TableHead className={`${headClass} text-right`}>Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {attentionProducts.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-32 text-center">
                                                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                    <PackageSearch className="h-7 w-7" />
                                                    <span className="text-sm">Tudo em ordem: nenhum produto requer atenção.</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        attentionProducts.map((product: any) => (
                                            <TableRow
                                                key={product.id}
                                                className="border-b border-border hover:bg-muted/50 transition-colors"
                                            >
                                                <TableCell className="py-3 font-medium text-foreground text-sm">
                                                    {product.name}
                                                </TableCell>
                                                <TableCell className="py-3 text-muted-foreground text-sm hidden sm:table-cell">
                                                    {product.category ?? '—'}
                                                </TableCell>
                                                <TableCell className="py-3 text-right font-mono text-sm">
                                                    <span className={product.status === 'out_of_stock' ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-foreground font-semibold'}>
                                                        {formatQty(product.total_stock)}
                                                    </span>
                                                    <span className="text-muted-foreground">
                                                        {' / '}{formatQty(product.min_stock)}{product.unit ? ` ${product.unit}` : ''}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="py-3">
                                                    <StockBadge status={product.status} />
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

                            {alerts > 0 && (
                                <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 border-t border-border bg-muted/30 text-xs text-muted-foreground">
                                    <span>
                                        {hidden > 0 ? `A mostrar ${attentionProducts.length} de ${alerts} produtos em alerta` : `${alerts} produto${alerts !== 1 ? 's' : ''} em alerta`}
                                    </span>
                                    <span className="flex items-center gap-4">
                                        {Number(stats.out_of_stock) > 0 && (
                                            <Link href="/inventory/stocks?status=out_of_stock" className="text-[#2DB8A0] font-medium hover:underline">
                                                Ver esgotados ({stats.out_of_stock})
                                            </Link>
                                        )}
                                        {Number(stats.low_stock) > 0 && (
                                            <Link href="/inventory/stocks?status=low" className="text-[#2DB8A0] font-medium hover:underline">
                                                Ver stock baixo ({stats.low_stock})
                                            </Link>
                                        )}
                                    </span>
                                </div>
                            )}
                        </TableCard>
                    </div>

                    {/* Valor por Armazém */}
                    <div className="xl:col-span-2 space-y-4">
                        <TableCard>
                            <div className="px-5 py-4 border-b border-border">
                                <h2 className="text-sm font-semibold text-foreground">Stock por Armazém</h2>
                                <p className="text-xs text-muted-foreground mt-0.5">Valor em stock e peso de cada armazém</p>
                            </div>
                            <div className="p-4 space-y-2">
                                {warehouseSummary.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-4">Nenhum armazém ativo.</p>
                                ) : (
                                    warehouseSummary.map((warehouse: any) => (
                                        <div
                                            key={warehouse.id}
                                            className="rounded-[4px] border border-border bg-muted/30 px-4 py-3 hover:border-[#2DB8A0]/40 transition-all"
                                        >
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <Link
                                                            href={`/inventory/warehouses/${warehouse.id}`}
                                                            className="text-sm font-semibold text-foreground hover:text-[#2DB8A0] transition-colors truncate"
                                                        >
                                                            {warehouse.name}
                                                        </Link>
                                                        {warehouse.is_default && (
                                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-medium">
                                                                Predefinido
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground mt-0.5">
                                                        {warehouse.products} produto{warehouse.products !== 1 ? 's' : ''} com stock
                                                    </div>
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    <div className="text-sm font-bold text-foreground">
                                                        {formatCurrency(warehouse.value)}
                                                    </div>
                                                    <div className="text-[10px] text-muted-foreground">
                                                        {Number(warehouse.share).toLocaleString('pt-MZ', { maximumFractionDigits: 1 })}% do valor
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-2 h-1 rounded-full bg-border overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-[#2DB8A0]"
                                                    style={{ width: `${Math.min(100, Number(warehouse.share))}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </TableCard>
                    </div>
                </div>

                {/* Atividade dos últimos 30 dias */}
                <ActivityChart days={activity} />

                {/* Movimentos Recentes */}
                <TableCard>
                    <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                        <div>
                            <h2 className="text-sm font-semibold text-foreground">Movimentos Recentes</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">Últimas entradas, saídas e ajustes de stock</p>
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
                            <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border">
                                <TableHead className={headClass}>Produto</TableHead>
                                <TableHead className={`${headClass} hidden sm:table-cell`}>Armazém</TableHead>
                                <TableHead className={`${headClass} hidden sm:table-cell`}>Tipo</TableHead>
                                <TableHead className={`${headClass} text-right`}>Quantidade</TableHead>
                                <TableHead className={`${headClass} text-right`}>Quando</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recentMovements.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground text-sm">
                                        Nenhum movimento registado.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                recentMovements.map((movement: any) => {
                                    const typeInfo = movementLabels[movement.type] ?? { label: movement.type, color: 'bg-muted text-muted-foreground' };
                                    const delta = movementDelta(movement);

                                    return (
                                        <TableRow
                                            key={movement.id}
                                            className="border-b border-border hover:bg-muted/50 transition-colors"
                                        >
                                            <TableCell className="py-3 text-sm">
                                                <p className="font-medium text-foreground">{movement.product?.name ?? '—'}</p>
                                                {movement.notes && (
                                                    <p className="text-xs text-muted-foreground mt-0.5 max-w-[170px] sm:max-w-[320px] truncate" title={movement.notes}>
                                                        {movement.notes}
                                                    </p>
                                                )}
                                            </TableCell>
                                            <TableCell className="py-3 text-muted-foreground text-sm hover:text-[#2DB8A0] transition-colors hidden sm:table-cell">
                                                {movement.warehouse ? (
                                                    <Link href={`/inventory/warehouses/${movement.warehouse.id}`}>
                                                        {movement.warehouse.name}
                                                    </Link>
                                                ) : '—'}
                                            </TableCell>
                                            <TableCell className="py-3 hidden sm:table-cell">
                                                <span className={`inline-flex items-center text-[11px] font-medium px-2 py-1 rounded-[4px] ${typeInfo.color}`}>
                                                    {typeInfo.label}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-3 text-right">
                                                <span className={`text-sm font-bold ${delta < 0 ? 'text-red-600 dark:text-red-400' : 'text-[#2DB8A0]'}`}>
                                                    {delta < 0 ? '−' : '+'}
                                                    {formatQty(Math.abs(delta))}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-3 text-right text-xs text-muted-foreground">
                                                <p>
                                                    {new Date(movement.created_at).toLocaleString('pt-MZ', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </p>
                                                {movement.user?.name && <p className="mt-0.5 hidden sm:block">{movement.user.name}</p>}
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
