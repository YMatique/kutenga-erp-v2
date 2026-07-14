import { Head, usePage, useForm } from '@inertiajs/react';
import {
    Plus,
    Search,
    Layers,
    Edit,
    Trash2,
    FolderTree,
    AlertCircle,
    FolderPlus,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { PageHeader, TableCard, PrimaryButton } from '@/components/ui/brand';
import { Button } from '@/components/ui/button';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useConfirmDelete } from '@/contexts/confirm-delete-context';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';

interface Category {
    id: number;
    name: string;
    description: string | null;
    parent_id: number | null;
    parent?: Category | null;
}

export default function CategoriesIndex() {
    const { categories } = usePage<{ categories: Category[] }>().props;
    const [open, setOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [search, setSearch] = useState('');

    const { data, setData, post, put, processing, reset, errors } = useForm({
        name: '',
        parent_id: '',
        description: '',
    });

    const filteredCategories = categories.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase())
    );

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingCategory) {
            put(`/categories/${editingCategory.id}`, {
                onSuccess: () => {
                    setOpen(false);
                    reset();
                    toast.success('Categoria atualizada com sucesso!');
                }
            });
        } else {
            post('/categories', {
                onSuccess: () => {
                    setOpen(false);
                    reset();
                    toast.success('Categoria criada com sucesso!');
                }
            });
        }
    };

    const handleEdit = (category: Category) => {
        setEditingCategory(category);
        setData({
            name: category.name,
            parent_id: category.parent_id?.toString() || 'none',
            description: category.description || '',
        });
        setOpen(true);
    };

    const handleNew = () => {
        setEditingCategory(null);
        reset();
        setData({
            name: '',
            parent_id: 'none',
            description: '',
        });
        setOpen(true);
    };

    const { confirmDelete } = useConfirmDelete();

    const deleteCategory = (id: number) => {
        confirmDelete({
            url: `/categories/${id}`,
            title: 'Remover Categoria',
            description: 'Deseja realmente remover esta categoria? Os produtos vinculados a ela ficarão sem categoria associada.',
            onSuccess: () => toast.success('Categoria removida com sucesso!'),
        });
    };

    return (
        <>
            <Head title="Categorias" />

            <div className=" space-y-4 bg-slate-50">
                {/* PAGE HEADER */}
                <PageHeader
                    title="Categorias"
                    subtitle="Organização do catálogo em grupos hierárquicos."
                    actions={
                        <PrimaryButton onClick={handleNew}>
                            <Plus className="h-4 w-4" />
                            Nova Categoria
                        </PrimaryButton>
                    }
                />

                {/* SEARCH BAR */}
                <div className="flex items-center gap-3">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Filtrar categorias por nome..."
                            className="pl-9 bg-white border-slate-200 rounded-[4px] h-9 text-sm focus-visible:ring-[#2DB8A0]/30"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <span className="text-xs text-slate-400 font-medium">
                        {filteredCategories.length} categori{filteredCategories.length !== 1 ? 'as' : 'a'}
                    </span>
                </div>

                {/* TABLE CARD */}
                <TableCard>
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50 border-b border-slate-100 hover:bg-slate-50">
                                <TableHead className="uppercase text-[10px] tracking-wider text-slate-400 font-semibold w-[300px]">
                                    Nome
                                </TableHead>
                                <TableHead className="uppercase text-[10px] tracking-wider text-slate-400 font-semibold">
                                    Parent
                                </TableHead>
                                <TableHead className="uppercase text-[10px] tracking-wider text-slate-400 font-semibold">
                                    Descrição
                                </TableHead>
                                <TableHead className="uppercase text-[10px] tracking-wider text-slate-400 font-semibold text-right w-[100px]">
                                    Acções
                                </TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {filteredCategories.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-52 text-center">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="h-12 w-12 rounded-[4px] bg-slate-100 flex items-center justify-center">
                                                <FolderPlus className="h-6 w-6 text-slate-400" />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm font-medium text-slate-600">Nenhuma categoria encontrada</p>
                                                <p className="text-xs text-slate-400 mt-0.5">Crie a primeira categoria para organizar o catálogo.</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredCategories.map((cat) => (
                                    <TableRow
                                        key={cat.id}
                                        className="hover:bg-slate-50/50 transition-colors border-b border-slate-100"
                                    >
                                        {/* NOME */}
                                        <TableCell className="py-3">
                                            <div className="flex items-center gap-2.5">
                                                <div className="h-8 w-8 rounded-[4px] bg-slate-100 flex items-center justify-center flex-shrink-0">
                                                    <Layers className="h-4 w-4 text-slate-500" />
                                                </div>
                                                <span className="font-semibold text-slate-900 text-sm">
                                                    {cat.name}
                                                </span>
                                            </div>
                                        </TableCell>

                                        {/* PARENT */}
                                        <TableCell>
                                            {cat.parent ? (
                                                <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                                                    <FolderTree className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                                                    {cat.parent.name}
                                                </div>
                                            ) : (
                                                <span className="inline-flex items-center text-[10px] font-semibold px-2 py-1 rounded-[4px] bg-slate-100 text-slate-500 uppercase tracking-wide">
                                                    Nível Principal
                                                </span>
                                            )}
                                        </TableCell>

                                        {/* DESCRIÇÃO */}
                                        <TableCell className="text-xs text-slate-500 max-w-[340px] truncate" title={cat.description || ''}>
                                            {cat.description || (
                                                <span className="text-slate-300 italic">Sem descrição</span>
                                            )}
                                        </TableCell>

                                        {/* ACÇÕES */}
                                        <TableCell className="text-right">
                                            <div className="flex justify-end items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-400 hover:text-[#2DB8A0] hover:bg-[#2DB8A0]/10 rounded-[4px]"
                                                    onClick={() => handleEdit(cat)}
                                                    title="Editar Categoria"
                                                >
                                                    <Edit className="h-3.5 w-3.5" />
                                                </Button>

                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-[4px]"
                                                    onClick={() => deleteCategory(cat.id)}
                                                    title="Remover Categoria"
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

            {/* MODAL DIALOG (CRIAR E EDITAR) */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[480px] rounded-[4px]">
                    <form onSubmit={submit}>
                        <DialogHeader>
                            <DialogTitle className="text-base font-semibold text-slate-900">
                                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
                            </DialogTitle>
                            <DialogDescription className="text-xs text-slate-500">
                                Defina as diretrizes organizacionais da categoria abaixo.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="py-5 grid gap-4">
                            {/* Nome */}
                            <div className="grid gap-2">
                                <Label
                                    htmlFor="name"
                                    className="text-xs font-semibold uppercase tracking-wider text-slate-500"
                                >
                                    Nome da Categoria *
                                </Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    placeholder="Ex: Eletrónicos, Consumíveis, Licenças de Software"
                                    className="h-9 rounded-[4px] border-slate-200"
                                />
                                {errors.name && (
                                    <p className="text-xs font-medium text-red-500 flex items-center gap-1 mt-0.5">
                                        <AlertCircle className="h-3 w-3" /> {errors.name}
                                    </p>
                                )}
                            </div>

                            {/* Categoria Pai */}
                            <div className="grid gap-2">
                                <Label
                                    htmlFor="parent"
                                    className="text-xs font-semibold uppercase tracking-wider text-slate-500"
                                >
                                    Hierarquia / Categoria Pai
                                </Label>
                                <Select
                                    value={data.parent_id}
                                    onValueChange={val => setData('parent_id', val)}
                                >
                                    <SelectTrigger className="h-9 rounded-[4px] border-slate-200">
                                        <SelectValue placeholder="Selecione o nível de agrupamento..." />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-[4px]">
                                        <SelectItem value="none">
                                            <span className="font-medium text-slate-500">Nível Principal (Nenhuma)</span>
                                        </SelectItem>
                                        {categories
                                            .filter(c => c.id !== editingCategory?.id)
                                            .map(c => (
                                                <SelectItem key={c.id} value={c.id.toString()}>
                                                    {c.name}
                                                </SelectItem>
                                            ))
                                        }
                                    </SelectContent>
                                </Select>
                                {errors.parent_id && (
                                    <p className="text-xs font-medium text-red-500 flex items-center gap-1 mt-0.5">
                                        <AlertCircle className="h-3 w-3" /> {errors.parent_id}
                                    </p>
                                )}
                            </div>

                            {/* Descrição */}
                            <div className="grid gap-2">
                                <Label
                                    htmlFor="desc"
                                    className="text-xs font-semibold uppercase tracking-wider text-slate-500"
                                >
                                    Descrição Operacional
                                </Label>
                                <Textarea
                                    id="desc"
                                    value={data.description}
                                    onChange={e => setData('description', e.target.value)}
                                    placeholder="Descreva o tipo de itens agrupados sob esta categoria..."
                                    className="min-h-[80px] resize-y text-sm rounded-[4px] border-slate-200"
                                />
                                {errors.description && (
                                    <p className="text-xs font-medium text-red-500 flex items-center gap-1 mt-0.5">
                                        <AlertCircle className="h-3 w-3" /> {errors.description}
                                    </p>
                                )}
                            </div>
                        </div>

                        <DialogFooter className="gap-2 sm:gap-2 border-t border-slate-100 pt-4">
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
                                {processing ? 'A gravar...' : 'Salvar Categoria'}
                            </button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

CategoriesIndex.layout = (page: any) => (
    <AppLayout breadcrumbs={[
        { title: 'Catálogo', href: '#' },
        { title: 'Categorias', href: '/categories' },
    ]}>
        {page}
    </AppLayout>
);