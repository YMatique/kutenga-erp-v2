import { Head, Link, router } from '@inertiajs/react'
import { useState } from 'react'

import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

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

export default function Index({ transfers, filters }: any) {

    const [search, setSearch] = useState(filters?.search || '')
    const [status, setStatus] = useState(filters?.status || 'all')

    function applyFilters() {
        router.get('/inventory/transfers', {
            search,
            status
        }, {
            preserveState: true,
            replace: true
        })
    }

    return (
        <>
            <Head title="Transferências" />

            <div className="p-6 space-y-6">

                {/* HEADER */}
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-semibold">
                            Transferências
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Gestão de movimentação de stock entre armazéns
                        </p>
                    </div>

                    <Link href="/inventory/transfers/create">
                        <Button>
                            Nova Transferência
                        </Button>
                    </Link>
                </div>

                {/* FILTERS */}
                <Card className="p-4 flex gap-3 items-center">

                    <Input
                        placeholder="Pesquisar..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-64"
                    />

                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>

                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button onClick={applyFilters}>
                        Filtrar
                    </Button>

                </Card>

                {/* TABLE */}
                <Card>

                    <Table>

                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Origem</TableHead>
                                <TableHead>Destino</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">
                                    Ações
                                </TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>

                            {transfers.data.map((t: any) => (
                                <TableRow key={t.id}>

                                    {/* ID + DETALHES */}
                                    <TableCell>
                                        <div className="flex flex-col">

                                            <Link
                                                href={`/inventory/transfers/${t.id}`}
                                                className="font-medium text-blue-600 hover:underline"
                                            >
                                                #{t.id}
                                            </Link>

                                            <Link
                                                href={`/inventory/transfers/${t.id}`}
                                                className="text-xs text-muted-foreground hover:underline"
                                            >
                                                Ver detalhes
                                            </Link>

                                        </div>
                                    </TableCell>

                                    <TableCell>
                                        {t.from_warehouse.name}
                                    </TableCell>

                                    <TableCell>
                                        {t.to_warehouse.name}
                                    </TableCell>

                                    <TableCell>
                                        <StatusBadge status={t.status} />
                                    </TableCell>

                                    {/* AÇÕES */}
                                    <TableCell className="text-right space-x-2">

                                        {/* SEMPRE VER */}
                                        <Link
                                            href={`/inventory/transfers/${t.id}`}
                                            className="text-gray-600 hover:underline"
                                        >
                                            Ver
                                        </Link>

                                        {t.status === 'pending' && (
                                            <Link
                                                href={`/inventory/transfers/${t.id}/approve`}
                                                method="post"
                                                as="button"
                                                className="text-blue-600 hover:underline"
                                            >
                                                Aprovar
                                            </Link>
                                        )}

                                        {t.status === 'approved' && (
                                            <Link
                                                href={`/inventory/transfers/${t.id}/complete`}
                                                method="post"
                                                as="button"
                                                className="text-green-600 hover:underline"
                                            >
                                                Finalizar
                                            </Link>
                                        )}

                                        {t.status === 'completed' && (
                                            <span className="text-xs text-green-600">
                                                Concluído
                                            </span>
                                        )}

                                    </TableCell>

                                </TableRow>
                            ))}

                        </TableBody>

                    </Table>

                </Card>
            </div>
        </>
    )
}