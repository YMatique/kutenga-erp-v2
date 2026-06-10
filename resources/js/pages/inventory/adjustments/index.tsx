import { Head, Link, router } from '@inertiajs/react'
import { useState, useEffect } from 'react'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { 
    Search, 
    Plus, 
    Landmark, 
    Calendar, 
    FileText, 
    Check, 
    Ban, 
    AlertCircle, 
    FilterX,
    ClipboardList
} from 'lucide-react'

// Interfaces estritas para garantir robustez de tipos
interface Warehouse {
    id: number
    name: string
}

interface Adjustment {
    id: number
    status: 'draft' | 'completed' | 'cancelled'
    reason: string
    created_at: string
    warehouse: Warehouse
}

interface PaginatedAdjustments {
    data: Adjustment[]
}

interface Filters {
    search?: string
    status?: string
}

interface IndexProps {
    adjustments: PaginatedAdjustments
    filters: Filters
}

function StatusBadge({ status }: { status: Adjustment['status'] }) {
    const map: Record<Adjustment['status'], string> = {
        draft: 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-50',
        completed: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-50',
        cancelled: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-50',
    }

    const label: Record<Adjustment['status'], string> = {
        draft: 'Rascunho',
        completed: 'Concluído',
        cancelled: 'Cancelado',
    }

    return (
        <Badge variant="outline" className={`font-semibold px-2 py-0.5 ${map[status]}`}>
            {label[status]}
        </Badge>
    )
}

export default function Index({ adjustments, filters }: IndexProps) {
    const [search, setSearch] = useState(filters?.search || '')
    const [status, setStatus] = useState(filters?.status || 'all')

    // Filtro instantâneo ao alterar a seleção do status
    useEffect(() => {
        if (status !== (filters?.status || 'all')) {
            applyFilters({ newStatus: status })
        }
    }, [status])

    // Debounce automático de 400ms para o input de pesquisa
    useEffect(() => {
        if (search === (filters?.search || '')) return

        const delayDebounce = setTimeout(() => {
            applyFilters({ newSearch: search })
        }, 400)

        return () => clearTimeout(delayDebounce)
    }, [search])

    function applyFilters(overrides: { newSearch?: string; newStatus?: string } = {}) {
        router.get('/inventory/adjustments', {
            search: overrides.newSearch !== undefined ? overrides.newSearch : search,
            status: overrides.newStatus !== undefined ? overrides.newStatus : status,
        }, {
            preserveState: true,
            replace: true,
        })
    }

    const clearFilters = () => {
        setSearch('')
        setStatus('all')
        router.get('/inventory/adjustments', {
            search: '',
            status: 'all',
        }, {
            preserveState: true,
            replace: true,
        })
    }

    return (
        <>
            <Head title="Ajustes de Stock" />

            <div className="p-6 space-y-6  mx-auto">

                {/* HEADER */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-5">
                    <div>
                        <div className="flex items-center gap-2">
                            <ClipboardList className="h-6 w-6 text-slate-700 dark:text-slate-300" />
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                Ajustes de Stock
                            </h1>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            Controlo, inventariação e correções manuais de quantidades nos armazéns
                        </p>
                    </div>

                    <Button className="gap-2 shadow-sm" asChild>
                        <Link href="/inventory/adjustments/create">
                            <Plus className="h-4 w-4" />
                            Novo Ajuste
                        </Link>
                    </Button>
                </div>

                {/* FILTROS OPERACIONAIS */}
                <Card className="p-4 flex flex-col md:flex-row gap-3 items-center justify-between shadow-xs">
                    <div className="flex flex-1 flex-col sm:flex-row gap-3 w-full items-center">
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                className="pl-9 h-10 bg-white dark:bg-zinc-900"
                                placeholder="Pesquisar motivo ou ID..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="w-full sm:w-48 h-10">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os status</SelectItem>
                                <SelectItem value="draft">Rascunho</SelectItem>
                                <SelectItem value="completed">Concluído</SelectItem>
                                <SelectItem value="cancelled">Cancelado</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Botão de limpar filtros opcional */}
                    {(search || status !== 'all') && (
                        <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={clearFilters}
                            className="text-muted-foreground hover:text-slate-950 dark:hover:text-white gap-1.5 self-end md:self-auto"
                        >
                            <FilterX className="h-4 w-4" />
                            Limpar Filtros
                        </Button>
                    )}
                </Card>

                {/* TABELA DE AJUSTES */}
                <Card className="shadow-xs overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-50/75 dark:bg-zinc-800/50">
                            <TableRow>
                                <TableHead className="w-[100px] font-semibold text-slate-700 dark:text-slate-300">ID</TableHead>
                                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Armazém</TableHead>
                                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Motivo</TableHead>
                                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Status</TableHead>
                                <TableHead className="font-semibold text-slate-700 dark:text-slate-300 w-[180px]">Criado em</TableHead>
                                <TableHead className="text-right font-semibold text-slate-700 dark:text-slate-300 w-[240px]">Ações</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {adjustments.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center gap-2.5">
                                            <AlertCircle className="h-8 w-8 text-slate-300 dark:text-slate-700" />
                                            <span className="text-sm font-medium">Nenhum registo de ajuste encontrado com os filtros selecionados.</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                adjustments.data.map((a) => (
                                    <TableRow key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                                        
                                        {/* ID */}
                                        <TableCell className="font-mono font-bold text-slate-900 dark:text-zinc-100">
                                            <Link
                                                href={`/inventory/adjustments/${a.id}`}
                                                className="text-blue-600 hover:text-blue-700"
                                            >
                                                #{a.id}
                                            </Link>
                                        </TableCell>

                                        {/* ARMAZÉM */}
                                        <TableCell className="font-medium text-slate-800 dark:text-zinc-200">
                                            <div className="flex items-center gap-1.5">
                                                <Landmark className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                                {a.warehouse.name}
                                            </div>
                                        </TableCell>

                                        {/* MOTIVO */}
                                        <TableCell className="text-slate-600 dark:text-zinc-400 max-w-[280px] truncate" title={a.reason}>
                                            {a.reason}
                                        </TableCell>

                                        {/* STATUS */}
                                        <TableCell>
                                            <StatusBadge status={a.status} />
                                        </TableCell>

                                        {/* DATA CRIADO */}
                                        <TableCell className="text-slate-500 text-sm">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                                {new Date(a.created_at).toLocaleDateString('pt-MZ', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric'
                                                })}
                                            </div>
                                        </TableCell>

                                        {/* BOTÕES DE AÇÕES */}
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <Button variant="ghost" size="sm" className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50/60" asChild>
                                                    <Link href={`/inventory/adjustments/${a.id}`}>
                                                        <FileText className="h-3.5 w-3.5 mr-1" />
                                                        Detalhes
                                                    </Link>
                                                </Button>

                                                {a.status === 'draft' && (
                                                    <>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            className="h-8 text-green-600 hover:text-green-700 hover:bg-green-50/60" 
                                                            asChild
                                                        >
                                                            <Link
                                                                href={`/inventory/adjustments/${a.id}/complete`}
                                                                method="post"
                                                                as="button"
                                                            >
                                                                <Check className="h-3.5 w-3.5 mr-1" />
                                                                Concluir
                                                            </Link>
                                                        </Button>

                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50/60" 
                                                            asChild
                                                        >
                                                            <Link
                                                                href={`/inventory/adjustments/${a.id}/cancel`}
                                                                method="post"
                                                                as="button"
                                                            >
                                                                <Ban className="h-3.5 w-3.5 mr-1" />
                                                                Cancelar
                                                            </Link>
                                                        </Button>
                                                    </>
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