import { useState } from 'react'
import { Link, usePage } from '@inertiajs/react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from '@/components/ui/card'

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table'

export default function Index() {
    const { warehouses } = usePage().props
    const [search, setSearch] = useState('')

    const filtered = warehouses.filter((w) =>
        (w.name + w.code)
            .toLowerCase()
            .includes(search.toLowerCase())
    )

    return (
        <div className="p-6 space-y-4">

            {/* HEADER */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-semibold">
                        Armazéns
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Gestão de armazenamento
                    </p>
                </div>

                <Button asChild>
                    <Link href="/inventory/warehouses/create">
                        Novo
                    </Link>
                </Button>
            </div>

            {/* SEARCH */}
            <div className="flex gap-2">
                <Input
                    placeholder="Pesquisar armazém..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-sm"
                />
            </div>

            {/* TABLE */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">
                        Lista de armazéns ({filtered.length})
                    </CardTitle>
                </CardHeader>

                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Código</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">
                                    Ações
                                </TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>

                            {filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                        Nenhum armazém encontrado
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filtered.map((w) => (
                                    <TableRow key={w.id}>
                                        <TableCell className="font-medium">
                                            {w.name}
                                        </TableCell>

                                        <TableCell>
                                            {w.code || '-'}
                                        </TableCell>

                                        <TableCell>
                                            {w.is_default ? 'Padrão' : 'Normal'}
                                        </TableCell>

                                        <TableCell className="text-right">
                                            <Button size="sm" variant="outline" asChild>
                                                <Link href={`/inventory/warehouses/${w.id}/edit`}>
                                                    Editar
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}

                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}