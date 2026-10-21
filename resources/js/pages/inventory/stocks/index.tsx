import { Head, Link, router, usePage } from '@inertiajs/react'
import { Download, Eye, Layers, PackageSearch, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
    PageHeader,
    StockBadge,
    TableCard,
    OutlineButton,
    PrimaryButton,
} from '@/components/ui/brand'
import { useBarcodeScanner } from '@/hooks/use-barcode-scanner';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Product {
    id: number
    name: string
    sku?: string | null
    min_stock?: number
}

interface Warehouse {
    id: number
    name: string
    location?: string | null
}

interface Stock {
    id: number
    quantity: number
    reserved?: number
    available?: number
    incoming?: number
    product: Product
    warehouse: Warehouse
}

interface Paginated<T> {
    data: T[]
    current_page: number
    last_page: number
    total: number
    links: { url: string | null; label: string; active: boolean }[]
}

interface Props {
    stocks: Paginated<Stock>
    warehouses: Warehouse[]
    filters: { search?: string; status?: string; warehouse_id?: string }
}

const STATUS_FILTERS = [
    { value: 'all', label: 'Todos' },
    { value: 'in_stock', label: 'Em stock' },
    { value: 'low', label: 'Stock baixo' },
    { value: 'out_of_stock', label: 'Esgotado' },
] as const

// ─── Helpers ─────────────────────────────────────────────────────────────────

