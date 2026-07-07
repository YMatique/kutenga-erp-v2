import React, { useCallback } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Eye, Search, Filter, X, ReceiptText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table, TableBody, TableCell, TableHead,
    TableHeader, TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from '@/components/ui/select';

interface Document {
    id: number;
    document_number: string | null;
    document_type: string;
    issue_date: string;
    due_date: string;
    customer_name: string;
    customer_nuit: string;
    status: string;
    payment_status: string | null;
    grand_total: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatedDocuments {
    data: Document[];
    current_page: number;
    last_page: number;
    total: number;
    links: PaginationLink[];
}

interface Filters {
    search?: string;
    status?: string;
}

interface Props {
    documents: PaginatedDocuments;
    filters: Filters;
    type: string;
    title: string;
    createHref: string;
    showHrefPrefix: string;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
    draft:     { label: 'Rascunho',   className: 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700' },
    confirmed: { label: 'Confirmado', className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' },
    paid:      { label: 'Pago',       className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800' },
    partial:   { label: 'Parcial',    className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800' },
    cancelled: { label: 'Cancelado',  className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800' },
    overdue:   { label: 'Em Atraso',  className: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800' },
};

function StatusBadge({ status }: { status: string }) {
    const config = STATUS_CONFIG[status] ?? { label: status, className: '' };
    return (
        <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${config.className}`}>
            {config.label}
        </span>
    );
}

export default function DocumentList({ documents, filters, type, title, createHref, showHrefPrefix }: Props) {
    const [search, setSearch] = React.useState(filters.search ?? '');
    const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const applyFilter = useCallback((params: Partial<Filters>) => {
        router.get(
            showHrefPrefix,
            { ...filters, ...params },
            { preserveState: true, replace: true }
        );
    }, [filters, showHrefPrefix]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearch(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            applyFilter({ search: value });
        }, 400);
    };

    const clearFilters = () => {
        setSearch('');
        router.get(showHrefPrefix, {}, { preserveState: false });
    };

    const hasActiveFilters = filters.search || (filters.status && filters.status !== 'all');

    return (
        <>
            <Head title={title} />

            {/* Page Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30">
                        <ReceiptText className="text-blue-600 dark:text-blue-400" size={20} />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                            {title}
                        </h1>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            {documents.total} registo{documents.total !== 1 ? 's' : ''} encontrado{documents.total !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>
                <Link href={createHref}>
                    <Button className="gap-2">
                        <Plus size={16} />
                        Novo Registo
                    </Button>
                </Link>
            </div>

            {/* Filters */}
            <Card className="mb-4">
                <CardContent className="pt-4 pb-4">
                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                        <div className="relative flex-1 min-w-0">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={15} />
                            <Input
                                id="search-documents"
                                className="pl-9"
                                placeholder="Pesquisar por número, cliente ou NUIT…"
                                value={search}
                                onChange={handleSearchChange}
                            />
                        </div>

                        <Select
                            value={filters.status ?? 'all'}
                            onValueChange={(v) => applyFilter({ status: v })}
                        >
                            <SelectTrigger className="w-[160px]" id="filter-status">
                                <Filter size={14} className="mr-1 text-zinc-400" />
                                <SelectValue placeholder="Estado" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os estados</SelectItem>
                                <SelectItem value="draft">Rascunho</SelectItem>
                                <SelectItem value="confirmed">Confirmado</SelectItem>
                                <SelectItem value="paid">Pago</SelectItem>
                                <SelectItem value="partial">Parcial</SelectItem>
                                <SelectItem value="overdue">Em Atraso</SelectItem>
                                <SelectItem value="cancelled">Cancelado</SelectItem>
                            </SelectContent>
                        </Select>

                        {hasActiveFilters && (
                            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-zinc-500">
                                <X size={14} /> Limpar
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardHeader className="pb-0">
                    <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                        Historial de {title}
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-3">
                    {documents.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <ReceiptText className="text-zinc-300 dark:text-zinc-600 mb-3" size={40} />
                            <p className="text-zinc-500 dark:text-zinc-400 font-medium">Nenhum registo encontrado</p>
                            <p className="text-zinc-400 dark:text-zinc-500 text-sm mt-1">
                                {hasActiveFilters ? 'Tente alterar os filtros' : 'Comece por criar o primeiro documento'}
                            </p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Número</TableHead>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>NUIT</TableHead>
                                    <TableHead>Emissão</TableHead>
                                    {type !== 'FR' && type !== 'GR' && <TableHead>Vencimento</TableHead>}
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead className="text-center">Estado</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {documents.data.map((doc) => (
                                    <TableRow key={doc.id} className="group">
                                        <TableCell className="font-mono font-medium text-zinc-800 dark:text-zinc-200">
                                            {doc.document_number ?? (
                                                <span className="text-zinc-400 italic text-xs">Rascunho</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="max-w-[160px] truncate font-medium">
                                            {doc.customer_name}
                                        </TableCell>
                                        <TableCell className="font-mono text-xs text-zinc-500">
                                            {doc.customer_nuit}
                                        </TableCell>
                                        <TableCell className="text-sm text-zinc-500">
                                            {doc.issue_date}
                                        </TableCell>
                                        {type !== 'FR' && type !== 'GR' && (
                                            <TableCell className="text-sm text-zinc-500">
                                                {doc.due_date}
                                            </TableCell>
                                        )}
                                        <TableCell className="text-right font-mono font-semibold text-zinc-800 dark:text-zinc-200">
                                            {Number(doc.grand_total).toLocaleString('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MZN
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <StatusBadge status={doc.status} />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Link href={`${showHrefPrefix}/${doc.id}`}>
                                                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                                                    <Eye size={14} />
                                                    Ver
                                                </Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}

                    {/* Pagination */}
                    {documents.last_page > 1 && (
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                            <p className="text-sm text-zinc-500">
                                Página {documents.current_page} de {documents.last_page} &nbsp;·&nbsp; {documents.total} registos
                            </p>
                            <div className="flex gap-1">
                                {documents.links.map((link, i) => (
                                    <button
                                        key={i}
                                        disabled={!link.url}
                                        onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                        className={[
                                            'px-3 py-1.5 text-sm rounded-md border transition-colors',
                                            link.active
                                                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-transparent font-medium'
                                                : !link.url
                                                    ? 'text-zinc-300 dark:text-zinc-600 border-transparent cursor-not-allowed'
                                                    : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800',
                                        ].join(' ')}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </>
    );
}
