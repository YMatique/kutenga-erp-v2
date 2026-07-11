import { Head, usePage } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout';
import { ArrowDownCircle, ArrowUpCircle, RefreshCw, Package2, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
    PageHeader,
    TableCard,
} from '@/components/ui/brand'

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
    const { movements } = usePage<{ movements: any }>().props

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
                            {movements?.data?.length ?? 0} movimentos
                        </div>
                    }
                />

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
                                            <p className="text-sm font-medium">Nenhum movimento de stock registado.</p>
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
                                            m.type === 'in' || m.type === 'opening'
                                                ? 'text-[#2DB8A0]'
                                                : m.type === 'out'
                                                    ? 'text-red-500'
                                                    : 'text-[#E8A020]'
                                        )}>
                                            {m.type === 'out' ? '-' : '+'}{m.quantity.toLocaleString('pt-MZ')}
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
                                                {m.user?.name ?? '—'}
                                            </span>
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

MovementsIndex.layout = (page: any) => (
    <AppLayout breadcrumbs={[
        { title: 'Inventário', href: '#' },
        { title: 'Movimentos', href: '/inventory/movements' },
    ]}>
        {page}
    </AppLayout>
);