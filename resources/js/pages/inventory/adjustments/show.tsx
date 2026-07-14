import { Head, Link } from '@inertiajs/react'
import { 
    ArrowLeft, 
    Check, 
    Ban, 
    Landmark, 
    TrendingUp, 
    TrendingDown, 
    Boxes, 
    ClipboardList,
    FileText,
    AlertCircle,
    History
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

import { PageHeader, KpiCard, TableCard, PrimaryButton, OutlineButton } from '@/components/ui/brand';
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import AppLayout from '@/layouts/app-layout';

// Interfaces estritas para tipagem do ecrã
interface Warehouse {
    id: number
    name: string
}

interface Product {
    id: number;
    name: string;
}

interface AdjustmentItem {
    id: number
    old_quantity: number
    new_quantity: number
    difference: number
    product: Product
}

interface AuditUser {
    id: number
    name: string
}

interface Adjustment {
    id: number
    status: 'draft' | 'completed' | 'cancelled'
    reason: string
    notes: string | null
    warehouse: Warehouse
    items: AdjustmentItem[]
    created_at: string
    completed_at: string | null
    cancelled_at: string | null
    creator: AuditUser | null
    completer: AuditUser | null
    canceller: AuditUser | null
}

interface ShowProps {
    adjustment: Adjustment
}

function StatusBadge({ status }: { status: Adjustment['status'] }) {
    const styles: Record<Adjustment['status'], string> = {
        draft: 'bg-yellow-50 text-yellow-700 border-yellow-200',
        completed: 'bg-green-50 text-green-700 border-green-200',
        cancelled: 'bg-red-50 text-red-700 border-red-200',
    }

    const labels: Record<Adjustment['status'], string> = {
        draft: 'Rascunho',
        completed: 'Concluído',
        cancelled: 'Cancelado',
    }

    return (
        <Badge variant="outline" className={`font-semibold px-2.5 py-0.5 ${styles[status]}`}>
            {labels[status]}
        </Badge>
    )
}

export default function Show({ adjustment }: ShowProps) {
    const totalIncrease = adjustment.items
        .filter((i) => i.difference > 0)
        .reduce((sum, i) => sum + Number(i.difference), 0)

    const totalDecrease = adjustment.items
        .filter((i) => i.difference < 0)
        .reduce((sum, i) => sum + Math.abs(Number(i.difference)), 0)

    return (
        <>
            <Head title={`Ajuste de Stock #${adjustment.id}`} />

            <div className="space-y-4 mx-auto">

                {/* CABEÇALHO */}
                <PageHeader
                    title={
                        <div className="flex items-center gap-3">
                            <span>Ajuste #{adjustment.id}</span>
                            <StatusBadge status={adjustment.status} />
                        </div>
                    }
                    subtitle={adjustment.warehouse.name}
                    actions={
                        <>
                            {adjustment.status === 'draft' && (
                                <>
                                    <PrimaryButton className="bg-green-600 hover:bg-green-700 h-9" asChild>
                                        <Link
                                            href={`/inventory/adjustments/${adjustment.id}/complete`}
                                            method="post"
                                            as="button"
                                        >
                                            <Check className="h-4 w-4" />
                                            Concluir Ajuste
                                        </Link>
                                    </PrimaryButton>

                                    <Button variant="destructive" className="gap-2 shadow-xs h-9 px-3.5 text-sm font-semibold rounded-[4px]" asChild>
                                        <Link
                                            href={`/inventory/adjustments/${adjustment.id}/cancel`}
                                            method="post"
                                            as="button"
                                        >
                                            <Ban className="h-4 w-4" />
                                            Cancelar
                                        </Link>
                                    </Button>
                                </>
                            )}

                            <OutlineButton asChild>
                                <Link href="/inventory/adjustments">
                                    <ArrowLeft className="h-4 w-4" />
                                    Voltar
                                </Link>
                            </OutlineButton>
                        </>
                    }
                />

                {/* PAINEL DE METRICAS E RESUMO */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KpiCard
                        label="Status Atual"
                        value={<StatusBadge status={adjustment.status} />}
                        icon={<ClipboardList className="h-4 w-4" />}
                        accent="slate"
                    />

                    <KpiCard
                        label="Itens Registados"
                        value={adjustment.items.length}
                        icon={<Boxes className="h-4 w-4" />}
                        accent="slate"
                    />

                    <KpiCard
                        label="Total de Aumentos"
                        value={`+${totalIncrease}`}
                        icon={<TrendingUp className="h-4 w-4" />}
                        accent="teal"
                    />

                    <KpiCard
                        label="Total de Reduções"
                        value={`-${totalDecrease}`}
                        icon={<TrendingDown className="h-4 w-4" />}
                        accent="red"
                    />
                </div>

                {/* INFORMAÇÕES ADICIONAIS E TIMELINE */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <div className="bg-white border border-slate-200 rounded-[4px] shadow-xs overflow-hidden h-full">
                            <div className="bg-slate-50 border-b border-slate-100 px-5 py-4">
                                <div className="flex items-center gap-2 text-slate-800">
                                    <FileText className="h-4 w-4 text-slate-500" />
                                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">Detalhes e Justificação</h2>
                                </div>
                            </div>
                            <div className="p-5 grid gap-4">
                                <div className="grid gap-1">
                                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Motivo de Ajuste</span>
                                    <p className="text-sm text-slate-800 font-medium bg-slate-50 p-3 rounded-[4px] border border-slate-100">
                                        {adjustment.reason || 'Nenhum motivo especificado.'}
                                    </p>
                                </div>

                                {adjustment.notes && (
                                    <div className="grid gap-1">
                                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Observações Operacionais</span>
                                        <p className="text-sm text-slate-750 bg-slate-50 p-3 rounded-[4px] border border-slate-100 whitespace-pre-wrap">
                                            {adjustment.notes}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-1">
                        <div className="bg-white border border-slate-200 rounded-[4px] shadow-xs overflow-hidden h-full">
                            <div className="bg-slate-50 border-b border-slate-100 px-5 py-4">
                                <div className="flex items-center gap-2 text-slate-800">
                                    <History className="h-4 w-4 text-slate-500" />
                                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">Histórico do Ajuste</h2>
                                </div>
                            </div>
                            <div className="p-5 pt-6 relative">
                                <div className="relative pl-6 border-l-2 border-slate-100 space-y-6">
                                    
                                    {/* EVENTO 1: CRIADO */}
                                    <div className="relative">
                                        <span className="absolute -left-[33px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-slate-100 ring-4 ring-white">
                                            <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                                        </span>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">🟡 Ajuste Criado</span>
                                            <span className="text-sm font-medium text-slate-800 mt-1">
                                                por {adjustment.creator?.name || 'Sistema'}
                                            </span>
                                            <span className="text-xs text-slate-400 mt-0.5 font-mono">
                                                {new Date(adjustment.created_at).toLocaleString('pt-PT')}
                                            </span>
                                        </div>
                                    </div>

                                    {/* EVENTO 2: CONCLUÍDO */}
                                    {adjustment.status === 'completed' && (
                                        <div className="relative">
                                            <span className="absolute -left-[33px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-green-50 ring-4 ring-white">
                                                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                            </span>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-semibold text-green-700 uppercase tracking-wider">🟢 Ajuste Concluído</span>
                                                <span className="text-sm font-medium text-slate-800 mt-1">
                                                    por {adjustment.completer?.name || 'Sistema'}
                                                </span>
                                                {adjustment.completed_at && (
                                                    <span className="text-xs text-slate-400 mt-0.5 font-mono">
                                                        {new Date(adjustment.completed_at).toLocaleString('pt-PT')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* EVENTO 3: CANCELADO */}
                                    {adjustment.status === 'cancelled' && (
                                        <div className="relative">
                                            <span className="absolute -left-[33px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-50 ring-4 ring-white">
                                                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                                            </span>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-semibold text-red-700 uppercase tracking-wider">🔴 Ajuste Cancelado</span>
                                                <span className="text-sm font-medium text-slate-800 mt-1">
                                                    por {adjustment.canceller?.name || 'Sistema'}
                                                </span>
                                                {adjustment.cancelled_at && (
                                                    <span className="text-xs text-slate-400 mt-0.5 font-mono">
                                                        {new Date(adjustment.cancelled_at).toLocaleString('pt-PT')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* AGUARDANDO */}
                                    {adjustment.status === 'draft' && (
                                        <div className="relative">
                                            <span className="absolute -left-[33px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-yellow-50 ring-4 ring-white">
                                                <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 animate-pulse" />
                                            </span>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-semibold text-yellow-600 uppercase tracking-wider">⏳ Em Processamento</span>
                                                <span className="text-xs text-slate-500 mt-1">
                                                    Este ajuste ainda é um rascunho e aguarda conclusão para atualizar os estoques.
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* LISTAGEM DOS PRODUTOS DA TABELA */}
                <TableCard>
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2 text-slate-800">
                        <Boxes className="h-4 w-4 text-slate-400" />
                        <h2 className="text-sm font-bold uppercase tracking-wider">Produtos Afetados</h2>
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50 border-b border-slate-100 hover:bg-slate-50">
                                <TableHead className="uppercase text-[10px] tracking-wider text-slate-400 font-semibold">Produto</TableHead>
                                <TableHead className="uppercase text-[10px] tracking-wider text-slate-400 font-semibold w-[150px]">Stock Anterior</TableHead>
                                <TableHead className="uppercase text-[10px] tracking-wider text-slate-400 font-semibold w-[150px]">Novo Stock</TableHead>
                                <TableHead className="uppercase text-[10px] tracking-wider text-slate-400 font-semibold text-right w-[150px]">Diferença</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {adjustment.items.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-32 text-center text-muted-foreground text-sm">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <AlertCircle className="h-5 w-5 text-slate-300" />
                                            <span>Nenhum item associado a este ajuste.</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                adjustment.items.map((item) => (
                                    <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100">
                                        {/* PRODUTO */}
                                        <TableCell className="font-medium text-slate-900 py-3.5">
                                            {item.product.name}
                                        </TableCell>

                                        {/* STOCK ANTERIOR */}
                                        <TableCell className="font-mono text-slate-600 text-sm">
                                            {item.old_quantity}
                                        </TableCell>

                                        {/* NOVO STOCK */}
                                        <TableCell className="font-mono text-slate-900 text-sm font-semibold">
                                            {item.new_quantity}
                                        </TableCell>

                                        {/* DIFERENÇA CORES INDICATIVAS */}
                                        <TableCell className="text-right">
                                            {item.difference > 0 ? (
                                                <Badge variant="outline" className="text-green-700 border-green-100 bg-green-50/60 font-mono text-xs font-semibold px-2 py-0.5">
                                                    +{item.difference}
                                                </Badge>
                                            ) : item.difference < 0 ? (
                                                <Badge variant="outline" className="text-red-700 border-red-100 bg-red-50/60 font-mono text-xs font-semibold px-2 py-0.5">
                                                    {item.difference}
                                                </Badge>
                                            ) : (
                                                <span className="text-slate-400 font-mono text-xs">
                                                    Sem alteração
                                                </span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableCard>

            </div>
        </>
    );
}

Show.layout = (page: any) => (
    <AppLayout breadcrumbs={[
        { title: 'Inventário', href: '#' },
        { title: 'Ajustes de Stock', href: '/inventory/adjustments' },
        { title: `Ajuste #${page.props?.adjustment?.id ?? ''}` },
    ]}>
        {page}
    </AppLayout>
);