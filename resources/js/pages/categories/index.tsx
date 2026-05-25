import { Head, usePage, useForm } from '@inertiajs/react';
import { Plus, Search, Layers, Edit, Trash2, FolderTree } from 'lucide-react';
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
    DialogDescription
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';
import { toast } from 'sonner';

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
                    toast.success('Categoria atualizada!');
                }
            });
        } else {
            post('/categories', {
                onSuccess: () => {
                    setOpen(false);
                    reset();
                    toast.success('Categoria criada!');
                }
            });
        }
    };

    const handleEdit = (category: Category) => {
        setEditingCategory(category);
        setData({
            name: category.name,
            parent_id: category.parent_id?.toString() || '',
            description: category.description || '',
        });
        setOpen(true);
    };

    const handleNew = () => {
        setEditingCategory(null);
        reset();
        setOpen(true);
    };

    const deleteCategory = (id: number) => {
        if (confirm('Deseja excluir esta categoria? Os produtos vinculados ficarão sem categoria.')) {
            import('@inertiajs/react').then(({ router }) => {
                router.delete(`/categories/${id}`, {
                    onSuccess: () => toast.success('Categoria removida!'),
                });
            });
        }
    };

    return (
        <>
            <Head title="Categorias" />

            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-white italic">Gestão de Categorias</h1>
                        <p className="text-muted-foreground text-sm">Organize seus produtos em grupos hierárquicos.</p>
                    </div>
                    <Button className="gap-2" onClick={handleNew}>
                        <Plus className="h-4 w-4" /> Nova Categoria
                    </Button>
                </div>

                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <Input 
                        placeholder="Filtrar categorias..." 
                        className="pl-9 bg-white dark:bg-zinc-900"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="rounded-xl border border-zinc-200/50 bg-white/70 backdrop-blur-md dark:bg-zinc-900/70 overflow-hidden shadow-xs">
                    <Table>
                        <TableHeader className="bg-zinc-50/50 dark:bg-zinc-800/30">
                            <TableRow>
                                <TableHead className="w-[300px]">Nome</TableHead>
                                <TableHead>Categoria Pai</TableHead>
                                <TableHead>Descrição</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredCategories.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-48 text-center text-muted-foreground">
                                        Nenhuma categoria encontrada.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredCategories.map((cat) => (
                                    <TableRow key={cat.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Layers className="h-4 w-4 text-zinc-400" />
                                                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{cat.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {cat.parent ? (
                                                <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                                                    <FolderTree className="h-3 w-3" />
                                                    {cat.parent.name}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-zinc-300 italic">Nível Principal</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-zinc-600 dark:text-zinc-400 text-sm italic">
                                            {cat.description || '-'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-blue-600" onClick={() => handleEdit(cat)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-red-600" onClick={() => deleteCategory(cat.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <form onSubmit={submit}>
                        <DialogHeader>
                            <DialogTitle>{editingCategory ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
                            <DialogDescription>Defina as informações da categoria para organizar seu catálogo.</DialogDescription>
                        </DialogHeader>
                        <div className="py-4 grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nome da Categoria</Label>
                                <Input id="name" value={data.name} onChange={e => setData('name', e.target.value)} />
                                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="parent">Categoria Pai (Opcional)</Label>
                                <Select value={data.parent_id} onValueChange={val => setData('parent_id', val)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Nível Principal" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.filter(c => c.id !== editingCategory?.id).map(c => (
                                            <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="desc">Descrição</Label>
                                <Textarea id="desc" value={data.description} onChange={e => setData('description', e.target.value)} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={processing}>Salvar Categoria</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
