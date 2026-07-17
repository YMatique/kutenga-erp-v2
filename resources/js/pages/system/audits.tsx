import { Head, router } from '@inertiajs/react';
import { Search, X, ShieldAlert, Eye, Calendar, Settings2, Shield } from 'lucide-react';
import React, { useState } from 'react';
import { PageHeader, TableCard, OutlineButton } from '@/components/ui/brand';
import { Input } from '@/components/ui/input';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import KutengaLayout from '@/layouts/kutenga-layout';

export interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

export interface Activity {
    id: number;
    log_name: string;
    description: string;
    subject_type: string;
    subject_id: number;
    causer_name: string;
    causer_email: string;
    properties: any;
    created_at: string;
    created_at_human: string;
}

interface Props {
    activities: PaginatedData<Activity>;
    filters?: {
        search?: string;
        action?: string;
        date_start?: string;
        date_end?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Sistema', href: '#' },
    { title: 'Logs do Sistema', href: '/system/audits' },
];

export default function SystemAudits({ activities, filters }: Props) {
    const [search, setSearch] = useState(filters?.search ?? '');
    const [action, setAction] = useState(filters?.action ?? 'all');
    const [dateStart, setDateStart] = useState(filters?.date_start ?? '');
    const [dateEnd, setDateEnd] = useState(filters?.date_end ?? '');

    const [selectedLog, setSelectedLog] = useState<Activity | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);

    const handleFilter = () => {
        const params: any = {};
        if (search) params.search = search;
        if (action && action !== 'all') params.action = action;
        if (dateStart) params.date_start = dateStart;
        if (dateEnd) params.date_end = dateEnd;
        router.get('/system/audits', params, { preserveState: true });
    };

    const handleReset = () => {
        setSearch('');
        setAction('all');
        setDateStart('');
        setDateEnd('');
        router.get('/system/audits', {});
    };

    const openDetails = (log: Activity) => {
        setSelectedLog(log);
        setDetailOpen(true);
    };

    const getActionBadge = (description: string) => {
        switch (description) {
            case 'created':
                return (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-[4px] bg-green-500/10 text-green-600 dark:text-green-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500 flex-shrink-0" />
                        Criado
                    </span>
                );
            case 'updated':
                return (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-[4px] bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                        Atualizado
                    </span>
                );
            case 'deleted':
                return (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-[4px] bg-red-500/10 text-red-600 dark:text-red-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500 flex-shrink-0" />
                        Eliminado
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-[4px] bg-muted text-muted-foreground">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-500 flex-shrink-0" />
                        {description}
                    </span>
                );
        }
    };

    const getSubjectName = (type: string) => {
        switch (type) {
            case 'User': return 'Utilizador';
            case 'Customer': return 'Cliente';
            case 'Product': return 'Produto';
            case 'Document': return 'Documento';
            case 'Invoice': return 'Fatura';
            case 'Company': return 'Empresa';
            default: return type;
        }
    };

    const formatValue = (val: any) => {
        if (val === null || val === undefined) return '—';
        if (typeof val === 'boolean') return val ? 'Sim' : 'Não';
        if (typeof val === 'object') return JSON.stringify(val);
        return String(val);
    };

    return (
        <>
            <Head title="Logs do Sistema" />

            <div className="space-y-4">
                {/* Banner Super-Admin */}
                <div className="flex items-center gap-3 px-4 py-3 rounded-[4px] bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800">
                    <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                    <div>
                        <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Vista do Sistema — Super Administrador</p>
                        <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                            Estás a visualizar logs globais do sistema sem filtro por empresa. Acesso restrito.
                        </p>
                    </div>
                </div>

                <PageHeader
                    title="Logs do Sistema"
                    subtitle="Registo global de todas as ações do sistema sem contexto de empresa."
                />

                {/* FILTERS BAR */}
                <div className="flex flex-col gap-4 bg-card border border-border p-4 rounded-[4px] shadow-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                        {/* Termo de Pesquisa */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                className="pl-9 h-9 text-sm rounded-[4px] border-border bg-card text-foreground"
                                placeholder="Pesquisar logs..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        {/* Ação */}
                        <Select value={action} onValueChange={setAction}>
                            <SelectTrigger className="h-9 rounded-[4px] border-border bg-card text-foreground">
                                <SelectValue placeholder="Todas as ações" />
                            </SelectTrigger>
                            <SelectContent className="border-border bg-card text-foreground">
                                <SelectItem value="all">Todas as ações</SelectItem>
                                <SelectItem value="created">Criado</SelectItem>
                                <SelectItem value="updated">Atualizado</SelectItem>
                                <SelectItem value="deleted">Eliminado</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Data Início */}
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <Input
                                type="date"
                                className="h-9 text-xs rounded-[4px] border-border bg-card text-foreground"
                                value={dateStart}
                                onChange={(e) => setDateStart(e.target.value)}
                            />
                        </div>

