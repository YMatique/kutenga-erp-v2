import { Head, Link, router } from '@inertiajs/react'
import { useState, useEffect } from 'react'
// import { useDebounce } from '@/hooks/use-debounce' // Opcional, ou faça manual como abaixo

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
import { Eye, CheckCircle2, ArrowRightLeft, Search } from 'lucide-react'

// 1. Tipagem das Props para eliminar o 'any'
interface Warehouse {
    id: number
    name: string
}

interface Transfer {
    id: number
    from_warehouse: Warehouse
    to_warehouse: Warehouse
    status: 'pending' | 'approved' | 'completed' | 'cancelled'
}

interface PaginatedTransfers {
    data: Transfer[]
}

interface Filters {
    search?: string
    status?: string
}

interface IndexProps {
    transfers: PaginatedTransfers
    filters: Filters
}

// 2. Componente StatusBadge otimizado e traduzido
function StatusBadge({ status }: { status: Transfer['status'] }) {
    const config: Record<Transfer['status'], { label: string; className: string }> = {
        pending: { label: 'Pendente', className: 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-50' },
        approved: { label: 'Aprovado', className: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50' },
        completed: { label: 'Concluído', className: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-50' },
        cancelled: { label: 'Cancelado', className: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-50' },
    }

    const current = config[status] || { label: status, className: '' }

    return (
        <Badge variant="outline" className={`font-medium ${current.className}`}>
            {current.label}
        </Badge>
    )
}

export default function Index({ transfers, filters }: IndexProps) {
    const [search, setSearch] = useState(filters?.search || '')
    const [status, setStatus] = useState(filters?.status || 'all')

    // 3. Filtro inteligente: Submete automaticamente quando o status muda
    useEffect(() => {
        // Evita rodar na montagem inicial se os valores forem idênticos aos filtros da URL
        if (status !== (filters?.status || 'all')) {
            applyFilters({ newStatus: status })
        }
    }, [status])

    // Debounce manual para a pesquisa por texto (espera 400ms após o usuário parar de digitar)
    useEffect(() => {
        if (search === (filters?.search || '')) return

        const delayDebounceFn = setTimeout(() => {
            applyFilters({ newSearch: search })
        }, 400)

        return () => clearTimeout(delayDebounceFn)
    }, [search])

    function applyFilters(overrides: { newSearch?: string; newStatus?: string } = {}) {
        router.get('/inventory/transfers', {
            search: overrides.newSearch !== undefined ? overrides.newSearch : search,
            status: overrides.newStatus !== undefined ? overrides.newStatus : status,
        }, {
            preserveState: true,
            replace: true,
        })
    }

    return (
        <>
            <Head title="Transferências" />

            <div className="p-6 space-y-6 mx-auto">

                {/* HEADER */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                            Transferências
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Gestão de movimentação de stock entre armazéns
                        </p>
                    </div>

                    <Button asChild>
                        <Link href="/inventory/transfers/create">
                            Nova Transferência
                        </Link>
                    </Button>
                </div>

                {/* FILTERS */}
                <Card className="p-4 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-sm">
                    <div className="flex flex-1 flex-col sm:flex-row gap-3 w-full items-center">
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Pesquisar por ID ou armazém..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-8"
                            />
                        </div>

                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="w-full sm:w-48">
                                <SelectValue placeholder="Filtrar por Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os status</SelectItem>
                                <SelectItem value="pending">Pendentes</SelectItem>
                                <SelectItem value="approved">Aprovados</SelectItem>
                                <SelectItem value="completed">Concluídos</SelectItem>
                                <SelectItem value="cancelled">Cancelados</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Botão de limpar filtros opcional (aparece se houver algo filtrado) */}
                    {(search || status !== 'all') && (
                        <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => { setSearch(''); setStatus('all'); }}
                            className="text-muted-foreground hover:text-slate-900"
                        >
                            Limpar filtros
                        </Button>
                    )}
                </Card>

                {/* TABLE */}
                <Card className="overflow-hidden border shadow-sm">
                    <Table>
                        <TableHeader className="bg-slate-50/75">
                            <TableRow>
                                <TableHead className="w-[100px] font-semibold">ID</TableHead>
                                <TableHead className="font-semibold">Origem</TableHead>
                                <TableHead className="font-semibold">
                                    <div className="flex items-center gap-2">
                                        Destino
                                    </div>
                                </TableHead>
                                <TableHead className="font-semibold">Status</TableHead>
                                <TableHead className="text-right font-semibold">Ações</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {transfers.data.length === 0 ? (
                                /* 4. EMPTY STATE CASO NÃO ACHE NADA */
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                        Nenhuma transferência encontrada com os filtros aplicados.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                transfers.data.map((t) => (
                                    <TableRow key={t.id} className="hover:bg-slate-50/50 transition-colors">
                                        
                                        {/* ID */}
                                        <TableCell className="font-medium">
                                            <Link
                                                href={`/inventory/transfers/${t.id}`}
                                                className="text-blue-600 hover:text-blue-700 font-semibold"
                                            >
                                                #{t.id}
                                            </Link>
                                        </TableCell>

                                        {/* ORIGEM */}
                                        <TableCell className="text-slate-700 font-medium">
                                            {t.from_warehouse.name}
                                        </TableCell>

                                        {/* DESTINO */}
                                        <TableCell className="text-slate-700 font-medium">
                                            <div className="flex items-center gap-2">
                                                <ArrowRightLeft className="h-3 w-3 text-muted-foreground" />
                                                {t.to_warehouse.name}
                                            </div>
                                        </TableCell>

                                        {/* STATUS */}
                                        <TableCell>
                                            <StatusBadge status={t.status} />
                                        </TableCell>

                                        {/* AÇÕES COM COMPONENTES REAIS */}
                                        <TableCell className="text-right">
                                            <div className="flex justify-end items-center gap-1">
                                                
                                                <Button size="sm" variant="ghost" asChild>
                                                    <Link href={`/inventory/transfers/${t.id}`} title="Ver detalhes">
                                                        <Eye className="h-4 w-4 mr-1" />
                                                        Ver
                                                    </Link>
                                                </Button>

                                                {t.status === 'pending' && (
                                                    <Button size="sm" variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700" asChild>
                                                        <Link href={`/inventory/transfers/${t.id}/approve`} method="post" as="button">
                                                            Aprovar
                                                        </Link>
                                                    </Button>
                                                )}

                                                {t.status === 'approved' && (
                                                    <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700" asChild>
                                                        <Link href={`/inventory/transfers/${t.id}/complete`} method="post" as="button">
                                                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                                            Finalizar
                                                        </Link>
                                                    </Button>
                                                )}

                                                {t.status === 'completed' && (
                                                    <span className="text-xs font-medium text-emerald-600 px-3 py-1">
                                                        Concluído
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </Card>
            </div>
        </>
    )
}