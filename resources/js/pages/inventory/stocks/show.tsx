import { Head, Link } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout';
import {
    ArrowLeft,
    Box,
    Landmark,
    PackageCheck,
    History,
    Calendar,
    User,
    Tag,
    Hash,
    Layers,
    DollarSign,
    AlertCircle,
    Info,
    Warehouse as WarehouseIcon,
    Pencil
} from 'lucide-react'
import {
    PageHeader,
    TableCard,
    OutlineButton,
    KpiCard,
    StockBadge
} from '@/components/ui/brand'
import { cn } from '@/lib/utils'

interface Warehouse {
    id: number
    name: string
    code?: string | null
}

interface Stock {
    id: number
    quantity: number
    warehouse: Warehouse
}

interface Product {
    id: number
    name: string
    sku?: string | null
    barcode?: string | null
    type: string
    track_stock: boolean
    min_stock?: number | null
    price: number | string
    cost: number | string
    status: 'active' | 'inactive'
    category?: { name: string } | null
    brand?: { name: string } | null
    unit?: { name: string } | null
}

interface UserType {
    id: number
    name: string
}

interface Movement {
    id: number
    type: 'in' | 'out' | 'adjustment' | 'opening'
    quantity: number
    created_at: string
    notes?: string | null
    warehouse: { name: string; code?: string | null }
    user?: UserType | null
}

interface Props {
    product: Product
    stocks: Stock[]
    movements: Movement[]
}

function resolveStockStatus(
    qty: number,
    minStock: number,
): 'in_stock' | 'low' | 'out_of_stock' {
    if (qty <= 0) return 'out_of_stock'
    if (qty <= minStock) return 'low'
    return 'in_stock'
}

