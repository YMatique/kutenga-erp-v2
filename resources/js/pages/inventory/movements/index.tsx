import { Head, usePage, router } from '@inertiajs/react'
import { ArrowDownCircle, ArrowUpCircle, RefreshCw, Package2, Activity, Search, FilterX, TrendingUp, TrendingDown, Layers } from 'lucide-react'
import { useState, useEffect } from 'react'
import {
    PageHeader,
    TableCard,
    KpiCard,
} from '@/components/ui/brand'
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Movement {
    id: number
    type: 'in' | 'out' | 'adjustment' | 'opening'
    quantity: number
    notes: string | null
    reference?: string | null
    created_at: string

    product: {
        name: string
        sku: string | null
    }

    warehouse: {
        name: string
    }

    user: {
        name: string
    }
}

// ─── Movement Type Badge ─────────────────────────────────────────────────────

const movementTypeConfig: Record<
    Movement['type'],
    { label: string; dot: string; cls: string; icon: React.ReactNode }
> = {
    in: {
        label: 'Entrada',
        dot: 'bg-[#2DB8A0]',
        cls: 'bg-[#2DB8A0]/10 text-[#2DB8A0]',
        icon: <ArrowDownCircle className="h-3 w-3" />,
    },
    out: {
        label: 'Saída',
        dot: 'bg-red-500',
        cls: 'bg-red-50 text-red-600',
        icon: <ArrowUpCircle className="h-3 w-3" />,
    },
    adjustment: {
        label: 'Ajuste',
        dot: 'bg-[#E8A020]',
        cls: 'bg-[#E8A020]/10 text-[#E8A020]',
        icon: <RefreshCw className="h-3 w-3" />,
    },
    opening: {
        label: 'Abertura',
        dot: 'bg-slate-400',
        cls: 'bg-slate-100 text-slate-500',
        icon: <Package2 className="h-3 w-3" />,
    },
}

