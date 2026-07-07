import { Head, Link } from '@inertiajs/react'
import { Eye, Layers, PackageSearch } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
    PageHeader,
    StockBadge,
    TableCard,
    PrimaryButton,
} from '@/components/ui/brand'

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
    product: Product
    warehouse: Warehouse
}

interface Props {
    stocks: Stock[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function resolveStockStatus(
    qty: number,
    minStock: number,
): 'in_stock' | 'low' | 'out_of_stock' {
    if (qty <= 0) return 'out_of_stock'
    if (qty <= minStock) return 'low'
    return 'in_stock'
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Index({ stocks }: Props) {
    return (
        <>
            <Head title="Stock Geral" />

            <div className="p-6 space-y-4 bg-slate-50 min-h-screen">

                {/* PAGE HEADER */}
                <PageHeader
                    title="Stock Geral"
                    subtitle="Visão consolidada de inventário distribuído por produto e armazém"
                    actions={
                        <Link href="/inventory/stocks/export">
                            <PrimaryButton>
                                <Layers className="h-4 w-4" />
                                Exportar
                            </PrimaryButton>
                        </Link>
                    }
                />

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
                            {stocks.length === 0 ? (
                                <tr>
                                    <td colSpan={8}>
                                        <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400">
                                            <PackageSearch className="h-10 w-10" />
                                            <p className="text-sm font-medium">Nenhum registo de stock encontrado no sistema.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                stocks.map((stock) => {
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
                                            <td className="px-4 py-3 text-slate-600">
                                                {stock.warehouse.name}
                                            </td>

                                            {/* QUANTIDADE */}
                                            <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900">
                                                {stock.quantity.toLocaleString('pt-MZ')}
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
                                                <StockBadge status={status} />
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
                </TableCard>
            </div>
        </>
    )
}