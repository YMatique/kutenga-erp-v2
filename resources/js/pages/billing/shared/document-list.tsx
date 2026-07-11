import React, { useCallback } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Eye, Filter, Plus, ReceiptText, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

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

const STATUS_CONFIG: Record<string, { label: string; dot: string; cls: string }> = {
    draft:     { label: 'Rascunho',   dot: 'bg-slate-400',   cls: 'bg-slate-100 text-slate-600' },
    confirmed: { label: 'Confirmado', dot: 'bg-blue-500',    cls: 'bg-blue-50 text-blue-700' },
    paid:      { label: 'Pago',       dot: 'bg-[#2DB8A0]',   cls: 'bg-[#2DB8A0]/10 text-[#2DB8A0]' },
    partial:   { label: 'Parcial',    dot: 'bg-[#E8A020]',   cls: 'bg-[#E8A020]/10 text-[#E8A020]' },
    cancelled: { label: 'Cancelado',  dot: 'bg-red-500',     cls: 'bg-red-50 text-red-600' },
    overdue:   { label: 'Em Atraso',  dot: 'bg-orange-500',  cls: 'bg-orange-50 text-orange-600' },
};

function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '—';
    try {
        const cleanDateStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
        const parts = cleanDateStr.split('-');
        if (parts.length === 3) {
            const [year, month, day] = parts;
            return `${day}/${month}/${year}`;
        }
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    } catch {
        return dateStr;
    }
}

function StatusBadge({ status }: { status: string }) {
    const cfg = STATUS_CONFIG[status] ?? { label: status, dot: 'bg-slate-400', cls: 'bg-slate-100 text-slate-600' };
    return (
        <span className={cn('inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-[4px]', cfg.cls)}>
            <span className={cn('h-1.5 w-1.5 rounded-full flex-shrink-0', cfg.dot)} />
            {cfg.label}
        </span>
    );
}

