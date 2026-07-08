import React, { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { Plus, Pencil, Trash2, Search, X, Hash, Calendar, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { type BreadcrumbItem } from '@/types';
import { useConfirmDelete } from '@/contexts/confirm-delete-context';

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

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Faturação', href: '#' },
    { title: 'Séries', href: '/billing/series' },
];

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

    const hasActiveFilters = filters.search;

    return (
        <>
            <Head title="Séries Documentais" />

            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Séries Documentais</h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {series.total} série{series.total !== 1 ? 's' : ''} encontrada{series.total !== 1 ? 's' : ''}
                    </p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus size={16} />
                            Nova Série
                        </Button>
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
                            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                            <Button onClick={handleCreate} disabled={createForm.processing}>
                                {createForm.processing ? 'A criar...' : 'Criar Série'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Filtros */}
            <Card className="mb-4">
                <CardContent className="pt-4 pb-4">
                    <div className="flex gap-3 items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={15} />
                            <Input
                                className="pl-9"
                                placeholder="Pesquisar por código ou nome..."
                                value={search}
                                onChange={handleSearch}
                            />
                        </div>
                        {hasActiveFilters && (
                            <Button variant="ghost" size="sm" onClick={clearSearch} className="gap-1">
                                <X size={14} /> Limpar
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Tabela */}
            <Card>
                <CardContent className="pt-4">
                    {series.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <Hash className="text-zinc-300 dark:text-zinc-600 mb-3" size={40} />
                            <p className="text-zinc-500 dark:text-zinc-400 font-medium">Nenhuma série encontrada</p>
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Código</TableHead>
                                        <TableHead>Nome</TableHead>
                                        <TableHead>Ano</TableHead>
                                        <TableHead className="text-right">Próximo Número</TableHead>
                                        <TableHead className="text-center">Estado</TableHead>
                                        <TableHead className="text-right">Acções</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {series.data.map((serie) => (
                                        <TableRow key={serie.id}>
                                            <TableCell className="font-mono font-bold text-blue-600 dark:text-blue-400">
                                                {serie.code}
                                            </TableCell>
                                            <TableCell>{serie.name}</TableCell>
                                            <TableCell>{serie.year}</TableCell>
                                            <TableCell className="text-right font-mono">{serie.next_number}</TableCell>
                                            <TableCell className="text-center">
                                                {serie.is_active ? (
                                                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                                                        <CheckCircle2 size={12} /> Activa
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-zinc-400 text-xs font-medium">
                                                        <XCircle size={12} /> Inactiva
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    {/* Botão Editar */}
                                                    <Dialog open={editingSeries?.id === serie.id} onOpenChange={(open) => !open && setEditingSeries(null)}>
                                                        <DialogTrigger asChild>
                                                            <Button variant="ghost" size="sm" onClick={() => handleEdit(serie)}>
                                                                <Pencil size={14} />
                                                            </Button>
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
                                                                <Button variant="outline" onClick={() => setEditingSeries(null)}>Cancelar</Button>
                                                                <Button onClick={handleUpdate} disabled={editForm.processing}>
                                                                    {editForm.processing ? 'A atualizar...' : 'Actualizar'}
                                                                </Button>
                                                            </DialogFooter>
                                                        </DialogContent>
                                                    </Dialog>
 
                                                    <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-600" onClick={() => handleDelete(serie.id)}>
                                                        <Trash2 size={14} />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
 
                            {/* Paginação */}
                            {series.last_page > 1 && (
                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                    <p className="text-sm text-zinc-500">
                                        Página {series.current_page} de {series.last_page}
                                    </p>
                                    <div className="flex gap-1">
                                        {series.links.map((link, i) => (
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
                        </>
                    )}
                </CardContent>
            </Card>
        </>
    );
}

SeriesIndex.layout = {
    breadcrumbs,
};