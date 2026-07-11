import { Head, usePage, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Plus, Search, Ruler, Edit, Trash2, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader, TableCard, PrimaryButton } from '@/components/ui/brand';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { toast } from 'sonner';
import { useConfirmDelete } from '@/contexts/confirm-delete-context';

interface Unit {
    id: number;
    name: string;
    short_name: string;
}

export default function UnitsIndex() {
    const { units } = usePage<{ units: Unit[] }>().props;
    const [open, setOpen] = useState(false);
    const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
    const [search, setSearch] = useState('');

    const { data, setData, post, put, processing, reset, errors } = useForm({
        name: '',
        short_name: '',
    });

    const filteredUnits = units.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.short_name.toLowerCase().includes(search.toLowerCase())
    );

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingUnit) {
            put(`/units/${editingUnit.id}`, {
                onSuccess: () => {
                    setOpen(false);
                    reset();
                    toast.success('Unidade atualizada!');
                }
            });
        } else {
            post('/units', {
                onSuccess: () => {
                    setOpen(false);
                    reset();
                    toast.success('Unidade criada!');
                }
            });
        }
    };

    const handleEdit = (unit: Unit) => {
        setEditingUnit(unit);
        setData({
            name: unit.name,
            short_name: unit.short_name,
        });
        setOpen(true);
    };

    const handleNew = () => {
        setEditingUnit(null);
        reset();
        setOpen(true);
    };

    const { confirmDelete } = useConfirmDelete();

    const deleteUnit = (id: number) => {
        confirmDelete({
            url: `/units/${id}`,
            title: 'Remover Unidade',
            description: 'Deseja excluir esta unidade de medida?',
            onSuccess: () => toast.success('Unidade removida!'),
        });
    };

    return (
        <>
            <Head title="Unidades de Medida" />

            <div className="space-y-4 bg-slate-50 ">
                {/* PAGE HEADER */}
                <PageHeader
                    title="Unidades de Medida"
                    subtitle="Unidades utilizadas no catálogo para quantificar itens."
                    actions={
                        <PrimaryButton onClick={handleNew}>
                            <Plus className="h-4 w-4" />
                            Nova Unidade
                        </PrimaryButton>
                    }
                />

                {/* SEARCH BAR */}
                <div className="flex items-center gap-3">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Filtrar unidades por nome ou sigla..."
                            className="pl-9 bg-white border-slate-200 rounded-[4px] h-9 text-sm focus-visible:ring-[#2DB8A0]/30"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <span className="text-xs text-slate-400 font-medium">
                        {filteredUnits.length} unidade{filteredUnits.length !== 1 ? 's' : ''}
                    </span>
                </div>

                {/* TABLE CARD */}
                <TableCard>
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50 border-b border-slate-100 hover:bg-slate-50">
                                <TableHead className="uppercase text-[10px] tracking-wider text-slate-400 font-semibold">
                                    Nome
                                </TableHead>
                                <TableHead className="uppercase text-[10px] tracking-wider text-slate-400 font-semibold w-[140px]">
                                    Abreviatura
                                </TableHead>
                                <TableHead className="uppercase text-[10px] tracking-wider text-slate-400 font-semibold w-[140px]">
                                    Tipo
                                </TableHead>
                                <TableHead className="uppercase text-[10px] tracking-wider text-slate-400 font-semibold text-right w-[100px]">
                                    Acções
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUnits.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-52 text-center">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="h-12 w-12 rounded-[4px] bg-slate-100 flex items-center justify-center">
                                                <Ruler className="h-6 w-6 text-slate-400" />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm font-medium text-slate-600">Nenhuma unidade encontrada</p>
                                                <p className="text-xs text-slate-400 mt-0.5">Adicione unidades de medida ao catálogo.</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredUnits.map((unit) => (
                                    <TableRow
                                        key={unit.id}
                                        className="hover:bg-slate-50/50 transition-colors border-b border-slate-100"
                                    >
                                        {/* NOME */}
                                        <TableCell className="py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-[4px] bg-[#1A2332]/8 flex items-center justify-center flex-shrink-0">
                                                    <Ruler className="h-4 w-4 text-[#1A2332]/60" />
                                                </div>
                                                <span className="font-semibold text-slate-900 text-sm">
                                                    {unit.name}
                                                </span>
                                            </div>
                                        </TableCell>

                                        {/* ABREVIATURA */}
                                        <TableCell>
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-[4px] bg-slate-100 text-xs font-mono font-bold text-slate-600 uppercase tracking-wider">
                                                <Hash className="h-3 w-3" />
                                                {unit.short_name}
                                            </span>
                                        </TableCell>

                                        {/* TIPO (derivado da sigla) */}
                                        <TableCell>
                                            <span className="text-xs text-slate-400">
                                                {/^(kg|g|mg|ton)/i.test(unit.short_name)
                                                    ? 'Massa'
                                                    : /^(m|cm|mm|km)/i.test(unit.short_name)
                                                        ? 'Comprimento'
                                                        : /^(l|ml|cl)/i.test(unit.short_name)
                                                            ? 'Volume'
                                                            : 'Quantidade'}
                                            </span>
                                        </TableCell>

                                        {/* ACÇÕES */}
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-400 hover:text-[#2DB8A0] hover:bg-[#2DB8A0]/10 rounded-[4px]"
                                                    onClick={() => handleEdit(unit)}
                                                >
                                                    <Edit className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-[4px]"
                                                    onClick={() => deleteUnit(unit.id)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableCard>
            </div>

            {/* MODAL DIALOG */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="rounded-[4px]">
                    <form onSubmit={submit}>
                        <DialogHeader>
                            <DialogTitle className="text-base font-semibold text-slate-900">
                                {editingUnit ? 'Editar Unidade' : 'Nova Unidade de Medida'}
                            </DialogTitle>
                            <DialogDescription className="text-xs text-slate-500">
                                As unidades são usadas para definir como você vende e compra seus itens.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-5 grid gap-4">
                            <div className="grid gap-2">
                                <Label
                                    htmlFor="name"
                                    className="text-xs font-semibold uppercase tracking-wider text-slate-500"
                                >
                                    Nome por Extenso *
                                </Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    placeholder="Ex: Unidade, Metro, Litro, Quilograma"
                                    className="h-9 rounded-[4px] border-slate-200"
                                />
                                {errors.name && (
                                    <p className="text-xs text-red-500 mt-0.5">{errors.name}</p>
                                )}
                            </div>
                            <div className="grid gap-2">
                                <Label
                                    htmlFor="short"
                                    className="text-xs font-semibold uppercase tracking-wider text-slate-500"
                                >
                                    Sigla / Abreviatura *
                                </Label>
                                <Input
                                    id="short"
                                    value={data.short_name}
                                    onChange={e => setData('short_name', e.target.value)}
                                    placeholder="Ex: UN, M, LT, KG"
                                    className="h-9 rounded-[4px] border-slate-200 font-mono uppercase"
                                />
                                {errors.short_name && (
                                    <p className="text-xs text-red-500 mt-0.5">{errors.short_name}</p>
                                )}
                            </div>
                        </div>
                        <DialogFooter className="gap-2 border-t border-slate-100 pt-4">
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="inline-flex items-center gap-1.5 h-9 px-3.5 text-sm font-medium border border-slate-200 bg-white text-slate-700 rounded-[4px] hover:bg-slate-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center gap-1.5 h-9 px-3.5 text-sm font-semibold bg-[#E8A020] text-white rounded-[4px] hover:bg-[#d49218] transition-colors disabled:opacity-60"
                            >
                                {processing ? 'A gravar...' : 'Salvar Unidade'}
                            </button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

UnitsIndex.layout = (page: any) => (
    <AppLayout breadcrumbs={[
        { title: 'Catálogo', href: '#' },
        { title: 'Unidades', href: '/units' },
    ]}>
        {page}
    </AppLayout>
);