function MovementTypeBadge({ type }: { type: Movement['type'] }) {
    const cfg = movementTypeConfig[type] ?? movementTypeConfig.adjustment

    return (
        <span className={cn('inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-[4px]', cfg.cls)}>
            <span className={cn('h-1.5 w-1.5 rounded-full flex-shrink-0', cfg.dot)} />
            {cfg.label}
        </span>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MovementsIndex() {
    const { movements, filters, warehouses, kpis } = usePage<any>().props

    const [search, setSearch] = useState(filters?.search || '')
    const [type, setType] = useState(filters?.type || 'all')
    const [warehouseId, setWarehouseId] = useState(filters?.warehouse_id || 'all')

    useEffect(() => {
        if (type !== (filters?.type || 'all') || warehouseId !== (filters?.warehouse_id || 'all')) {
            applyFilters({ newType: type, newWarehouse: warehouseId })
        }
    }, [type, warehouseId])

    useEffect(() => {
        if (search === (filters?.search || '')) return
        const t = setTimeout(() => applyFilters({ newSearch: search }), 400)
        return () => clearTimeout(t)
    }, [search])

    function applyFilters(overrides: { newSearch?: string; newType?: string; newWarehouse?: string } = {}) {
        router.get('/inventory/movements', {
            search: overrides.newSearch !== undefined ? overrides.newSearch : search,
            type: overrides.newType !== undefined ? overrides.newType : type,
            warehouse_id: overrides.newWarehouse !== undefined ? overrides.newWarehouse : warehouseId,
        }, { preserveState: true, replace: true })
    }

    const hasFilters = search || type !== 'all' || warehouseId !== 'all'

    return (
        <>
            <Head title="Movimentos de Stock" />

            <div className="space-y-4 bg-slate-50 ">

                {/* PAGE HEADER */}
                <PageHeader
                    title="Movimentos de Stock"
                    subtitle="Histórico completo de entradas, saídas e ajustes de inventário"
                    actions={
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-[4px]">
                            <Activity className="h-3.5 w-3.5 text-[#2DB8A0]" />
                            {movements?.total ?? 0} movimentos
                        </div>
                    }
                />

                {/* KPIS */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <KpiCard
                        label="Total de Movimentos"
                        value={kpis?.total || 0}
                        icon={<Activity className="h-5 w-5" />}
                        accent="slate"
                    />
                    <KpiCard
                        label="Total de Entradas"
                        value={`+${kpis?.in || 0}`}
                        icon={<TrendingUp className="h-5 w-5" />}
                        accent="teal"
                    />
                    <KpiCard
                        label="Total de Saídas"
                        value={`-${kpis?.out || 0}`}
                        icon={<TrendingDown className="h-5 w-5" />}
                        accent="red"
                    />
                </div>

                {/* FILTERS BAR */}
                <div className="bg-white border border-slate-200 rounded-[4px] shadow-xs px-4 py-3 flex flex-col sm:flex-row gap-3 items-center">
                    {/* Search */}
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

                    {/* Type Filter */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {(['all', 'in', 'out', 'adjustment', 'opening'] as const).map((t) => {
                            const isAll = t === 'all'
                            const active = type === t
                            const cfg = isAll ? null : movementTypeConfig[t as Movement['type']]

                            return (
                                <button
                                    key={t}
                                    onClick={() => setType(t)}
                                    className={cn(
                                        'h-9 px-3 text-xs font-medium rounded-[4px] transition-colors border flex items-center justify-center',
                                        active
                                            ? isAll
                                                ? 'bg-[#1A2332] text-white border-[#1A2332]'
                                                : cn(cfg?.cls, 'border-current')
                                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700',
                                    )}
                                >
                                    {isAll ? 'Todos' : cfg?.label}
                                </button>
                            )
                        })}
                    </div>

                    {/* Warehouse Filter */}
                    <div className="ml-auto flex items-center gap-2 w-full sm:w-auto">
                        <Layers className="h-4 w-4 text-slate-400 hidden sm:block" />
                        <select
                            value={warehouseId}
                            onChange={(e) => setWarehouseId(e.target.value)}
                            className="w-full sm:w-48 h-9 text-sm bg-white border border-slate-200 rounded-[4px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2DB8A0]/30 focus:border-[#2DB8A0]"
                        >
                            <option value="all">Todos Armazéns</option>
                            {warehouses?.map((w: any) => (
                                <option key={w.id} value={w.id}>{w.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Clear filters */}
                    {hasFilters && (
                        <button
                            onClick={() => {
                                setSearch(''); setType('all'); setWarehouseId('all');
                            }}
                            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors w-full sm:w-auto justify-center"
                        >
                            <FilterX className="h-3.5 w-3.5" />
                            Limpar
                        </button>
                    )}
                </div>

                {/* TABLE CARD */}
                <TableCard>
                    <table className="w-full text-sm">

                        {/* TABLE HEAD */}
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400 w-[140px]">
                                    Data
                                </th>
                                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                    Produto
                                </th>
                                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                    Armazém
                                </th>
                                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400 w-[110px]">
                                    Tipo
                                </th>
                                <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-400 w-[100px]">
                                    Quantidade
                                </th>
                                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                    Referência
                                </th>
                                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                    Utilizador
                                </th>
                            </tr>
                        </thead>

                        {/* TABLE BODY */}
                        <tbody>
                            {(!movements?.data || movements.data.length === 0) ? (
                                <tr>
                                    <td colSpan={7}>
                                        <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400">
                                            <Activity className="h-10 w-10" />
                                            <p className="text-sm font-medium">Nenhum movimento encontrado{hasFilters ? ' com os filtros aplicados' : ''}.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                movements.data.map((m: Movement) => (
                                    <tr
                                        key={m.id}
                                        className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                                    >
                                        {/* DATA */}
                                        <td className="px-4 py-3 text-slate-500 text-xs tabular-nums whitespace-nowrap">
                                            {new Date(m.created_at).toLocaleString('pt-MZ', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </td>

                                        {/* PRODUTO */}
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-slate-900">{m.product.name}</p>
                                            {m.product.sku && (
                                                <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                                                    {m.product.sku}
                                                </p>
                                            )}
                                        </td>

                                        {/* ARMAZÉM */}
                                        <td className="px-4 py-3 text-slate-600">
                                            {m.warehouse?.name}
                                        </td>

                                        {/* TIPO */}
                                        <td className="px-4 py-3">
                                            <MovementTypeBadge type={m.type} />
                                        </td>

                                        {/* QUANTIDADE */}
                                        <td className={cn(
                                            'px-4 py-3 text-right font-mono font-semibold tabular-nums',
                                            (m.type === 'in' || m.type === 'opening' || (m.type === 'adjustment' && Number(m.quantity) > 0)) ? 'text-[#2DB8A0]' : 'text-red-500'
                                        )}>
                                            {m.type === 'in' || m.type === 'opening' || (m.type === 'adjustment' && Number(m.quantity) > 0) ? '+' : '-'}
                                            {Math.abs(Number(m.quantity)).toLocaleString('pt-MZ')}
                                        </td>

                                        {/* REFERÊNCIA */}
                                        <td className="px-4 py-3 text-slate-500 text-xs font-mono">
                                            {m.reference ?? (m.notes ? (
                                                <span className="italic text-slate-400 font-sans">{m.notes}</span>
                                            ) : (
                                                <span className="text-slate-300">—</span>
                                            ))}
                                        </td>

                                        {/* UTILIZADOR */}
                                        <td className="px-4 py-3">
                                            <span className="text-slate-600 text-xs">
                                                {m.user?.name ?? 'Sistema'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {movements?.last_page > 1 && (
                        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-white">
                            <p className="text-xs text-slate-500">
                                Página {movements.current_page} de {movements.last_page} · {movements.total} registos
                            </p>
                            <div className="flex gap-1">
                                {movements.links.map((link: any, i: number) => (
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

MovementsIndex.layout = {
    breadcrumbs: [
        { title: 'Inventário', href: '#' },
        { title: 'Movimentos', href: '/inventory/movements' },
    ],
};