                        {/* Data Fim */}
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <Input
                                type="date"
                                className="h-9 text-xs rounded-[4px] border-border bg-card text-foreground"
                                value={dateEnd}
                                onChange={(e) => setDateEnd(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex justify-between items-center border-t border-border pt-3">
                        <span className="text-xs text-muted-foreground font-medium">
                            {activities.total} registo{activities.total !== 1 ? 's' : ''} encontrado{activities.total !== 1 ? 's' : ''}
                        </span>
                        <div className="flex gap-2">
                            {(search || action !== 'all' || dateStart || dateEnd) && (
                                <OutlineButton onClick={handleReset} className="h-9 px-3">
                                    <X className="h-3.5 w-3.5 mr-1" />
                                    Limpar Filtros
                                </OutlineButton>
                            )}
                            <button
                                onClick={handleFilter}
                                className="inline-flex items-center gap-1.5 h-9 px-4 text-sm font-semibold justify-center bg-amber-600 hover:bg-amber-700 text-white rounded-[4px] transition-colors"
                            >
                                <Settings2 className="h-3.5 w-3.5" />
                                Filtrar Resultados
                            </button>
                        </div>
                    </div>
                </div>

                {/* TABLE CARD */}
                <TableCard>
                    {activities.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <div className="h-12 w-12 rounded-[4px] bg-muted flex items-center justify-center border border-border">
                                <ShieldAlert className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-medium text-foreground">Nenhuma atividade de sistema registada</p>
                                <p className="text-xs text-muted-foreground mt-0.5">Os logs do sistema aparecerão aqui.</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50 border-b border-border hover:bg-muted/50">
                                            <TableHead className="uppercase text-[10px] tracking-wider text-muted-foreground font-semibold">
                                                Data / Hora
                                            </TableHead>
                                            <TableHead className="uppercase text-[10px] tracking-wider text-muted-foreground font-semibold">
                                                Utilizador
                                            </TableHead>
                                            <TableHead className="uppercase text-[10px] tracking-wider text-muted-foreground font-semibold">
                                                Ação
                                            </TableHead>
                                            <TableHead className="uppercase text-[10px] tracking-wider text-muted-foreground font-semibold">
                                                Registo Afetado
                                            </TableHead>
                                            <TableHead className="uppercase text-[10px] tracking-wider text-muted-foreground font-semibold text-right">
                                                Ações
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody className="divide-y divide-border">
                                        {activities.data.map((log: Activity) => (
                                            <TableRow
                                                key={log.id}
                                                className="hover:bg-muted/50 transition-colors border-b border-border"
                                            >
                                                <TableCell className="py-3">
                                                    <div className="font-medium text-sm text-foreground">{log.created_at}</div>
                                                    <div className="text-[10px] font-mono text-muted-foreground mt-0.5 uppercase tracking-wider">{log.created_at_human}</div>
                                                </TableCell>

                                                <TableCell>
                                                    <div className="font-medium text-sm text-foreground">{log.causer_name}</div>
                                                    {log.causer_email && <div className="text-xs text-muted-foreground">{log.causer_email}</div>}
                                                </TableCell>

                                                <TableCell>
                                                    {getActionBadge(log.description)}
                                                </TableCell>

                                                <TableCell>
                                                    <span className="font-semibold text-sm text-foreground">
                                                        {getSubjectName(log.subject_type)}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground ml-1 font-mono">#{log.subject_id}</span>
                                                </TableCell>

                                                <TableCell className="text-right">
                                                    <OutlineButton
                                                        className="h-8 px-2.5 text-xs inline-flex items-center gap-1.5"
                                                        onClick={() => openDetails(log)}
                                                    >
                                                        <Eye size={12} />
                                                        Ver Detalhes
                                                    </OutlineButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* PAGINAÇÃO */}
                            {activities.last_page > 1 && (
                                <div className="flex items-center justify-between px-5 py-4 border-t border-border bg-card">
                                    <p className="text-xs text-muted-foreground">
                                        Página {activities.current_page} de {activities.last_page}
                                    </p>
                                    <div className="flex gap-1">
                                        {activities.links?.map((link, i) => (
                                            <button
                                                key={i}
                                                disabled={!link.url}
                                                onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                                className={cn(
                                                    'px-3 py-1.5 text-xs rounded-[4px] border transition-colors',
                                                    link.active
                                                        ? 'bg-[#1A2332] text-white border-transparent font-semibold'
                                                        : !link.url
                                                            ? 'text-muted-foreground/30 border-transparent cursor-not-allowed'
                                                            : 'border-border text-foreground hover:bg-muted bg-card',
                                                )}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </TableCard>
            </div>

            {/* DETALHES MODAL */}
            <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto border-border bg-card text-foreground">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-foreground">
                            Detalhes do Log #{selectedLog?.id}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Metadados e mapa de alterações do registo afetado.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedLog && (
                        <div className="space-y-6 py-2 text-sm text-foreground">
                            {/* METADATA GRID */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/40 p-4 rounded-[4px] border border-border">
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide">Data / Hora</p>
                                    <p className="font-medium mt-0.5">{selectedLog.created_at}</p>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">{selectedLog.created_at_human}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide">Operador / Utilizador</p>
                                    <p className="font-medium mt-0.5">{selectedLog.causer_name}</p>
                                    {selectedLog.causer_email && <p className="text-xs text-muted-foreground mt-0.5">{selectedLog.causer_email}</p>}
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide">Ação</p>
                                    <p className="mt-0.5">{getActionBadge(selectedLog.description)}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide">Registo Afetado</p>
                                    <p className="font-medium mt-0.5">
                                        {getSubjectName(selectedLog.subject_type)} <span className="font-mono text-xs text-muted-foreground">#{selectedLog.subject_id}</span>
                                    </p>
                                </div>
                            </div>

                            {/* COMPARISON VALUES DIFF */}
                            <div className="space-y-3">
                                <h3 className="font-semibold text-foreground text-sm border-b border-border pb-1">Alterações no Registo</h3>

                                {selectedLog.description === 'updated' && selectedLog.properties?.old && selectedLog.properties?.attributes ? (
                                    <div className="border border-border rounded-[4px] overflow-hidden shadow-xs">
                                        <Table>
                                            <TableHeader className="bg-muted/40">
                                                <TableRow className="hover:bg-transparent border-b border-border">
                                                    <TableHead className="w-[180px] font-semibold text-muted-foreground text-xs uppercase">Campo</TableHead>
                                                    <TableHead className="font-semibold text-muted-foreground text-xs uppercase">Antes (Velho)</TableHead>
                                                    <TableHead className="font-semibold text-muted-foreground text-xs uppercase">Depois (Novo)</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody className="divide-y divide-border">
                                                {Object.keys(selectedLog.properties.attributes).map((key) => {
                                                    const oldVal = selectedLog.properties.old[key];
                                                    const newVal = selectedLog.properties.attributes[key];
                                                    return (
                                                        <TableRow key={key} className="hover:bg-transparent border-b border-border">
                                                            <TableCell className="font-mono text-xs font-semibold text-foreground bg-muted/20 py-2">
                                                                {key}
                                                            </TableCell>
                                                            <TableCell className="bg-red-500/5 text-red-600 dark:text-red-400 font-mono text-xs py-2 line-through">
                                                                {formatValue(oldVal)}
                                                            </TableCell>
                                                            <TableCell className="bg-green-500/5 text-green-600 dark:text-green-400 font-mono text-xs py-2 font-semibold">
                                                                {formatValue(newVal)}
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </div>
                                ) : selectedLog.description === 'created' && selectedLog.properties?.attributes ? (
                                    <div className="border border-border rounded-[4px] overflow-hidden shadow-xs">
                                        <Table>
                                            <TableHeader className="bg-muted/40">
                                                <TableRow className="hover:bg-transparent border-b border-border">
                                                    <TableHead className="w-[180px] font-semibold text-muted-foreground text-xs uppercase">Campo</TableHead>
                                                    <TableHead className="font-semibold text-muted-foreground text-xs uppercase">Valor Inicial</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody className="divide-y divide-border">
                                                {Object.keys(selectedLog.properties.attributes).map((key) => {
                                                    const newVal = selectedLog.properties.attributes[key];
                                                    return (
                                                        <TableRow key={key} className="hover:bg-transparent border-b border-border">
                                                            <TableCell className="font-mono text-xs font-semibold text-foreground bg-muted/20 py-2">
                                                                {key}
                                                            </TableCell>
                                                            <TableCell className="bg-green-500/5 text-green-600 dark:text-green-400 font-mono text-xs py-2 font-semibold">
                                                                {formatValue(newVal)}
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </div>
                                ) : selectedLog.description === 'deleted' && selectedLog.properties?.old ? (
                                    <div className="border border-border rounded-[4px] overflow-hidden shadow-xs">
                                        <Table>
                                            <TableHeader className="bg-muted/40">
                                                <TableRow className="hover:bg-transparent border-b border-border">
                                                    <TableHead className="w-[180px] font-semibold text-muted-foreground text-xs uppercase">Campo</TableHead>
                                                    <TableHead className="font-semibold text-muted-foreground text-xs uppercase">Valor Removido</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody className="divide-y divide-border">
                                                {Object.keys(selectedLog.properties.old).map((key) => {
                                                    const oldVal = selectedLog.properties.old[key];
                                                    return (
                                                        <TableRow key={key} className="hover:bg-transparent border-b border-border">
                                                            <TableCell className="font-mono text-xs font-semibold text-foreground bg-muted/20 py-2">
                                                                {key}
                                                            </TableCell>
                                                            <TableCell className="bg-red-500/5 text-red-600 dark:text-red-400 font-mono text-xs py-2 line-through">
                                                                {formatValue(oldVal)}
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </div>
                                ) : (
                                    <p className="text-xs text-muted-foreground py-4 text-center">Nenhum detalhe adicional registado nas propriedades.</p>
                                )}
                            </div>
                        </div>
                    )}
                    <DialogFooter className="border-t border-border pt-4">
                        <OutlineButton onClick={() => setDetailOpen(false)}>Fechar Detalhes</OutlineButton>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

SystemAudits.layout = (page: any) => (
    <KutengaLayout breadcrumbs={breadcrumbs}>
        {page}
    </KutengaLayout>
);
