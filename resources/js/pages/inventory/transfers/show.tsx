import { Head, Link, router } from '@inertiajs/react'
import { ArrowRight, Package, Landmark, Boxes, Ban, Check, ShieldCheck, Truck, Undo2 } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import AppLayout from '@/layouts/app-layout';


// 1. Tipagem estruturada para o autocompletar do editor
interface Warehouse {
    id: number
    name: string
}

interface Product {
    id: number
    name: string
}

interface TransferItem {
    id: number
    quantity: number
    received_quantity?: number | null
    shortage_action?: 'loss' | 'return' | null
    /** O que ainda vem a caminho deste produto (enviado menos o que já chegou). */
    remaining?: number
    available?: number
    product: Product
}

interface Transfer {
    id: number
    status: 'pending' | 'approved' | 'in_transit' | 'completed' | 'cancelled'
    shipped_at?: string | null
    received_at?: string | null
    from_warehouse: Warehouse
    to_warehouse: Warehouse
    items: TransferItem[]
}

interface ShowProps {
    transfer: Transfer
    can: { transfer: boolean; receive: boolean }
}

function StatusBadge({ status, partial = false }: { status: Transfer['status']; partial?: boolean }) {
    const map: Record<Transfer['status'], { label: string; className: string }> = {
        pending: { label: 'Pendente', className: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-200/30' },
        approved: { label: 'Aprovado', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200/30' },
        in_transit: { label: 'Em trânsito', className: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200/30' },
        completed: { label: 'Concluído', className: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-200/30' },
        cancelled: { label: 'Cancelado', className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200/30' },
    }

    const current = status === 'in_transit' && partial ? { ...map.in_transit, label: 'Parcialmente recebida' } : map[status]

    return (
        <Badge variant="outline" className={`font-medium ${current.className}`}>
            {current.label}
        </Badge>
    )
}

const formatMoment = (value?: string | null) =>
    value ? new Date(value).toLocaleString('pt-MZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : null

export default function Show({ transfer, can }: ShowProps) {
    const inProgress = ['pending', 'approved'].includes(transfer.status)
    const inTransit = transfer.status === 'in_transit'
    const hasReceipt = transfer.items?.some((i) => i.received_quantity !== null && i.received_quantity !== undefined)

    // Já houve receções (ou diferenças resolvidas): a transferência está recebida em parte
    const partial = inTransit && transfer.items.some((i) => Number(i.received_quantity ?? 0) > 0 || i.shortage_action)

    // O que falta chegar de cada produto (enviado menos o que já chegou); resolvido, não falta nada
    const left = (item: TransferItem) => Number(item.remaining ?? item.quantity)

    // O que chega agora de cada produto (por omissão, tudo o que ainda falta)
    const defaults = () => Object.fromEntries(transfer.items.map((i) => [i.id, String(left(i))]))
    const [received, setReceived] = useState<Record<number, string>>(defaults)
    // O destino do que continuar em falta: ainda a caminho (por omissão, não destrói nada), perda ou devolução à origem
    const [shortage, setShortage] = useState<Record<number, 'pending' | 'loss' | 'return'>>({})
    const [receiving, setReceiving] = useState(false)

    // Depois de cada receção a página traz o que falta atualizado: recomeça-se daí
    const progress = transfer.items.map((i) => [i.id, i.remaining, i.shortage_action]).join('|')
    const [seenProgress, setSeenProgress] = useState(progress)

    if (seenProgress !== progress) {
        setSeenProgress(progress)
        setReceived(defaults())
        setShortage({})
    }

    // O que continuaria em falta se se registasse o que está escrito
    const missing = (item: TransferItem) => left(item) - (Number(received[item.id]) || 0)

    const confirmReceipt = () => {
        setReceiving(true)
        router.post(
            '/inventory/transfers/' + transfer.id + '/receive',
            {
                received: Object.fromEntries(Object.entries(received).map(([id, value]) => [id, Number(value) || 0])),
                // Só dos produtos a que ainda falta alguma coisa
                shortage: Object.fromEntries(
                    transfer.items.filter((i) => missing(i) > 0).map((i) => [i.id, shortage[i.id] ?? 'pending']),
                ),
            },
            { preserveScroll: true, onFinish: () => setReceiving(false) },
        )
    }

    const shippedAt = formatMoment(transfer.shipped_at)
    const receivedAt = formatMoment(transfer.received_at)
    const totalItems = transfer.items?.length || 0
    const totalQty = transfer.items?.reduce(
        (sum: number, i) => sum + Number(i.quantity),
        0
    ) || 0

    return (
        <>
            <Head title={`Transferência #${transfer.id}`} />

            <div className="space-y-6  mx-auto">

                {/* HEADER */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-5">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-foreground">
                                Transferência #{transfer.id}
                            </h1>
                            <StatusBadge status={transfer.status} partial={partial} />
                        </div>

                        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                            {transfer.from_warehouse.name} 
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            {transfer.to_warehouse.name}
                        </p>

                        {(shippedAt || receivedAt) && (
                            <p className="text-xs text-muted-foreground mt-1">
                                {shippedAt && <>Enviada em {shippedAt}</>}
                                {shippedAt && receivedAt && ' · '}
                                {receivedAt && <>Recebida em {receivedAt}</>}
                            </p>
                        )}
                    </div>

                    <Button variant="outline" size="sm" asChild>
                        <Link href="/inventory/transfers">
                            Voltar para a listagem
                        </Link>
                    </Button>
                </div>

                {/* SUMMARY METRICS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-card border border-border rounded-[4px] flex items-center p-4 gap-4 shadow-xs">
                        <div className="p-2 bg-muted rounded-lg text-muted-foreground">
                            <Landmark className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Origem</p>
                            <p className="font-semibold text-foreground">{transfer.from_warehouse.name}</p>
                        </div>
                    </div>

                    <div className="bg-card border border-border rounded-[4px] flex items-center p-4 gap-4 shadow-xs">
                        <div className="p-2 bg-muted rounded-lg text-muted-foreground">
                            <Package className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Destino</p>
                            <p className="font-semibold text-foreground">{transfer.to_warehouse.name}</p>
                        </div>
                    </div>

                    <div className="bg-card border border-border rounded-[4px] flex items-center p-4 gap-4 shadow-xs">
                        <div className="p-2 bg-muted rounded-lg text-muted-foreground">
                            <Boxes className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Geral</p>
                            <p className="font-semibold text-foreground">
                                {totalItems} {totalItems === 1 ? 'item' : 'itens'} / {totalQty} un.
                            </p>
                        </div>
                    </div>
                </div>

                {/* ITEMS TABLE */}
                <div className="bg-card border border-border rounded-[4px] shadow-xs overflow-hidden">
                    <div className="bg-muted/30 border-b border-border px-5 py-4">
                        <h2 className="text-base font-semibold text-foreground">
                            Produtos da Transferência
                        </h2>
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px]">#</TableHead>
                                <TableHead>Produto</TableHead>
                                {inProgress && <TableHead className="text-right w-[170px]">Disponível na origem</TableHead>}
                                <TableHead className="text-right w-[150px]">{inTransit || hasReceipt ? 'Enviada' : 'Quantidade'}</TableHead>
                                {inTransit && partial && <TableHead className="text-right w-[130px]">Já recebida</TableHead>}
                                {inTransit && <TableHead className="text-right w-[210px]">{can.receive ? 'Recebida agora' : 'Falta receber'}</TableHead>}
                                {!inTransit && hasReceipt && <TableHead className="text-right w-[210px]">Recebida</TableHead>}
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {transfer.items.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                        Nenhum produto adicionado nesta transferência.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                transfer.items.map((i, index) => (
                                    <TableRow key={i.id} className="hover:bg-muted/50">
                                        <TableCell className="text-muted-foreground font-mono">
                                            {String(index + 1).padStart(2, '0')}
                                        </TableCell>
                                        <TableCell className="font-medium text-foreground">
                                            {i.product.name}
                                        </TableCell>
                                        {inProgress && (
                                            <TableCell
                                                className={`text-right font-mono ${Number(i.available ?? 0) >= Number(i.quantity) ? 'text-[#2DB8A0]' : 'text-red-500'}`}
                                            >
                                                {Number(i.available ?? 0).toLocaleString('pt-MZ')}
                                            </TableCell>
                                        )}
                                        <TableCell className="text-right font-semibold text-foreground">
                                            {i.quantity}
                                        </TableCell>
                                        {inTransit && partial && (
                                            <TableCell className="text-right font-mono text-muted-foreground">
                                                {Number(i.received_quantity ?? 0)}
                                            </TableCell>
                                        )}
                                        {inTransit && (
                                            <TableCell className="text-right">
                                                {left(i) === 0 ? (
                                                    <span className="text-xs text-muted-foreground">
                                                        {i.shortage_action === 'loss' ? 'fechado: perda' : i.shortage_action === 'return' ? 'fechado: devolvido à origem' : 'completo'}
                                                    </span>
                                                ) : !can.receive ? (
                                                    <span className="text-xs text-muted-foreground">aguarda receção ({left(i)})</span>
                                                ) : (
                                                    <div className="flex flex-col items-end gap-1">
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            max={left(i)}
                                                            step="any"
                                                            value={received[i.id] ?? ''}
                                                            onChange={(e) => setReceived((previous) => ({ ...previous, [i.id]: e.target.value }))}
                                                            className="h-8 w-28 text-right"
                                                            aria-label={'Quantidade recebida agora de ' + i.product.name}
                                                        />
                                                        {/* O que fazer ao que continuar em falta: só aparece quando chega menos do que ainda faltava */}
                                                        {missing(i) > 0 && (
                                                            <select
                                                                value={shortage[i.id] ?? 'pending'}
                                                                onChange={(e) => setShortage((previous) => ({ ...previous, [i.id]: e.target.value as 'pending' | 'loss' | 'return' }))}
                                                                aria-label={'Destino da diferença de ' + i.product.name}
                                                                className="h-7 rounded-[4px] border border-border bg-background px-1.5 text-xs text-foreground"
                                                            >
                                                                <option value="pending">Faltam {missing(i)}: ainda vêm a caminho</option>
                                                                <option value="loss">Faltam {missing(i)}: dar como perda</option>
                                                                <option value="return">Faltam {missing(i)}: devolver à origem</option>
                                                            </select>
                                                        )}
                                                    </div>
                                                )}
                                            </TableCell>
                                        )}
                                        {!inTransit && hasReceipt && (
                                            <TableCell className="text-right">
                                                <span
                                                    className={Number(i.received_quantity ?? 0) < Number(i.quantity)
                                                        ? 'font-semibold text-red-600 dark:text-red-400'
                                                        : 'font-semibold text-foreground'}
                                                >
                                                    {i.received_quantity ?? '—'}
                                                    {Number(i.received_quantity ?? 0) < Number(i.quantity) && (
                                                        <span className="ml-1 text-xs font-normal">
                                                            (falta {Number(i.quantity) - Number(i.received_quantity ?? 0)}
                                                            {i.shortage_action === 'return' ? ' · devolvida à origem' : i.shortage_action === 'loss' ? ' · perda' : ''})
                                                        </span>
                                                    )}
                                                </span>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* VISUAL FOOTER ACTIONS */}
                <div className="flex justify-end gap-3 pt-2">
                    
                    {/* CANCELAR */}
                    {can.transfer && ['pending', 'approved', 'in_transit'].includes(transfer.status) && !partial && (
                        <Button variant="destructive" className="gap-2" asChild>
                            <Link
                                href={`/inventory/transfers/${transfer.id}/cancel`}
                                method="post"
                                as="button"
                                title={inTransit ? 'Cancela a transferência e devolve a mercadoria à origem' : undefined}
                            >
                                {inTransit ? <Undo2 className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                                {inTransit ? 'Devolver à origem' : 'Cancelar Operação'}
                            </Link>
                        </Button>
                    )}

                    {/* APROVAR */}
                    {can.transfer && transfer.status === 'pending' && (
                        <Button variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-900/50 dark:hover:bg-blue-950/20 gap-2" asChild>
                            <Link 
                                href={`/inventory/transfers/${transfer.id}/approve`} 
                                method="post" 
                                as="button"
                            >
                                <ShieldCheck className="h-4 w-4" />
                                Aprovar Transferência
                            </Link>
                        </Button>
                    )}

                    {/* ENVIAR: a mercadoria sai da origem e fica em trânsito até ser recebida */}
                    {can.transfer && transfer.status === 'approved' && (
                        <Button variant="outline" className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 dark:text-indigo-400 dark:border-indigo-900/50 dark:hover:bg-indigo-950/20 gap-2" asChild>
                            <Link
                                href={`/inventory/transfers/${transfer.id}/ship`}
                                method="post"
                                as="button"
                                title="A mercadoria sai da origem e fica em trânsito até ser recebida no destino"
                            >
                                <Truck className="h-4 w-4" />
                                Enviar (em trânsito)
                            </Link>
                        </Button>
                    )}

                    {/* CONCLUIR DE IMEDIATO: para armazéns no mesmo local, sai e entra no mesmo momento */}
                    {can.transfer && transfer.status === 'approved' && (
                        <Button className="bg-green-600 hover:bg-green-700 gap-2" asChild>
                            <Link
                                href={`/inventory/transfers/${transfer.id}/complete`}
                                method="post"
                                as="button"
                                title="Sai da origem e entra no destino no mesmo momento"
                            >
                                <Check className="h-4 w-4" />
                                Concluir de imediato
                            </Link>
                        </Button>
                    )}

                    {/* RECEBER: confirma o que chegou ao destino (por omissão, tudo o que foi enviado) */}
                    {inTransit && can.receive && (
                        <Button className="bg-green-600 hover:bg-green-700 gap-2" onClick={confirmReceipt} disabled={receiving}>
                            <Check className="h-4 w-4" />
                            {receiving ? 'A registar...' : partial ? 'Registar nova receção' : 'Confirmar receção'}
                        </Button>
                    )}
                </div>

            </div>
        </>
    )
}

Show.layout = (page: any) => (
    <AppLayout breadcrumbs={[
        { title: 'Inventário', href: '#' },
        { title: 'Transferências de Stock', href: '/inventory/transfers' },
        { title: `Transferência #${page.props?.transfer?.id ?? ''}`, href: '#' },
    ]}>
        {page}
    </AppLayout>
);