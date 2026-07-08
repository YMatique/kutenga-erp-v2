import { useState } from 'react'
import { Head, Link, usePage } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout';
import {
    Warehouse,
    MapPin,
    Package,
    Boxes,
    Search,
    Plus,
    Pencil,
    Star,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
    PageHeader,
    TableCard,
    PrimaryButton,
    OutlineButton,
    KpiCard,
} from '@/components/ui/brand'

// ─── Types ───────────────────────────────────────────────────────────────────

interface WarehouseItem {
    id: number
    name: string
    code?: string | null
    location?: string | null
    is_default?: boolean
    products_count?: number
    total_quantity?: number
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Index() {
    const { warehouses } = usePage<{ warehouses: WarehouseItem[] }>().props
    const [search, setSearch] = useState('')

    const filtered = (warehouses ?? []).filter((w) =>
        (w.name + (w.code ?? '') + (w.location ?? ''))
            .toLowerCase()
            .includes(search.toLowerCase())
    )

    // KPI aggregates
    const totalWarehouses = warehouses?.length ?? 0
    const totalProducts = (warehouses ?? []).reduce((s, w) => s + (w.products_count ?? 0), 0)
    const totalQty = (warehouses ?? []).reduce((s, w) => s + (w.total_quantity ?? 0), 0)
    const defaultWarehouse = (warehouses ?? []).find((w) => w.is_default)

    return (
        <>
            <Head title="Armazéns" />

            <div className="p-6 space-y-4 bg-slate-50 min-h-screen">

                {/* PAGE HEADER */}
                <PageHeader
                    title="Armazéns"
                    subtitle="Gestão de armazéns e localizações de inventário"
                    actions={
                        <Link href="/inventory/warehouses/create">
                            <PrimaryButton>
                                <Plus className="h-4 w-4" />
                                Novo Armazém
                            </PrimaryButton>
                        </Link>
                    }
                />

                {/* KPI STRIP */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <KpiCard
                        label="Total de Armazéns"
                        value={totalWarehouses}
                        icon={<Warehouse className="h-5 w-5" />}
                        accent="teal"
                    />
                    <KpiCard
                        label="Produtos Cadastrados"
                        value={totalProducts}
                        icon={<Package className="h-5 w-5" />}
                        accent="gold"
                    />
                    <KpiCard
                        label="Unidades em Stock"
                        value={totalQty.toLocaleString('pt-MZ')}
                        icon={<Boxes className="h-5 w-5" />}
                        accent="slate"
                    />
                    <KpiCard
                        label="Armazém Padrão"
                        value={defaultWarehouse?.name ?? '—'}
                        icon={<Star className="h-5 w-5" />}
                        accent="gold"
                    />
                </div>

                {/* WAREHOUSE GRID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {(warehouses ?? []).map((w) => (
                        <div
                            key={w.id}
                            className="bg-white border border-slate-200 rounded-[4px] shadow-xs p-5 flex flex-col gap-3 hover:border-[#2DB8A0]/40 hover:shadow-sm transition-all"
                        >
                            {/* Card header */}
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="h-8 w-8 rounded-[4px] bg-[#2DB8A0]/10 flex items-center justify-center flex-shrink-0">
                                        <Warehouse className="h-4 w-4 text-[#2DB8A0]" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-slate-900 truncate">{w.name}</p>
                                        {w.code && (
                                            <p className="text-[11px] font-mono text-slate-400">{w.code}</p>
                                        )}
                                    </div>
                                </div>
                                {w.is_default && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-[#E8A020]/10 text-[#E8A020] px-2 py-0.5 rounded-[4px] flex-shrink-0">
                                        <Star className="h-2.5 w-2.5" />
                                        Padrão
                                    </span>
                                )}
                            </div>

                            {/* Location */}
                            {w.location && (
                                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                    <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                                    <span className="truncate">{w.location}</span>
                                </div>
                            )}

                            {/* Stats row */}
                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                                <div>
                                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Produtos</p>
                                    <p className="text-lg font-bold text-slate-900 mt-0.5">{w.products_count ?? 0}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Qtd Total</p>
                                    <p className="text-lg font-bold text-[#2DB8A0] mt-0.5">{(w.total_quantity ?? 0).toLocaleString('pt-MZ')}</p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 pt-1">
                                <Link
                                    href={`/inventory/warehouses/${w.id}/edit`}
                                    className="inline-flex items-center gap-1.5 h-7 px-2.5 text-[11px] font-medium border border-slate-200 bg-white text-slate-700 rounded-[4px] hover:bg-slate-50 hover:border-slate-300 transition-colors"
                                >
                                    <Pencil className="h-3 w-3" />
                                    Editar
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>

                {/* SEARCH + TABLE */}
                <div className="space-y-3">
                    {/* Search bar */}
                    <div className="flex items-center gap-3">
                        <div className="relative max-w-xs w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Pesquisar armazém..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full h-9 pl-9 pr-3 text-sm bg-white border border-slate-200 rounded-[4px] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2DB8A0]/30 focus:border-[#2DB8A0]"
                            />
                        </div>
                        <p className="text-xs text-slate-400">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</p>
                    </div>

                    {/* Table */}
                    <TableCard>
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                        Nome
                                    </th>
                                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                        Código
                                    </th>
                                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                        Localização
                                    </th>
                                    <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                        Produtos
                                    </th>
                                    <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                        Qtd Total
                                    </th>
                                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400 w-[90px]">
                                        Estado
                                    </th>
                                    <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-400 w-[80px]">
                                        Ações
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={7}>
                                            <div className="flex flex-col items-center justify-center gap-3 py-14 text-slate-400">
                                                <Warehouse className="h-9 w-9" />
                                                <p className="text-sm font-medium">Nenhum armazém encontrado.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((w) => (
                                        <tr
                                            key={w.id}
                                            className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                                        >
                                            {/* NOME */}
                                            <td className="px-4 py-3 font-medium text-slate-900">
                                                <div className="flex items-center gap-2">
                                                    {w.name}
                                                    {w.is_default && (
                                                        <Star className="h-3 w-3 text-[#E8A020]" />
                                                    )}
                                                </div>
                                            </td>

                                            {/* CÓDIGO */}
                                            <td className="px-4 py-3">
                                                <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-[4px]">
                                                    {w.code ?? '—'}
                                                </span>
                                            </td>

                                            {/* LOCALIZAÇÃO */}
                                            <td className="px-4 py-3 text-slate-500 text-xs">
                                                {w.location ? (
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="h-3 w-3" />
                                                        {w.location}
                                                    </span>
                                                ) : '—'}
                                            </td>

                                            {/* PRODUTOS */}
                                            <td className="px-4 py-3 text-right font-mono text-slate-700">
                                                {w.products_count ?? 0}
                                            </td>

                                            {/* QTD TOTAL */}
                                            <td className="px-4 py-3 text-right font-mono font-semibold text-[#2DB8A0]">
                                                {(w.total_quantity ?? 0).toLocaleString('pt-MZ')}
                                            </td>

                                            {/* ESTADO */}
                                            <td className="px-4 py-3">
                                                <span className={cn(
                                                    'inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-[4px]',
                                                    w.is_default
                                                        ? 'bg-[#E8A020]/10 text-[#E8A020]'
                                                        : 'bg-slate-100 text-slate-500'
                                                )}>
                                                    <span className={cn(
                                                        'h-1.5 w-1.5 rounded-full',
                                                        w.is_default ? 'bg-[#E8A020]' : 'bg-slate-400'
                                                    )} />
                                                    {w.is_default ? 'Padrão' : 'Normal'}
                                                </span>
                                            </td>

                                            {/* AÇÕES */}
                                            <td className="px-4 py-3 text-right">
                                                <Link
                                                    href={`/inventory/warehouses/${w.id}/edit`}
                                                    className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium border border-slate-200 bg-white text-slate-700 rounded-[4px] hover:bg-slate-50 hover:border-slate-300 transition-colors"
                                                >
                                                    <Pencil className="h-3 w-3" />
                                                    Editar
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </TableCard>
                </div>
            </div>
        </>
    )
}

Index.layout = (page: any) => (
    <AppLayout breadcrumbs={[
        { title: 'Inventário', href: '#' },
        { title: 'Armazéns', href: '/inventory/warehouses' },
    ]}>
        {page}
    </AppLayout>
);