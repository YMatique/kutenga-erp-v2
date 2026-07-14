import { Head, Link, router } from '@inertiajs/react'
import {
    ArrowRightLeft,
    Search,
    Plus,
    Eye,
    CheckCircle2,
    Clock,
    XCircle,
    PackageCheck,
    FilterX,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import {
    PageHeader,
    TableCard,
    PrimaryButton,
    OutlineButton,
} from '@/components/ui/brand'
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Warehouse {
    id: number
    name: string
}

interface Transfer {
    id: number
    reference?: string | null
    created_at?: string
    from_warehouse: Warehouse
    to_warehouse: Warehouse
    status: 'pending' | 'approved' | 'completed' | 'cancelled'
    items_count?: number
}

interface PaginatedTransfers {
    data: Transfer[]
    current_page: number
    last_page: number
    total: number
    links: Array<{ url: string | null; label: string; active: boolean }>
}

interface Filters {
    search?: string
    status?: string
}

interface IndexProps {
    transfers: PaginatedTransfers
    filters: Filters
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

const statusConfig: Record<
    Transfer['status'],
    { label: string; dot: string; cls: string; icon: React.ReactNode }
> = {
    pending: {
        label: 'Pendente',
        dot: 'bg-[#E8A020]',
        cls: 'bg-[#E8A020]/10 text-[#E8A020]',
        icon: <Clock className="h-3 w-3" />,
    },
    approved: {
        label: 'Aprovado',
        dot: 'bg-blue-500',
        cls: 'bg-blue-50 text-blue-600',
        icon: <CheckCircle2 className="h-3 w-3" />,
    },
    completed: {
        label: 'Concluído',
        dot: 'bg-[#2DB8A0]',
        cls: 'bg-[#2DB8A0]/10 text-[#2DB8A0]',
        icon: <PackageCheck className="h-3 w-3" />,
    },
    cancelled: {
        label: 'Cancelado',
        dot: 'bg-red-500',
        cls: 'bg-red-50 text-red-600',
        icon: <XCircle className="h-3 w-3" />,
    },
}

function TransferStatusBadge({ status }: { status: Transfer['status'] }) {
    const cfg = statusConfig[status] ?? statusConfig.pending

    return (
        <span className={cn('inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-[4px]', cfg.cls)}>
            <span className={cn('h-1.5 w-1.5 rounded-full flex-shrink-0', cfg.dot)} />
            {cfg.label}
        </span>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Index({ transfers, filters }: IndexProps) {
    const [search, setSearch] = useState(filters?.search || '')
    const [status, setStatus] = useState(filters?.status || 'all')

    // Auto-apply on status change
    useEffect(() => {
        if (status !== (filters?.status || 'all')) {
            applyFilters({ newStatus: status })
        }
    }, [status])

    // Debounced search
    useEffect(() => {
        if (search === (filters?.search || '')) {
return
}

        const t = setTimeout(() => applyFilters({ newSearch: search }), 400)

        return () => clearTimeout(t)
    }, [search])

    function applyFilters(overrides: { newSearch?: string; newStatus?: string } = {}) {
        router.get('/inventory/transfers', {
            search: overrides.newSearch !== undefined ? overrides.newSearch : search,
            status: overrides.newStatus !== undefined ? overrides.newStatus : status,
        }, { preserveState: true, replace: true })
    }

    const hasFilters = search || status !== 'all'

    return (
        <>
            <Head title="Transferências de Stock" />

            <div className="space-y-4 bg-slate-50 ">

                {/* PAGE HEADER */}
                <PageHeader
                    title="Transferências de Stock"
                    subtitle="Gestão de movimentação de stock entre armazéns"
                    actions={
                        <Link href="/inventory/transfers/create">
                            <PrimaryButton>
                                <Plus className="h-4 w-4" />
                                Nova Transferência
                            </PrimaryButton>
                        </Link>
                    }
                />

                {/* FILTERS BAR */}
                <div className="bg-white border border-slate-200 rounded-[4px] shadow-xs px-4 py-3 flex flex-col sm:flex-row gap-3 items-center">
                    {/* Search */}
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Pesquisar por referência ou armazém..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full h-9 pl-9 pr-3 text-sm bg-white border border-slate-200 rounded-[4px] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2DB8A0]/30 focus:border-[#2DB8A0]"
                        />
                    </div>

                    {/* Status filter */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {(['all', 'pending', 'approved', 'completed', 'cancelled'] as const).map((s) => {
                            const isAll = s === 'all'
                            const active = status === s
                            const cfg = isAll ? null : statusConfig[s as Transfer['status']]

                            return (
                                <button
                                    key={s}
                                    onClick={() => setStatus(s)}
                                    className={cn(
                                        'h-7 px-3 text-xs font-medium rounded-[4px] transition-colors border',
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

                    {/* Clear filters */}
                    {hasFilters && (
                        <button
                            onClick={() => {
 setSearch(''); setStatus('all') 
}}
                            className="ml-auto flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors"
                        >
                            <FilterX className="h-3.5 w-3.5" />
                            Limpar
                        </button>
                    )}
                </div>

                {/* TABLE */}
                <TableCard>
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400 w-[130px]">
                                    Data
                                </th>
                                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                    Referência
                                </th>
                                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                    Origem
                                </th>
                                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                    Destino
                                </th>
                                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400 w-[110px]">
                                    Estado
                                </th>
                                <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-400 w-[100px]">
                                    Total Itens
                                </th>
                                <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-400 w-[160px]">
                                    Acções
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {transfers.data.length === 0 ? (
                                <tr>
                                    <td colSpan={7}>
                                        <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400">
                                            <ArrowRightLeft className="h-10 w-10" />
                                            <p className="text-sm font-medium">
                                                Nenhuma transferência encontrada{hasFilters ? ' com os filtros aplicados' : ''}.
                                            </p>
                                            {hasFilters && (
                                                <button
                                                    onClick={() => {
 setSearch(''); setStatus('all') 
}}
                                                    className="text-xs text-[#2DB8A0] underline underline-offset-2"
                                                >
                                                    Limpar filtros
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                transfers.data.map((t) => (
                                    <tr
                                        key={t.id}
                                        className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                                    >
                                        {/* DATA */}
                                        <td className="px-4 py-3 text-slate-500 text-xs tabular-nums whitespace-nowrap">
                                            {t.created_at
                                                ? new Date(t.created_at).toLocaleDateString('pt-MZ', {
                                                    day: '2-digit', month: '2-digit', year: 'numeric'
                                                })
                                                : '—'}
                                        </td>

                                        {/* REFERÊNCIA */}
                                        <td className="px-4 py-3">
                                            <Link
                                                href={`/inventory/transfers/${t.id}`}
                                                className="font-mono text-[12px] font-semibold text-[#2DB8A0] hover:text-[#229c87] transition-colors"
                                            >
                                                {t.reference ?? `#${String(t.id).padStart(5, '0')}`}
                                            </Link>
                                        </td>

                                        {/* ORIGEM */}
                                        <td className="px-4 py-3 text-slate-700 font-medium">
                                            {t.from_warehouse.name}
                                        </td>

                                        {/* DESTINO */}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2 text-slate-700 font-medium">
                                                <ArrowRightLeft className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                                                {t.to_warehouse.name}
                                            </div>
                                        </td>

                                        {/* ESTADO */}
                                        <td className="px-4 py-3">
                                            <TransferStatusBadge status={t.status} />
                                        </td>

                                        {/* TOTAL ITENS */}
                                        <td className="px-4 py-3 text-right font-mono text-slate-700">
                                            {t.items_count ?? '—'}
                                        </td>

                                        {/* ACÇÕES */}
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <Link
                                                    href={`/inventory/transfers/${t.id}`}
                                                    className="inline-flex items-center gap-1.5 h-7 px-2.5 text-[11px] font-medium border border-slate-200 bg-white text-slate-700 rounded-[4px] hover:bg-slate-50 transition-colors"
                                                >
                                                    <Eye className="h-3 w-3" />
                                                    Ver
                                                </Link>

                                                {t.status === 'pending' && (
                                                    <Link
                                                        href={`/inventory/transfers/${t.id}/approve`}
                                                        method="post"
                                                        as="button"
                                                        className="inline-flex items-center gap-1.5 h-7 px-2.5 text-[11px] font-medium bg-blue-50 border border-blue-200 text-blue-600 rounded-[4px] hover:bg-blue-100 transition-colors"
                                                    >
                                                        Aprovar
                                                    </Link>
                                                )}

                                                {t.status === 'approved' && (
                                                    <Link
                                                        href={`/inventory/transfers/${t.id}/complete`}
                                                        method="post"
                                                        as="button"
                                                        className="inline-flex items-center gap-1.5 h-7 px-2.5 text-[11px] font-medium bg-[#2DB8A0]/10 border border-[#2DB8A0]/30 text-[#2DB8A0] rounded-[4px] hover:bg-[#2DB8A0]/20 transition-colors"
                                                    >
                                                        <CheckCircle2 className="h-3 w-3" />
                                                        Finalizar
                                                    </Link>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {transfers.last_page > 1 && (
                        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-white">
                            <p className="text-xs text-slate-500">
                                Página {transfers.current_page} de {transfers.last_page} · {transfers.total} registos
                            </p>
                            <div className="flex gap-1">
                                {transfers.links.map((link, i) => (
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

Index.layout = {
    breadcrumbs: [
        { title: 'Inventário', href: '#' },
        { title: 'Transferências de Stock', href: '/inventory/transfers' },
    ],
};