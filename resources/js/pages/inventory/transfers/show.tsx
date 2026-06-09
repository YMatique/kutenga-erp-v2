import { Head, Link } from '@inertiajs/react'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'

function StatusBadge({ status }: { status: string }) {
    const map: Record<string, string> = {
        pending: 'bg-yellow-100 text-yellow-700',
        approved: 'bg-blue-100 text-blue-700',
        completed: 'bg-green-100 text-green-700',
        cancelled: 'bg-red-100 text-red-700',
    }

    return (
        <Badge className={map[status]}>
            {status}
        </Badge>
    )
}

export default function Show({ transfer }: any) {

    const totalItems = transfer.items?.length || 0
    const totalQty = transfer.items?.reduce(
        (sum: number, i: any) => sum + Number(i.quantity),
        0
    )

    return (
        <>
            <Head title={`Transferência #${transfer.id}`} />

            <div className="p-6 space-y-6">

                {/* HEADER */}
                <div className="flex justify-between items-start">

                    <div>
                        <h1 className="text-2xl font-semibold">
                            Transferência #{transfer.id}
                        </h1>

                        <p className="text-sm text-muted-foreground">
                            {transfer.from_warehouse.name} → {transfer.to_warehouse.name}
                        </p>
                    </div>

                    <StatusBadge status={transfer.status} />

                </div>

                {/* SUMMARY */}
                <Card className="p-4 grid grid-cols-3 gap-4">

                    <div>
                        <p className="text-xs text-muted-foreground">Origem</p>
                        <p className="font-medium">{transfer.from_warehouse.name}</p>
                    </div>

                    <div>
                        <p className="text-xs text-muted-foreground">Destino</p>
                        <p className="font-medium">{transfer.to_warehouse.name}</p>
                    </div>

                    <div>
                        <p className="text-xs text-muted-foreground">Itens</p>
                        <p className="font-medium">
                            {totalItems} linhas / {totalQty} unidades
                        </p>
                    </div>

                </Card>

                {/* ITEMS */}
                <Card>

                    <div className="p-4 border-b">
                        <h2 className="font-semibold">
                            Produtos da Transferência
                        </h2>
                    </div>

                    <Table>

                        <TableHeader>
                            <TableRow>
                                <TableHead>#</TableHead>
                                <TableHead>Produto</TableHead>
                                <TableHead className="text-right">Quantidade</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>

                            {transfer.items.map((i: any, index: number) => (
                                <TableRow key={i.id}>

                                    <TableCell className="text-muted-foreground">
                                        {index + 1}
                                    </TableCell>

                                    <TableCell className="font-medium">
                                        {i.product.name}
                                    </TableCell>

                                    <TableCell className="text-right font-semibold">
                                        {i.quantity}
                                    </TableCell>

                                </TableRow>
                            ))}

                        </TableBody>

                    </Table>

                </Card>

                {/* ACTIONS */}
                {/* ACTIONS */}
                <div className="flex justify-between items-center">

                    <Link href="/inventory/transfers">
                        <Button variant="outline">
                            Voltar
                        </Button>
                    </Link>

                    <div className="flex gap-2">

                        {/* CANCELAR */}
                        {['pending', 'approved'].includes(transfer.status) && (
                            <Link
                                href={`/inventory/transfers/${transfer.id}/cancel`}
                                method="post"
                                as="button"
                            >
                                <Button variant="destructive">
                                    Cancelar
                                </Button>
                            </Link>
                        )}

                        {/* APROVAR */}
                        {transfer.status === 'pending' && (
                            <Link
                                href={`/inventory/transfers/${transfer.id}/approve`}
                                method="post"
                                as="button"
                            >
                                <Button variant="secondary">
                                    Aprovar
                                </Button>
                            </Link>
                        )}

                        {/* FINALIZAR */}
                        {transfer.status === 'approved' && (
                            <Link
                                href={`/inventory/transfers/${transfer.id}/complete`}
                                method="post"
                                as="button"
                            >
                                <Button>
                                    Finalizar
                                </Button>
                            </Link>
                        )}

                    </div>

                </div>

            </div>
        </>
    )
}