export default function DocumentList({ documents, filters, type, title, createHref, showHrefPrefix }: Props) {
    const [search, setSearch] = React.useState(filters.search ?? '');
    const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const applyFilter = useCallback((params: Partial<Filters>) => {
        router.get(showHrefPrefix, { ...filters, ...params }, { preserveState: true, replace: true });
    }, [filters, showHrefPrefix]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearch(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => { applyFilter({ search: value }); }, 400);
    };

    const clearFilters = () => {
        setSearch('');
        router.get(showHrefPrefix, {}, { preserveState: false });
    };

    const hasActiveFilters = filters.search || (filters.status && filters.status !== 'all');

    return (
        <>
            <Head title={title} />
            <div className="space-y-4">
                {/* Page Header */}
                <div className="flex items-center justify-between bg-white border border-slate-200 rounded-[4px] shadow-xs px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-[4px] bg-[#2DB8A0]/10 flex items-center justify-center flex-shrink-0">
                            <ReceiptText className="h-4 w-4 text-[#2DB8A0]" />
                        </div>
                        <div>
                            <h1 className="text-[18px] font-semibold text-slate-900 leading-tight">{title}</h1>
                            <p className="text-sm text-slate-500 mt-0.5">
                                {documents.total} registo{documents.total !== 1 ? 's' : ''} encontrado{documents.total !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>
                    <Link href={createHref}>
                        <button className="inline-flex items-center gap-1.5 h-9 px-3.5 text-sm font-semibold bg-[#E8A020] text-white rounded-[4px] hover:bg-[#d49218] transition-colors">
                            <Plus className="h-3.5 w-3.5" />
                            Novo Registo
                        </button>
                    </Link>
                </div>

                {/* Filter bar */}
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    <div className="relative flex-1 min-w-0 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            id="search-documents"
                            placeholder="Pesquisar por número, cliente ou NUIT…"
                            value={search}
                            onChange={handleSearchChange}
                            className="pl-9 rounded-[4px] border-slate-200 bg-white"
                        />
                    </div>
                    <Select value={filters.status ?? 'all'} onValueChange={(v) => applyFilter({ status: v })}>
                        <SelectTrigger className="w-full sm:w-48 rounded-[4px] border-slate-200 bg-white" id="filter-status">
                            <Filter className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
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
                        <button
                            onClick={clearFilters}
                            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors"
                        >
                            <X className="h-3.5 w-3.5" />
                            Limpar
                        </button>
                    )}
                </div>

                {/* Table */}
                <div className="bg-white border border-slate-200 rounded-[4px] shadow-xs overflow-hidden">
                    {documents.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <ReceiptText className="h-10 w-10 text-slate-300 mb-3" />
                            <p className="text-slate-500 font-medium text-sm">Nenhum registo encontrado</p>
                            <p className="text-slate-400 text-sm mt-1">
                                {hasActiveFilters ? 'Tente alterar os filtros' : 'Comece por criar o primeiro documento'}
                            </p>
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-slate-100">
                                        <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 h-9">NÚMERO</TableHead>
                                        <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 h-9">CLIENTE</TableHead>
                                        <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 h-9">NUIT</TableHead>
                                        <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 h-9">EMISSÃO</TableHead>
                                        {type !== 'FR' && type !== 'GR' && (
                                            <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 h-9">VENCIMENTO</TableHead>
                                        )}
                                        <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 h-9 text-right">TOTAL</TableHead>
                                        <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 h-9">ESTADO</TableHead>
                                        <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 h-9 text-right">ACÇÕES</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {documents.data.map((doc) => (
                                        <TableRow
                                            key={doc.id}
                                            className="group border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                                        >
                                            <TableCell className="py-3 font-mono font-semibold text-slate-900 text-sm">
                                                {doc.document_number ?? (
                                                    <span className="text-slate-400 italic text-xs">Rascunho</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="py-3 max-w-[160px] truncate font-medium text-slate-900 text-sm">
                                                {doc.customer_name}
                                            </TableCell>
                                            <TableCell className="py-3 font-mono text-xs text-slate-500">
                                                {doc.customer_nuit}
                                            </TableCell>
                                            <TableCell className="py-3 text-sm text-slate-500">
                                                {formatDate(doc.issue_date)}
                                            </TableCell>
                                            {type !== 'FR' && type !== 'GR' && (
                                                <TableCell className="py-3 text-sm text-slate-500">
                                                    {formatDate(doc.due_date)}
                                                </TableCell>
                                            )}
                                            <TableCell className="py-3 text-right font-mono font-semibold text-slate-900 text-sm">
                                                {Number(doc.grand_total).toLocaleString('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MZN
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <StatusBadge status={doc.status} />
                                            </TableCell>
                                            <TableCell className="py-3 text-right">
                                                <Link href={`${showHrefPrefix}/${doc.id}`}>
                                                    <button className="inline-flex items-center gap-1.5 text-xs border border-slate-200 bg-white text-slate-700 rounded-[4px] px-2.5 py-1.5 hover:bg-slate-50 transition-colors opacity-0 group-hover:opacity-100">
                                                        <Eye className="h-3 w-3" />
                                                        Ver
                                                    </button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {/* Pagination */}
                            {documents.last_page > 1 && (
                                <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
                                    <p className="text-xs text-slate-500">
                                        Página {documents.current_page} de {documents.last_page} · {documents.total} registos
                                    </p>
                                    <div className="flex gap-1">
                                        {documents.links.map((link, i) => (
                                            <button
                                                key={i}
                                                disabled={!link.url}
                                                onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                                className={cn(
                                                    'px-3 py-1.5 text-xs rounded-[4px] border transition-colors',
                                                    link.active
                                                        ? 'bg-[#2DB8A0] text-white border-transparent font-medium'
                                                        : !link.url
                                                        ? 'text-slate-300 border-transparent cursor-not-allowed'
                                                        : 'border-slate-200 text-slate-600 hover:bg-slate-50',
                                                )}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
