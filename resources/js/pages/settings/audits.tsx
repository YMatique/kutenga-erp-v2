import { Head, router } from '@inertiajs/react';
import { History, Search, X, ShieldAlert } from 'lucide-react';
import React, { useState } from 'react';
import { PageHeader, TableCard, OutlineButton } from '@/components/ui/brand';
import { Input } from '@/components/ui/input';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type {BreadcrumbItem} from '@/types';

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
    filters?: { search?: string };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Configurações', href: '#' },
    { title: 'Auditoria', href: '/settings/audits' },
];

export default function Audits({ activities, filters }: Props) {
    const [search, setSearch] = useState(filters?.search ?? '');

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearch(value);
        const timeout = setTimeout(() => {
            router.get('/settings/audits', { search: value }, { preserveState: true, replace: true });
        }, 400);

        return () => clearTimeout(timeout);
    };

    const clearSearch = () => {
        setSearch('');
        router.get('/settings/audits', {}, { preserveState: false });
    };

    const getActionBadge = (description: string) => {
        switch (description) {
            case 'created':
                return (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-[4px] bg-green-100 text-green-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500 flex-shrink-0" />
                        Criado
                    </span>
                );
            case 'updated':
                return (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-[4px] bg-blue-100 text-blue-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                        Atualizado
                    </span>
                );
            case 'deleted':
                return (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-[4px] bg-red-100 text-red-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500 flex-shrink-0" />
                        Eliminado
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-[4px] bg-slate-100 text-slate-700">
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
            default: return type;
        }
    };

    return (
        <>
            <Head title="Auditoria" />

            <div className=" space-y-4 bg-slate-50 ">
                <PageHeader
                    title="Auditoria de Sistema"
                    subtitle="Histórico completo de todas as ações realizadas pelos utilizadores no sistema."
                />

                {/* FILTERS BAR */}
                <div className="flex items-center gap-3">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            className="pl-9 bg-white border-slate-200 rounded-[4px] h-9 text-sm focus-visible:ring-[#2DB8A0]/30"
                            placeholder="Pesquisar logs..."
                            value={search}
                            onChange={handleSearch}
                        />
                    </div>
                    {filters?.search && (
                        <OutlineButton onClick={clearSearch}>
                            <X className="h-3.5 w-3.5" />
                            Limpar
                        </OutlineButton>
                    )}
                    <span className="text-xs text-slate-400 font-medium ml-auto">
                        {activities.total} registo{activities.total !== 1 ? 's' : ''}
                    </span>
                </div>

                {/* TABLE CARD */}
                <TableCard>
                    {activities.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <div className="h-12 w-12 rounded-[4px] bg-slate-100 flex items-center justify-center">
                                <ShieldAlert className="h-6 w-6 text-slate-400" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-medium text-slate-600">Nenhuma atividade registada</p>
                                <p className="text-xs text-slate-400 mt-0.5">As ações dos utilizadores aparecerão aqui.</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50 border-b border-slate-100 hover:bg-slate-50">
                                        <TableHead className="uppercase text-[10px] tracking-wider text-slate-400 font-semibold">
                                            Data / Hora
                                        </TableHead>
                                        <TableHead className="uppercase text-[10px] tracking-wider text-slate-400 font-semibold">
                                            Utilizador
                                        </TableHead>
                                        <TableHead className="uppercase text-[10px] tracking-wider text-slate-400 font-semibold">
                                            Ação
                                        </TableHead>
                                        <TableHead className="uppercase text-[10px] tracking-wider text-slate-400 font-semibold">
                                            Registo Afetado
                                        </TableHead>
                                        <TableHead className="uppercase text-[10px] tracking-wider text-slate-400 font-semibold text-right">
                                            Detalhes
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {activities.data.map((log: Activity) => (
                                        <TableRow
                                            key={log.id}
                                            className="hover:bg-slate-50/50 transition-colors border-b border-slate-100"
                                        >
                                            <TableCell className="py-3">
                                                <div className="font-medium text-sm text-slate-900">{log.created_at}</div>
                                                <div className="text-[10px] font-mono text-slate-400 mt-0.5 uppercase tracking-wider">{log.created_at_human}</div>
                                            </TableCell>
                                            
                                            <TableCell>
                                                <div className="font-medium text-sm text-slate-700">{log.causer_name}</div>
                                                {log.causer_email && <div className="text-xs text-slate-500">{log.causer_email}</div>}
                                            </TableCell>
                                            
                                            <TableCell>
                                                {getActionBadge(log.description)}
                                            </TableCell>
                                            
                                            <TableCell>
                                                <span className="font-semibold text-sm text-slate-700">
                                                    {getSubjectName(log.subject_type)}
                                                </span>
                                                <span className="text-xs text-slate-400 ml-1 font-mono">#{log.subject_id}</span>
                                            </TableCell>
                                            
                                            <TableCell className="text-right">
                                                <span className="text-xs text-slate-500">
                                                    {log.properties?.old && Object.keys(log.properties.old).length > 0 ? (
                                                        <span className="inline-flex items-center gap-1">
                                                            Alterou <strong className="text-slate-700">{Object.keys(log.properties.old).length}</strong> campos
                                                        </span>
                                                    ) : log.description === 'created' ? (
                                                        'Criação original'
                                                    ) : (
                                                        'Sem detalhes'
                                                    )}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {/* PAGINAÇÃO */}
                            {activities.last_page > 1 && (
                                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                                    <p className="text-xs text-slate-400">
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
                                                            ? 'text-slate-300 border-transparent cursor-not-allowed'
                                                            : 'border-slate-200 text-slate-600 hover:bg-slate-50 bg-white',
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
        </>
    );
}

Audits.layout = {
    breadcrumbs,
};