export default function Show({ product, stocks, movements }: Props) {
    const totalStock = stocks.reduce((sum, s) => sum + Number(s.quantity), 0)
    const minStockVal = product.min_stock ?? 5
    const status = resolveStockStatus(totalStock, minStockVal)

    const formatCurrency = (val: string | number) => {
        return Number(val).toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' });
    }

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString('pt-MZ', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return dateStr;
        }
    }

    const getMovementBadge = (type: 'in' | 'out' | 'adjustment' | 'opening') => {
        switch (type) {
            case 'in':
                return (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-[4px] bg-[#2DB8A0]/10 text-[#2DB8A0]">
                        Entrada
                    </span>
                );
            case 'out':
                return (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-[4px] bg-red-50 text-red-600">
                        Saída
                    </span>
                );
            case 'adjustment':
                return (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-[4px] bg-amber-50 text-amber-600">
                        Ajuste
                    </span>
                );
            case 'opening':
                return (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-[4px] bg-blue-50 text-blue-600">
                        Abertura
                    </span>
                );
            default:
                return type;
        }
    }

    return (
        <>
            <Head title={`Stock - ${product.name}`} />

            <div className=" space-y-6 bg-slate-50 ">
                {/* PAGE HEADER */}
                <PageHeader
                    title={product.name}
                    subtitle="Disponibilidade, distribuição e histórico de movimentações por produto"
                    actions={
                        <div className="flex gap-2">
                            <Link href="/inventory/stocks">
                                <OutlineButton>
                                    <ArrowLeft className="h-4 w-4" />
                                    Voltar
                                </OutlineButton>
                            </Link>
                            <Link href={`/products/${product.id}/edit`}>
                                <OutlineButton className="border-[#2DB8A0]/30 hover:border-[#2DB8A0] text-slate-800">
                                    <Pencil className="h-4 w-4 text-[#2DB8A0]" />
                                    Editar Produto
                                </OutlineButton>
                            </Link>
                        </div>
                    }
                />

                {/* MAIN GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* LEFT COLUMN: PRODUCT INFO CARD */}
                    <div className="lg:col-span-1 space-y-4">
                        <div className="bg-white border border-slate-200 rounded-[4px] shadow-xs p-5 space-y-4">
                            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                                <Info className="h-4 w-4 text-slate-400" />
                                <h3 className="text-sm font-semibold text-slate-800">Detalhes do Produto</h3>
                            </div>

                            {product.sku && (
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">SKU</label>
                                    <p className="text-sm font-mono text-slate-800">{product.sku}</p>
                                </div>
                            )}

                            {product.barcode && (
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Código de Barras</label>
                                    <p className="text-sm font-mono text-slate-800">{product.barcode}</p>
                                </div>
                            )}

                            <div>
                                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Categoria</label>
                                <p className="text-sm text-slate-700 font-medium">
                                    {product.category?.name || <span className="text-slate-400">Sem categoria</span>}
                                </p>
                            </div>

                            <div>
                                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Marca</label>
                                <p className="text-sm text-slate-700 font-medium">
                                    {product.brand?.name || <span className="text-slate-400">Sem marca</span>}
                                </p>
                            </div>

                            <div>
                                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Preço de Venda</label>
                                <p className="text-sm text-slate-800 font-semibold">{formatCurrency(product.price)}</p>
                            </div>

                            <div>
                                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Custo Unitário</label>
                                <p className="text-sm text-slate-800">{formatCurrency(product.cost)}</p>
                            </div>

                            <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500">Unidade</span>
                                    <span className="font-semibold text-slate-700">{product.unit?.name || 'unidade'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500">Rastrear Stock</span>
                                    <span className={cn('font-semibold', product.track_stock ? 'text-[#2DB8A0]' : 'text-slate-400')}>
                                        {product.track_stock ? 'Sim' : 'Não'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500">Stock Mínimo Alerta</span>
                                    <span className="font-semibold font-mono text-slate-700">{minStockVal}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: STOCK POSITION AND MOVEMENTS */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* KPIS */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <KpiCard
                                label="Stock Total Acumulado"
                                value={`${totalStock} ${product.unit?.name || 'un'}`}
                                icon={<PackageCheck className="h-5 w-5" />}
                                accent={status === 'out_of_stock' ? 'red' : status === 'low' ? 'orange' : 'teal'}
                                description="Soma de todos os armazéns"
                            />
                            <div className="bg-white border border-slate-200 rounded-[4px] px-5 py-4 shadow-xs flex items-center justify-between">
                                <div>
                                    <p className="text-[12px] font-medium text-slate-500 uppercase tracking-wide mb-2">Estado do Stock</p>
                                    <StockBadge status={status} />
                                </div>
                                <div className="h-9 w-9 rounded-[4px] bg-slate-100 text-slate-500 flex items-center justify-center">
                                    <AlertCircle className="h-5 w-5" />
                                </div>
                            </div>
                        </div>

                        {/* POSITION BY WAREHOUSE TABLE */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Landmark className="h-5 w-5 text-slate-700" />
                                <h2 className="text-base font-semibold text-slate-800">Posição por Local de Armazenamento</h2>
                            </div>

                            <TableCard>
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 border-b border-slate-100">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                                Armazém
                                            </th>
                                            <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                                Código
                                            </th>
                                            <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                                Quantidade em Stock
                                            </th>
                                            <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-400 w-[120px]">
                                                Ação
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stocks.length === 0 ? (
                                            <tr>
                                                <td colSpan={4}>
                                                    <div className="flex flex-col items-center justify-center gap-2 py-12 text-slate-400">
                                                        <WarehouseIcon className="h-8 w-8 text-slate-300" />
                                                        <p className="text-sm font-medium">Este produto não possui registo de stock em nenhum armazém.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            stocks.map((stock) => (
                                                <tr
                                                    key={stock.id}
                                                    className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                                                >
                                                    <td className="px-4 py-3 font-medium text-slate-900">
                                                        {stock.warehouse.name}
                                                    </td>
                                                    <td className="px-4 py-3 font-mono text-xs text-slate-500">
                                                        {stock.warehouse.code || <span className="text-slate-300">—</span>}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900 text-base">
                                                        {Number(stock.quantity).toLocaleString('pt-MZ')} {product.unit?.name || 'un'}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <Link
                                                            href={`/inventory/warehouses/${stock.warehouse.id}`}
                                                            className="inline-flex items-center gap-1 h-7 px-2 text-xs font-medium border border-slate-200 bg-white text-[#2DB8A0] rounded-[4px] hover:bg-slate-50 transition-colors"
                                                        >
                                                            Ver Armazém
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </TableCard>
                        </div>

                        {/* RECENT MOVEMENTS TABLE */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <History className="h-5 w-5 text-slate-700" />
                                <h2 className="text-base font-semibold text-slate-800">Movimentações Recentes</h2>
                            </div>

                            <TableCard>
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 border-b border-slate-100">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                                Data
                                            </th>
                                            <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                                Armazém
                                            </th>
                                            <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                                Tipo
                                            </th>
                                            <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                                Quantidade
                                            </th>
                                            <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                                Notas
                                            </th>
                                            <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                                Operador
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {movements.length === 0 ? (
                                            <tr>
                                                <td colSpan={6}>
                                                    <div className="flex flex-col items-center justify-center gap-2 py-12 text-slate-400">
                                                        <History className="h-8 w-8 text-slate-300" />
                                                        <p className="text-sm font-medium">Nenhum movimento recente registado para este produto.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            movements.map((mov) => (
                                                <tr
                                                    key={mov.id}
                                                    className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors text-xs"
                                                >
                                                    <td className="px-4 py-2.5 font-mono text-slate-600">
                                                        {formatDate(mov.created_at)}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-slate-800 font-medium">
                                                        {mov.warehouse.name}
                                                    </td>
                                                    <td className="px-4 py-2.5">
                                                        {getMovementBadge(mov.type)}
                                                    </td>
                                                    <td className={cn(
                                                        'px-4 py-2.5 text-right font-mono font-semibold text-sm',
                                                        mov.type === 'in' || mov.type === 'opening' ? 'text-[#2DB8A0]' : 'text-red-500'
                                                    )}>
                                                        {mov.type === 'in' || mov.type === 'opening' ? '+' : '-'}
                                                        {Number(mov.quantity).toLocaleString('pt-MZ')}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-slate-500 max-w-[200px] truncate" title={mov.notes || ''}>
                                                        {mov.notes || <span className="text-slate-300">—</span>}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-slate-600">
                                                        {mov.user?.name || 'Sistema'}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </TableCard>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

Show.layout = (page: any) => (
    <AppLayout breadcrumbs={[
        { title: 'Inventário', href: '#' },
        { title: 'Stock Geral', href: '/inventory/stocks' },
        { title: page.props?.product?.name ?? 'Detalhes', href: '#' },
    ]}>
        {page}
    </AppLayout>
);