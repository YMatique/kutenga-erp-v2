import { Head, usePage, useForm } from '@inertiajs/react';
import { 
    Plus, 
    Search, 
    Layers, 
    Edit, 
    Trash2, 
    FolderTree, 
    FileText, 
    AlertCircle,
    FolderPlus,
    Badge
} from 'lucide-react';
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
import { Card } from '@/components/ui/card';
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
            parent_id: category.parent_id?.toString() || 'none', // Usar 'none' explicitamente para o Select
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

    const deleteCategory = (id: number) => {
        if (confirm('Deseja realmente remover esta categoria? Os produtos vinculados a ela ficarão sem categoria associada.')) {
            import('@inertiajs/react').then(({ router }) => {
                router.delete(`/categories/${id}`, {
                    onSuccess: () => toast.success('Categoria removida com sucesso!'),
                });
            });
        }
    };

    return (
        <>
            <Head title="Categorias" />

            <div className="p-6 space-y-6 max-w-6xl mx-auto">
                
                {/* CABEÇALHO */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
                    <div>
                        <div className="flex items-center gap-2">
                            <FolderTree className="h-6 w-6 text-slate-700 dark:text-slate-300" />
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                Gestão de Categorias
                            </h1>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            Organize os seus produtos e serviços em grupos estruturados e hierárquicos.
                        </p>
                    </div>

                    <Button className="gap-2 shadow-sm self-start sm:self-auto" onClick={handleNew}>
                        <Plus className="h-4 w-4" /> 
                        Nova Categoria
                    </Button>
                </div>

                {/* BARRA DE FILTRO */}
                <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input 
                            placeholder="Filtrar categorias por nome..." 
                            className="pl-9 bg-white dark:bg-zinc-900 shadow-xs h-10"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* TABELA CARD */}
                <Card className="shadow-xs overflow-hidden border-zinc-200 dark:border-zinc-800">
                    <Table>
                        <TableHeader className="bg-slate-50/75 dark:bg-zinc-800/50">
                            <TableRow>
                                <TableHead className="w-[320px] font-semibold text-slate-700 dark:text-slate-300">Nome</TableHead>
                                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Categoria Pai</TableHead>
                                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Descrição</TableHead>
                                <TableHead className="text-right font-semibold text-slate-700 dark:text-slate-300 w-[120px]">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        
                        <TableBody>
                            {filteredCategories.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-48 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center gap-2.5">
                                            <FolderPlus className="h-8 w-8 text-slate-300 dark:text-slate-700 animate-pulse" />
                                            <span className="text-sm font-medium">Nenhuma categoria registada ou encontrada.</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredCategories.map((cat) => (
                                    <TableRow key={cat.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                                        
                                        {/* Nome */}
                                        <TableCell className="py-3.5">
                                            <div className="flex items-center gap-2.5">
                                                <div className="p-1.5 bg-slate-100 dark:bg-zinc-800 rounded-md text-slate-500">
                                                    <Layers className="h-4 w-4" />
                                                </div>
                                                <span className="font-semibold text-slate-900 dark:text-zinc-100">
                                                    {cat.name}
                                                </span>
                                            </div>
                                        </TableCell>

                                        {/* Categoria Pai */}
                                        <TableCell>
                                            {cat.parent ? (
                                                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-zinc-400">
                                                    <FolderTree className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                                    {cat.parent.name}
                                                </div>
                                            ) : (
                                                <Badge variant="outline" className="text-slate-400 border-slate-200 dark:border-zinc-800 bg-slate-50/30 text-[10px] font-bold px-1.5 py-0 tracking-wide uppercase">
                                                    Nível Principal
                                                </Badge>
                                            )}
                                        </TableCell>

                                        {/* Descrição */}
                                        <TableCell className="text-slate-600 dark:text-zinc-400 text-sm max-w-[340px] truncate" title={cat.description || ''}>
                                            {cat.description || <span className="text-slate-300 dark:text-zinc-700 italic">Sem descrição</span>}
                                        </TableCell>

                                        {/* Ações */}
                                        <TableCell className="text-right">
                                            <div className="flex justify-end items-center gap-1">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-950/20" 
                                                    onClick={() => handleEdit(cat)}
                                                    title="Editar Categoria"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50/50 dark:hover:bg-red-950/20" 
                                                    onClick={() => deleteCategory(cat.id)}
                                                    title="Remover Categoria"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </Card>
            </div>

            {/* MODAL DIALOG (CRIAR E EDITAR) */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[480px]">
                    <form onSubmit={submit}>
                        <DialogHeader>
                            <DialogTitle className="text-lg font-bold">
                                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                Defina as diretrizes organizacionais da categoria abaixo.
                            </DialogDescription>
                        </DialogHeader>
                        
                        <div className="py-5 grid gap-4">
                            
                            {/* Nome */}
                            <div className="grid gap-2">
                                <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                    Nome da Categoria *
                                </Label>
                                <Input 
                                    id="name" 
                                    value={data.name} 
                                    onChange={e => setData('name', e.target.value)} 
                                    placeholder="Ex: Eletrónicos, Consumíveis, Licenças de Software"
                                    className="h-10"
                                />
                                {errors.name && (
                                    <p className="text-xs font-medium text-red-500 flex items-center gap-1 mt-0.5">
                                        <AlertCircle className="h-3 w-3" /> {errors.name}
                                    </p>
                                )}
                            </div>

                            {/* Categoria Pai */}
                            <div className="grid gap-2">
                                <Label htmlFor="parent" className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                    Hierarquia / Categoria Pai
                                </Label>
                                <Select 
                                    value={data.parent_id} 
                                    onValueChange={val => setData('parent_id', val)}
                                >
                                    <SelectTrigger className="h-10">
                                        <SelectValue placeholder="Selecione o nível de agrupamento..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">
                                            <span className="font-semibold text-slate-500">Nível Principal (Nenhuma)</span>
                                        </SelectItem>
                                        {/* Filtra para que a categoria não seja filha de si própria na edição */}
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
                                <Label htmlFor="desc" className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                    Descrição Operacional
                                </Label>
                                <Textarea 
                                    id="desc" 
                                    value={data.description} 
                                    onChange={e => setData('description', e.target.value)} 
                                    placeholder="Descreva o tipo de itens agrupados sob esta categoria..."
                                    className="min-h-[90px] resize-y text-sm"
                                />
                                {errors.description && (
                                    <p className="text-xs font-medium text-red-500 flex items-center gap-1 mt-0.5">
                                        <AlertCircle className="h-3 w-3" /> {errors.description}
                                    </p>
                                )}
                            </div>

                        </div>

                        <DialogFooter className="gap-2 sm:gap-0 border-t pt-4">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? 'A gravar alterações...' : 'Salvar Categoria'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}