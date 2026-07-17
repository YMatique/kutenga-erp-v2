import { Head, Link, useForm, router } from '@inertiajs/react';
import { Plus, Pencil, Trash2, Search, X, Hash, Calendar, CheckCircle2, XCircle, Settings2 } from 'lucide-react';
import React, { useState } from 'react';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useConfirmDelete } from '@/contexts/confirm-delete-context';
import type { BreadcrumbItem } from '@/types';
import { PageHeader, TableCard, PrimaryButton, OutlineButton } from '@/components/ui/brand';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';

interface Series {
    id: number;
    code: string;
    name: string;
    year: number;
    next_number: number;
    is_active: boolean;
}

interface PaginatedSeries {
    data: Series[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Props {
    series: PaginatedSeries;
    filters: { search?: string };
}

export default function SeriesIndex({ series, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [editingSeries, setEditingSeries] = useState<Series | null>(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    // ─── Form para Criar ──────────────────────────────────────────────
    const createForm = useForm({
        code: '',
        name: '',
        year: new Date().getFullYear(),
        is_active: true,
    });

    // ─── Form para Editar ─────────────────────────────────────────────
    const editForm = useForm({
        code: '',
        name: '',
        year: new Date().getFullYear(),
        is_active: true,
    });

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearch(value);
        const timeout = setTimeout(() => {
            router.get('/billing/series', { search: value }, { preserveState: true, replace: true });
        }, 400);

        return () => clearTimeout(timeout);
    };

    const clearSearch = () => {
        setSearch('');
        router.get('/billing/series', {}, { preserveState: false });
    };

    const handleCreate = () => {
        createForm.post('/billing/series', {
            onSuccess: () => {
                setIsCreateOpen(false);
                createForm.reset();
            },
        });
    };

    const handleEdit = (serie: Series) => {
        setEditingSeries(serie);
        editForm.setData({
            code: serie.code,
            name: serie.name,
            year: serie.year,
            is_active: serie.is_active,
        });
    };

    const handleUpdate = () => {
        if (!editingSeries) return;

        editForm.put(`/billing/series/${editingSeries.id}`, {
            onSuccess: () => {
                setEditingSeries(null);
                editForm.reset();
            },
        });
    };

    const { confirmDelete } = useConfirmDelete();

    const handleDelete = (id: number) => {
        confirmDelete({
            url: `/billing/series/${id}`,
            title: 'Eliminar Série',
            description: 'Tem a certeza que pretende eliminar esta série? Esta ação não pode ser desfeita.',
        });
    };

    const hasActiveFilters = !!filters.search;

    return (
        <>
            <Head title="Séries Documentais" />

            <div className="space-y-4 bg-slate-50 ">
                <PageHeader
                    title="Séries Documentais"
                    subtitle={`${series.total} série${series.total !== 1 ? 's' : ''} encontrada${series.total !== 1 ? 's' : ''}`}
                    actions={
                        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                            <DialogTrigger asChild>
                                <PrimaryButton>
                                    <Plus className="h-4 w-4" />
                                    Nova Série
                                </PrimaryButton>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Criar Nova Série</DialogTitle>
                                    <DialogDescription>
                                        Defina a série para numeração dos documentos fiscais.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="code">Código <span className="text-red-500">*</span></Label>
                                            <Input
                                                id="code"
                                                placeholder="Ex: A"
                                                value={createForm.data.code}
                                                onChange={(e) => createForm.setData('code', e.target.value.toUpperCase())}
                                            />
                                            {createForm.errors.code && <p className="text-xs text-red-500">{createForm.errors.code}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="year">Ano <span className="text-red-500">*</span></Label>
                                            <Input
                                                id="year"
                                                type="number"
                                                value={createForm.data.year}
                                                onChange={(e) => createForm.setData('year', parseInt(e.target.value) || new Date().getFullYear())}
                                            />
                                            {createForm.errors.year && <p className="text-xs text-red-500">{createForm.errors.year}</p>}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Nome <span className="text-red-500">*</span></Label>
                                        <Input
                                            id="name"
                                            placeholder="Ex: Série Principal - Faturas 2026"
                                            value={createForm.data.name}
                                            onChange={(e) => createForm.setData('name', e.target.value)}
                                        />
                                        {createForm.errors.name && <p className="text-xs text-red-500">{createForm.errors.name}</p>}
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="is_active">Activa</Label>
                                        <Switch
                                            id="is_active"
                                            checked={createForm.data.is_active}
                                            onCheckedChange={(v) => createForm.setData('is_active', v)}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <OutlineButton onClick={() => setIsCreateOpen(false)}>Cancelar</OutlineButton>
                                    <PrimaryButton onClick={handleCreate} disabled={createForm.processing}>
                                        {createForm.processing ? 'A criar...' : 'Criar Série'}
                                    </PrimaryButton>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    }
                />

                {/* FILTERS BAR */}
                <div className="bg-white border border-slate-200 rounded-[4px] shadow-xs px-4 py-3 flex flex-col sm:flex-row gap-3 items-center">
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Pesquisar por código ou nome..."
                            value={search}
                            onChange={handleSearch}
                            className="w-full h-9 pl-9 pr-3 text-sm bg-white border border-slate-200 rounded-[4px] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2DB8A0]/30 focus:border-[#2DB8A0]"
                        />
                    </div>
                    {hasActiveFilters && (
                        <button
                            onClick={clearSearch}
                            className="ml-auto flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors"
                        >
                            <X className="h-3.5 w-3.5" />
                            Limpar
                        </button>
                    )}
                </div>

                {/* TABLE CARD */}
                <TableCard>
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400 w-[120px]">
                                    Código
                                </th>
                                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                    Nome
                                </th>
                                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400 w-[100px]">
                                    Ano
                                </th>
                                <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-400 w-[150px]">
                                    Próximo Número
                                </th>
                                <th className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-400 w-[120px]">
                                    Estado
                                </th>
                                <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-400 w-[120px]">
                                    Acções
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {series.data.length === 0 ? (
                                <tr>
                                    <td colSpan={6}>
                                        <div className="flex flex-col items-center justify-center py-16 text-center">
                                            <Hash className="h-10 w-10 text-slate-300 mb-3" />
                                            <p className="text-slate-500 font-medium">Nenhuma série encontrada</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                series.data.map((serie) => (
                                    <tr key={serie.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                                        <td className="px-4 py-3 font-mono font-bold text-[#2DB8A0]">
                                            {serie.code}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-slate-900">
                                            {serie.name}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">
                                            {serie.year}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono text-slate-700">
                                            {serie.next_number}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {serie.is_active ? (
                                                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-[4px] bg-[#2DB8A0]/10 text-[#2DB8A0]">
                                                    <CheckCircle2 className="h-3 w-3" /> Activa
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-[4px] bg-slate-100 text-slate-500">
                                                    <XCircle className="h-3 w-3" /> Inactiva
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <Dialog open={editingSeries?.id === serie.id} onOpenChange={(open) => !open && setEditingSeries(null)}>
                                                    <DialogTrigger asChild>
                                                        <button
                                                            onClick={() => handleEdit(serie)}
                                                            className="inline-flex items-center justify-center h-7 w-7 text-slate-400 hover:text-[#2DB8A0] hover:bg-[#2DB8A0]/10 rounded transition-colors"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </button>
                                                    </DialogTrigger>
                                                    <DialogContent>
                                                        <DialogHeader>
                                                            <DialogTitle>Editar Série</DialogTitle>
                                                            <DialogDescription>Altere os dados da série.</DialogDescription>
                                                        </DialogHeader>
                                                        <div className="space-y-4 py-4">
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div className="space-y-2">
                                                                    <Label htmlFor="edit-code">Código</Label>
                                                                    <Input
                                                                        id="edit-code"
                                                                        value={editForm.data.code}
                                                                        onChange={(e) => editForm.setData('code', e.target.value.toUpperCase())}
                                                                    />
                                                                    {editForm.errors.code && <p className="text-xs text-red-500">{editForm.errors.code}</p>}
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <Label htmlFor="edit-year">Ano</Label>
                                                                    <Input
                                                                        id="edit-year"
                                                                        type="number"
                                                                        value={editForm.data.year}
                                                                        onChange={(e) => editForm.setData('year', parseInt(e.target.value) || new Date().getFullYear())}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label htmlFor="edit-name">Nome</Label>
                                                                <Input
                                                                    id="edit-name"
                                                                    value={editForm.data.name}
                                                                    onChange={(e) => editForm.setData('name', e.target.value)}
                                                                />
                                                            </div>
                                                            <div className="flex items-center justify-between">
                                                                <Label htmlFor="edit-active">Activa</Label>
                                                                <Switch
                                                                    id="edit-active"
                                                                    checked={editForm.data.is_active}
                                                                    onCheckedChange={(v) => editForm.setData('is_active', v)}
                                                                />
                                                            </div>
                                                        </div>
                                                        <DialogFooter>
                                                            <OutlineButton onClick={() => setEditingSeries(null)}>Cancelar</OutlineButton>
                                                            <PrimaryButton onClick={handleUpdate} disabled={editForm.processing}>
                                                                {editForm.processing ? 'A atualizar...' : 'Actualizar'}
                                                            </PrimaryButton>
                                                        </DialogFooter>
                                                    </DialogContent>
                                                </Dialog>

                                                <button
                                                    onClick={() => handleDelete(serie.id)}
                                                    className="inline-flex items-center justify-center h-7 w-7 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {series.last_page > 1 && (
                        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-white">
                            <p className="text-xs text-slate-500">
                                Página {series.current_page} de {series.last_page} · {series.total} registos
                            </p>
                            <div className="flex gap-1">
                                {series.links.map((link, i) => (
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
                </TableCard>
            </div>
        </>
    );
}

SeriesIndex.layout = (page: any) => (
    <AppLayout breadcrumbs={[
        { title: 'Faturação', href: '#' },
        { title: 'Séries', href: '/billing/series' },
    ]}>
        {page}
    </AppLayout>
);