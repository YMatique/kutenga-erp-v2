import { Head, Link, router } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout';
import { useState, useEffect } from 'react'
import {
    ClipboardList,
    Search,
    Plus,
    FileText,
    Check,
    Ban,
    FilterX,
    TrendingUp,
    TrendingDown,
    Warehouse,
    Clock,
    PackageCheck,
    XCircle,
    AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
    PageHeader,
    TableCard,
    PrimaryButton,
} from '@/components/ui/brand'

// ─── Types ───────────────────────────────────────────────────────────────────

interface WarehouseType {
    id: number
    name: string
}

interface Adjustment {
    id: number
    status: 'draft' | 'completed' | 'cancelled'
    reason: string
    type?: 'increase' | 'decrease'
    reference?: string | null
    created_at: string
    warehouse: WarehouseType
    items_count?: number
}

interface PaginatedAdjustments {
    data: Adjustment[]
}

interface Filters {
    search?: string
    status?: string
}

interface IndexProps {
    adjustments: PaginatedAdjustments
    filters: Filters
}

// ─── Status Config ────────────────────────────────────────────────────────────

const statusConfig: Record<
    Adjustment['status'],
    { label: string; dot: string; cls: string; icon: React.ReactNode }
> = {
    draft: {
        label: 'Rascunho',
        dot: 'bg-[#E8A020]',
        cls: 'bg-[#E8A020]/10 text-[#E8A020]',
        icon: <Clock className="h-3 w-3" />,
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

function AdjStatusBadge({ status }: { status: Adjustment['status'] }) {
    const cfg = statusConfig[status] ?? statusConfig.draft
    return (
        <span className={cn('inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-[4px]', cfg.cls)}>
            <span className={cn('h-1.5 w-1.5 rounded-full flex-shrink-0', cfg.dot)} />
            {cfg.label}
        </span>
    )
}

function AdjTypeBadge({ type }: { type?: 'increase' | 'decrease' }) {
    if (!type) return <span className="text-slate-400 text-xs">—</span>
    return type === 'increase' ? (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-[4px] bg-[#2DB8A0]/10 text-[#2DB8A0]">
            <TrendingUp className="h-3 w-3" />
            Aumento
        </span>
    ) : (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-[4px] bg-red-50 text-red-600">
            <TrendingDown className="h-3 w-3" />
            Redução
        </span>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Index({ adjustments, filters }: IndexProps) {
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
        if (search === (filters?.search || '')) return
        const t = setTimeout(() => applyFilters({ newSearch: search }), 400)
        return () => clearTimeout(t)
    }, [search])

    function applyFilters(overrides: { newSearch?: string; newStatus?: string } = {}) {
        router.get('/inventory/adjustments', {
            search: overrides.newSearch !== undefined ? overrides.newSearch : search,
            status: overrides.newStatus !== undefined ? overrides.newStatus : status,
        }, { preserveState: true, replace: true })
    }

    const clearFilters = () => {
        setSearch('')
        setStatus('all')
        router.get('/inventory/adjustments', { search: '', status: 'all' }, {
            preserveState: true, replace: true,
        })
    }

    const hasFilters = search || status !== 'all'

    return (
        <>
            <Head title="Ajustes de Stock" />

            <div className="space-y-4 bg-slate-50 ">

                {/* PAGE HEADER */}
                <PageHeader
                    title="Ajustes de Stock"
                    subtitle="Controlo, inventariação e correções manuais de quantidades nos armazéns"
                    actions={
                        <Link href="/inventory/adjustments/create">
                            <PrimaryButton>
                                <Plus className="h-4 w-4" />
                                Novo Ajuste
                            </PrimaryButton>
                        </Link>
                    }
                />

                {/* FILTERS BAR */}
                <div className="bg-white border border-slate-200 rounded-[4px] shadow-xs px-4 py-3 flex flex-col sm:flex-row gap-3 items-center">
                    {/* Search */}
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Pesquisar motivo, referência ou ID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full h-9 pl-9 pr-3 text-sm bg-white border border-slate-200 rounded-[4px] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2DB8A0]/30 focus:border-[#2DB8A0]"
                        />
                    </div>

                    {/* Status pills */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {(['all', 'draft', 'completed', 'cancelled'] as const).map((s) => {
                            const isAll = s === 'all'
                            const active = status === s
                            const cfg = isAll ? null : statusConfig[s as Adjustment['status']]
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
                            onClick={clearFilters}
                            className="ml-auto flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors"
                        >
                            <FilterX className="h-3.5 w-3.5" />
                            Limpar Filtros
                        </button>
                    )}
                </div>

                {/* TABLE */}
                <TableCard>
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400 w-[120px]">
                                    Data
                                </th>
                                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                    Referência
                                </th>
                                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                    Armazém
                                </th>
                                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                    Motivo
                                </th>
                                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400 w-[110px]">
                                    Tipo
                                </th>
                                <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-400 w-[100px]">
                                    Total Itens
                                </th>
                                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400 w-[110px]">
                                    Estado
                                </th>
                                <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-400 w-[170px]">
                                    Acções
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {adjustments.data.length === 0 ? (
                                <tr>
                                    <td colSpan={8}>
                                        <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400">
                                            <AlertCircle className="h-10 w-10" />
                                            <p className="text-sm font-medium">
                                                Nenhum registo de ajuste encontrado{hasFilters ? ' com os filtros selecionados' : ''}.
                                            </p>
                                            {hasFilters && (
                                                <button
                                                    onClick={clearFilters}
                                                    className="text-xs text-[#2DB8A0] underline underline-offset-2"
                                                >
                                                    Limpar filtros
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                adjustments.data.map((a) => (
                                    <tr
                                        key={a.id}
                                        className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                                    >
                                        {/* DATA */}
                                        <td className="px-4 py-3 text-slate-500 text-xs tabular-nums whitespace-nowrap">
                                            {new Date(a.created_at).toLocaleDateString('pt-MZ', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                            })}
                                        </td>

                                        {/* REFERÊNCIA */}
                                        <td className="px-4 py-3">
                                            <Link
                                                href={`/inventory/adjustments/${a.id}`}
                                                className="font-mono text-[12px] font-semibold text-[#2DB8A0] hover:text-[#229c87] transition-colors"
                                            >
                                                {a.reference ?? `#${String(a.id).padStart(5, '0')}`}
                                            </Link>
                                        </td>

                                        {/* ARMAZÉM */}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                                                <Warehouse className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                                                {a.warehouse.name}
                                            </div>
                                        </td>

                                        {/* MOTIVO */}
                                        <td className="px-4 py-3 max-w-[220px]">
                                            <p
                                                className="text-slate-600 truncate text-xs"
                                                title={a.reason}
                                            >
                                                {a.reason}
                                            </p>
                                        </td>

                                        {/* TIPO */}
                                        <td className="px-4 py-3">
                                            <AdjTypeBadge type={a.type} />
                                        </td>

                                        {/* TOTAL ITENS */}
                                        <td className="px-4 py-3 text-right font-mono text-slate-700">
                                            {a.items_count ?? '—'}
                                        </td>

                                        {/* ESTADO */}
                                        <td className="px-4 py-3">
                                            <AdjStatusBadge status={a.status} />
                                        </td>

                                        {/* ACÇÕES */}
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                {/* View */}
                                                <Link
                                                    href={`/inventory/adjustments/${a.id}`}
                                                    className="inline-flex items-center gap-1.5 h-7 px-2.5 text-[11px] font-medium border border-slate-200 bg-white text-slate-700 rounded-[4px] hover:bg-slate-50 transition-colors"
                                                >
                                                    <FileText className="h-3 w-3" />
                                                    Detalhes
                                                </Link>

                                                {/* Draft actions */}
                                                {a.status === 'draft' && (
                                                    <>
                                                        <Link
                                                            href={`/inventory/adjustments/${a.id}/complete`}
                                                            method="post"
                                                            as="button"
                                                            className="inline-flex items-center gap-1.5 h-7 px-2.5 text-[11px] font-medium bg-[#2DB8A0]/10 border border-[#2DB8A0]/30 text-[#2DB8A0] rounded-[4px] hover:bg-[#2DB8A0]/20 transition-colors"
                                                        >
                                                            <Check className="h-3 w-3" />
                                                            Concluir
                                                        </Link>

                                                        <Link
                                                            href={`/inventory/adjustments/${a.id}/cancel`}
                                                            method="post"
                                                            as="button"
                                                            className="inline-flex items-center gap-1.5 h-7 px-2.5 text-[11px] font-medium bg-red-50 border border-red-200 text-red-600 rounded-[4px] hover:bg-red-100 transition-colors"
                                                        >
                                                            <Ban className="h-3 w-3" />
                                                            Cancelar
                                                        </Link>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </TableCard>
            </div>
        </>
    )
}

Index.layout = (page: any) => (
    <AppLayout breadcrumbs={[
        { title: 'Inventário', href: '#' },
        { title: 'Ajustes de Stock', href: '/inventory/adjustments' },
    ]}>
        {page}
    </AppLayout>
);