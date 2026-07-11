import { Head, Link } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout';
import {
    ArrowLeft,
    Pencil,
    Warehouse as WarehouseIcon,
    Package,
    Boxes,
    Calendar,
    User,
    MapPin,
    Star,
    Info,
    History,
    FileText,
    CheckCircle,
    XCircle
} from 'lucide-react'
import {
    PageHeader,
    TableCard,
    OutlineButton,
    KpiCard,
} from '@/components/ui/brand'
import { cn } from '@/lib/utils'

interface Product {
    id: number
    name: string
    sku?: string | null
    category?: { name: string } | null
    brand?: { name: string } | null
    unit?: { name: string } | null
}

interface Stock {
    id: number
    quantity: number
    product: Product
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
    product: { name: string; sku?: string | null }
    user?: UserType | null
}

interface Warehouse {
    id: number
    name: string
    code?: string | null
    address?: string | null
    description?: string | null
    is_default: boolean
    is_active: boolean
}

interface Props {
    warehouse: Warehouse
    stocks: Stock[]
    movements: Movement[]
}

export default function Show({ warehouse, stocks, movements }: Props) {
    const totalQty = stocks.reduce((sum, s) => sum + Number(s.quantity), 0)
    const totalProducts = stocks.length

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
            <Head title={`Armazém - ${warehouse.name}`} />

            <div className="space-y-6 bg-slate-50 ">
                {/* PAGE HEADER */}
                <PageHeader
                    title={warehouse.name}
                    subtitle={`Detalhes completos e inventário do armazém ${warehouse.code ? `(${warehouse.code})` : ''}`}
                    actions={
                        <div className="flex gap-2">
                            <Link href="/inventory/warehouses">
                                <OutlineButton>
                                    <ArrowLeft className="h-4 w-4" />
                                    Voltar
                                </OutlineButton>
                            </Link>
                            <Link href={`/inventory/warehouses/${warehouse.id}/edit`}>
                                <OutlineButton className="border-[#2DB8A0]/30 hover:border-[#2DB8A0] text-slate-800">
                                    <Pencil className="h-4 w-4 text-[#2DB8A0]" />
                                    Editar Armazém
                                </OutlineButton>
                            </Link>
                        </div>
                    }
                />

                {/* MAIN GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* LEFT COLUMN: INFO CARD */}
                    <div className="lg:col-span-1 space-y-4">
                        <div className="bg-white border border-slate-200 rounded-[4px] shadow-xs p-5 space-y-4">
                            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                                <Info className="h-4 w-4 text-slate-400" />
                                <h3 className="text-sm font-semibold text-slate-800">Informações Gerais</h3>
                            </div>

                            <div>
                                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Nome</label>
                                <p className="text-sm text-slate-800 font-medium">{warehouse.name}</p>
                            </div>

                            {warehouse.code && (
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Código</label>
                                    <p className="text-sm font-mono text-slate-800">{warehouse.code}</p>
                                </div>
                            )}

                            <div>
                                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Localização / Endereço</label>
                                <div className="text-sm text-slate-700 mt-0.5">
                                    {warehouse.address ? (
                                        <span className="flex items-start gap-1.5">
                                            <MapPin className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />
                                            {warehouse.address}
                                        </span>
                                    ) : 'Não informada'}
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Descrição</label>
                                <p className="text-xs text-slate-500 italic mt-0.5">
                                    {warehouse.description || 'Sem descrição.'}
                                </p>
                            </div>

                            <div className="pt-2 border-t border-slate-100 space-y-2">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500">Estado</span>
                                    {warehouse.is_active ? (
                                        <span className="inline-flex items-center gap-1 font-semibold text-[#2DB8A0]">
                                            <CheckCircle className="h-3 w-3" /> Ativo
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 font-semibold text-red-500">
                                            <XCircle className="h-3 w-3" /> Inativo
                                        </span>
                                    )}
                                </div>

                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500">Armazém Padrão</span>
                                    {warehouse.is_default ? (
                                        <span className="inline-flex items-center gap-1 font-semibold text-[#E8A020]">
                                            <Star className="h-3 w-3 fill-current" /> Sim
                                        </span>
                                    ) : (
                                        <span className="text-slate-400">Não</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: KPIS & DATA TABLES */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* KPIS */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <KpiCard
                                label="Produtos Vinculados"
                                value={totalProducts}
                                icon={<Package className="h-5 w-5" />}
                                accent="teal"
                                description="Total de itens com registo neste armazém"
                            />
                            <KpiCard
                                label="Quantidade Total em Stock"
                                value={totalQty.toLocaleString('pt-MZ')}
                                icon={<Boxes className="h-5 w-5" />}
                                accent="gold"
                                description="Soma acumulada de quantidades"
                            />
                        </div>

                        {/* PRODUCTS IN STOCK TABLE */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <WarehouseIcon className="h-5 w-5 text-slate-700" />
                                <h2 className="text-base font-semibold text-slate-800">Produtos no Armazém</h2>
                            </div>

                            <TableCard>
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 border-b border-slate-100">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                                Produto
                                            </th>
                                            <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                                SKU
                                            </th>
                                            <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                                Categoria
                                            </th>
                                            <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                                Quantidade
                                            </th>
                                            <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-400 w-[100px]">
                                                Ação
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stocks.length === 0 ? (
                                            <tr>
                                                <td colSpan={5}>
                                                    <div className="flex flex-col items-center justify-center gap-2 py-12 text-slate-400">
                                                        <Package className="h-8 w-8 text-slate-300" />
                                                        <p className="text-sm font-medium">Nenhum produto com stock registado neste armazém.</p>
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
                                                        {stock.product.name}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {stock.product.sku ? (
                                                            <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-[4px]">
                                                                {stock.product.sku}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-400">—</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-600 text-xs">
                                                        {stock.product.category?.name || 'Sem Categoria'}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-mono font-semibold text-slate-800">
                                                        {Number(stock.quantity).toLocaleString('pt-MZ')} {stock.product.unit?.name || 'un'}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <Link
                                                            href={`/inventory/stocks/${stock.product.id}`}
                                                            className="inline-flex items-center gap-1 h-7 px-2 text-xs font-medium border border-slate-200 bg-white text-[#2DB8A0] rounded-[4px] hover:bg-slate-50 transition-colors"
                                                        >
                                                            Detalhes
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
                                                Produto
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
                                                        <p className="text-sm font-medium">Nenhum movimento recente registado.</p>
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
                                                    <td className="px-4 py-2.5 font-medium text-slate-900">
                                                        {mov.product.name}
                                                        {mov.product.sku && (
                                                            <span className="block text-[10px] text-slate-400 font-mono">
                                                                SKU: {mov.product.sku}
                                                            </span>
                                                        )}
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
        { title: 'Armazéns', href: '/inventory/warehouses' },
        { title: page.props?.warehouse?.name ?? 'Detalhes', href: '#' },
    ]}>
        {page}
    </AppLayout>
);
