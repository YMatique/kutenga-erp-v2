import { Head, Link } from '@inertiajs/react'
import { ArrowRight, Package, Landmark, Boxes, Ban, Check, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    product: Product
}

interface Transfer {
    id: number
    status: 'pending' | 'approved' | 'completed' | 'cancelled'
    from_warehouse: Warehouse
    to_warehouse: Warehouse
    items: TransferItem[]
}

interface ShowProps {
    transfer: Transfer
}

function StatusBadge({ status }: { status: Transfer['status'] }) {
    const map: Record<Transfer['status'], { label: string; className: string }> = {
        pending: { label: 'Pendente', className: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-200/30' },
        approved: { label: 'Aprovado', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200/30' },
        completed: { label: 'Concluído', className: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-200/30' },
        cancelled: { label: 'Cancelado', className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200/30' },
    }

    const current = map[status]

    return (
        <Badge variant="outline" className={`font-medium ${current.className}`}>
            {current.label}
        </Badge>
    )
}

export default function Show({ transfer }: ShowProps) {
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
                            <StatusBadge status={transfer.status} />
                        </div>

                        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                            {transfer.from_warehouse.name} 
                            <ArrowRight className="h-3 w-3 text-muted-foreground" /> 
                            {transfer.to_warehouse.name}
                        </p>
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
                                <TableHead className="text-right w-[150px]">Quantidade</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {transfer.items.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
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
                                        <TableCell className="text-right font-semibold text-foreground">
                                            {i.quantity}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* VISUAL FOOTER ACTIONS */}
                <div className="flex justify-end gap-3 pt-2">
                    
                    {/* CANCELAR */}
                    {['pending', 'approved'].includes(transfer.status) && (
                        <Button variant="destructive" className="gap-2" asChild>
                            <Link 
                                href={`/inventory/transfers/${transfer.id}/cancel`} 
                                method="post" 
                                as="button"
                            >
                                <Ban className="h-4 w-4" />
                                Cancelar Operação
                            </Link>
                        </Button>
                    )}

                    {/* APROVAR */}
                    {transfer.status === 'pending' && (
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

                    {/* FINALIZAR */}
                    {transfer.status === 'approved' && (
                        <Button className="bg-green-600 hover:bg-green-700 gap-2" asChild>
                            <Link 
                                href={`/inventory/transfers/${transfer.id}/complete`} 
                                method="post" 
                                as="button"
                            >
                                <Check className="h-4 w-4" />
                                Finalizar e Baixar Estoque
                            </Link>
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