function resolveStockStatus(
    qty: number,
    minStock: number,
): 'in_stock' | 'low' | 'out_of_stock' {
    if (qty <= 0) {
return 'out_of_stock'
}

    if (qty <= minStock) {
return 'low'
}

    return 'in_stock'
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Index() {
    const { stocks, warehouses, filters } = usePage<Props & Record<string, unknown>>().props

    const [search, setSearch] = useState(filters?.search ?? '')
    // Ler um código de barras preenche a pesquisa
    useBarcodeScanner({ onScan: setSearch })
    const [status, setStatus] = useState(filters?.status ?? 'all')
    const [warehouseId, setWarehouseId] = useState(filters?.warehouse_id ?? 'all')

    function applyFilters(next: { search?: string; status?: string; warehouse_id?: string }) {
        router.get('/inventory/stocks', {
            search: next.search ?? search,
            status: next.status ?? status,
            warehouse_id: next.warehouse_id ?? warehouseId,
        }, { preserveState: true, replace: true })
    }

    // A exportação respeita a pesquisa, o estado e o armazém selecionados (não só a página visível)
    function exportUrl(format: 'xlsx' | 'csv') {
        const params = new URLSearchParams({ format })

        if (search) {
            params.set('search', search)
        }

        if (status !== 'all') {
            params.set('status', status)
        }

        if (warehouseId !== 'all') {
            params.set('warehouse_id', warehouseId)
        }

        return `/inventory/stocks/export?${params}`
    }

    useEffect(() => {
        if (search === (filters?.search ?? '')) {
            return
        }

        const t = setTimeout(() => applyFilters({ search }), 400)

        return () => clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search])

    return (
        <>
            <Head title="Stock Geral" />

            <div className=" space-y-4 bg-slate-50 ">

                {/* PAGE HEADER */}
                <PageHeader
                    title="Stock Geral"
                    subtitle="Visão consolidada de inventário distribuído por produto e armazém"
                    actions={
                        <>
                            <a href={exportUrl('csv')}>
                                <OutlineButton>
                                    <Download className="h-4 w-4" />
                                    CSV
                                </OutlineButton>
                            </a>
                            <a href={exportUrl('xlsx')}>
                                <PrimaryButton>
                                    <Layers className="h-4 w-4" />
                                    Exportar Excel
                                </PrimaryButton>
                            </a>
                        </>
                    }
                />

                {/* FILTERS BAR */}
                <div className="bg-white border border-slate-200 rounded-[4px] shadow-xs px-4 py-3 flex flex-col sm:flex-row gap-3 items-center">
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Pesquisar por produto ou SKU..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full h-9 pl-9 pr-3 text-sm bg-white border border-slate-200 rounded-[4px] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2DB8A0]/30 focus:border-[#2DB8A0]"
                        />
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                        {STATUS_FILTERS.map((f) => (
                            <button
                                key={f.value}
                                onClick={() => {
                                    setStatus(f.value)
                                    applyFilters({ status: f.value })
                                }}
                                className={cn(
                                    'h-9 px-3 text-xs font-medium rounded-[4px] transition-colors border',
                                    status === f.value
                                        ? 'bg-[#1A2332] text-white border-[#1A2332]'
                                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700',
                                )}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>

                    <div className="ml-auto flex items-center gap-2 w-full sm:w-auto">
                        <Layers className="h-4 w-4 text-slate-400 hidden sm:block" />
                        <select
                            value={warehouseId}
                            onChange={(e) => {
                                setWarehouseId(e.target.value)
                                applyFilters({ warehouse_id: e.target.value })
                            }}
                            className="w-full sm:w-48 h-9 text-sm bg-white border border-slate-200 rounded-[4px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2DB8A0]/30 focus:border-[#2DB8A0]"
                        >
                            <option value="all">Todos Armazéns</option>
                            {warehouses?.map((w) => (
                                <option key={w.id} value={w.id}>{w.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* TABLE CARD */}
                <TableCard>
                    <table className="w-full text-sm">

                        {/* TABLE HEAD */}
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                    Produto
                                </th>
                                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                    SKU
                                </th>
                                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                    Armazém
                                </th>
                                <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                    Quantidade
                                </th>
                                <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                    Reservado
                                </th>
                                <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                    Disponível
                                </th>
                                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                    Ações
                                </th>
                            </tr>
                        </thead>

                        {/* TABLE BODY */}
                        <tbody>
                            {stocks.data.length === 0 ? (
                                <tr>
                                    <td colSpan={8}>
                                        <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400">
                                            <PackageSearch className="h-10 w-10" />
                                            <p className="text-sm font-medium">Nenhum registo de stock encontrado no sistema.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                stocks.data.map((stock) => {
                                    const reserved = stock.reserved ?? 0
                                    const available = stock.available ?? (stock.quantity - reserved)
                                    const minStock = stock.product.min_stock ?? 5
                                    const status = resolveStockStatus(stock.quantity, minStock)

                                    return (
                                        <tr
                                            key={stock.id}
                                            className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                                        >
                                            {/* PRODUTO */}
                                            <td className="px-4 py-3 font-medium text-slate-900">
                                                {stock.product.name}
                                            </td>

                                            {/* SKU */}
                                            <td className="px-4 py-3">
                                                <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-[4px]">
                                                    {stock.product.sku ?? '—'}
                                                </span>
                                            </td>

                                            {/* ARMAZÉM */}
                                            <td className="px-4 py-3 text-slate-600 hover:text-[#2DB8A0] transition-colors">
                                                <Link href={`/inventory/warehouses/${stock.warehouse.id}`}>
                                                    {stock.warehouse.name}
                                                </Link>
                                            </td>

                                            {/* QUANTIDADE */}
                                            <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900">
                                                {stock.quantity.toLocaleString('pt-MZ')}
                                                {(stock.incoming ?? 0) > 0 && (
                                                    <span className="block text-[11px] font-normal text-indigo-600">
                                                        +{(stock.incoming as number).toLocaleString('pt-MZ')} a chegar
                                                    </span>
                                                )}
                                            </td>

                                            {/* RESERVADO */}
                                            <td className="px-4 py-3 text-right font-mono text-slate-500">
                                                {reserved.toLocaleString('pt-MZ')}
                                            </td>

                                            {/* DISPONÍVEL */}
                                            <td className={cn(
                                                'px-4 py-3 text-right font-mono font-semibold',
                                                available > 0 ? 'text-[#2DB8A0]' : 'text-red-500',
                                            )}>
                                                {available.toLocaleString('pt-MZ')}
                                            </td>

                                            {/* STATUS */}
                                            <td className="px-4 py-3">
                                                {/* Sem stock mas com mercadoria a chegar: não está esgotado, está à espera */}
                                                {status === 'out_of_stock' && (stock.incoming ?? 0) > 0 ? (
                                                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-[4px] bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                                                        <span className="h-1.5 w-1.5 rounded-full flex-shrink-0 bg-indigo-500" />
                                                        A chegar
                                                    </span>
                                                ) : (
                                                    <StockBadge status={status} />
                                                )}
                                            </td>

                                            {/* AÇÕES */}
                                            <td className="px-4 py-3 text-right">
                                                <Link
                                                    href={`/inventory/stocks/${stock.product.id}`}
                                                    className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium border border-slate-200 bg-white text-slate-700 rounded-[4px] hover:bg-slate-50 hover:border-slate-300 transition-colors"
                                                >
                                                    <Eye className="h-3.5 w-3.5" />
                                                    Detalhes
                                                </Link>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>

                    {/* PAGINATION */}
                    {stocks.last_page > 1 && (
                        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-white">
                            <p className="text-xs text-slate-500">
                                Página {stocks.current_page} de {stocks.last_page} · {stocks.total} registos
                            </p>
                            <div className="flex gap-1">
                                {stocks.links.map((link, i) => (
                                    <button
                                        key={i}
                                        disabled={!link.url}
                                        onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                        className={cn(
                                            'px-3 py-1.5 text-xs rounded-[4px] border transition-colors',
                                            link.active
                                                ? 'bg-[#2DB8A0] text-white border-transparent font-medium'
                                                : !link.url
                                                ? 'text-slate-300 border-transparent cursor-not-allowed'
                                                : 'border-slate-200 text-slate-600 hover:bg-slate-50',
                                        )}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </TableCard>
            </div>
        </>
    )
}

Index.layout = (page: any) => (
    <AppLayout breadcrumbs={[
        { title: 'Inventário', href: '#' },
        { title: 'Stock Geral', href: '/inventory/stocks' },
    ]}>
        {page}
    </AppLayout>
);