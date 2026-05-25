import { Head, usePage, useForm } from '@inertiajs/react';
import { Plus, Search, Tag, Edit, Trash2 } from 'lucide-react';
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
import { useState } from 'react';
import { toast } from 'sonner';

interface Brand {
    id: number;
    name: string;
}

export default function BrandsIndex() {
    const { brands } = usePage<{ brands: Brand[] }>().props;
    const [open, setOpen] = useState(false);
    const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
    const [search, setSearch] = useState('');

    const { data, setData, post, put, processing, reset, errors } = useForm({
        name: '',
    });

    const filteredBrands = brands.filter(b => 
        b.name.toLowerCase().includes(search.toLowerCase())
    );

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingBrand) {
            put(`/brands/${editingBrand.id}`, {
                onSuccess: () => {
                    setOpen(false);
                    reset();
                    toast.success('Marca atualizada!');
                }
            });
        } else {
            post('/brands', {
                onSuccess: () => {
                    setOpen(false);
                    reset();
                    toast.success('Marca criada!');
                }
            });
        }
    };

    const handleEdit = (brand: Brand) => {
        setEditingBrand(brand);
        setData({ name: brand.name });
        setOpen(true);
    };

    const handleNew = () => {
        setEditingBrand(null);
        reset();
        setOpen(true);
    };

    const deleteBrand = (id: number) => {
        if (confirm('Deseja excluir esta marca?')) {
            import('@inertiajs/react').then(({ router }) => {
                router.delete(`/brands/${id}`, {
                    onSuccess: () => toast.success('Marca removida!'),
                });
            });
        }
    };

    return (
        <>
            <Head title="Marcas" />

            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-white italic">Gestão de Marcas</h1>
                        <p className="text-muted-foreground text-sm">Gerencie os fabricantes e marcas dos seus produtos.</p>
                    </div>
                    <Button className="gap-2" onClick={handleNew}>
                        <Plus className="h-4 w-4" /> Nova Marca
                    </Button>
                </div>

                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <Input 
                        placeholder="Filtrar marcas..." 
                        className="pl-9 bg-white dark:bg-zinc-900"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="rounded-xl border border-zinc-200/50 bg-white/70 backdrop-blur-md dark:bg-zinc-900/70 overflow-hidden shadow-xs">
                    <Table>
                        <TableHeader className="bg-zinc-50/50 dark:bg-zinc-800/30">
                            <TableRow>
                                <TableHead className="w-[400px]">Nome da Marca</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredBrands.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={2} className="h-48 text-center text-muted-foreground">
                                        Nenhuma marca encontrada.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredBrands.map((brand) => (
                                    <TableRow key={brand.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Tag className="h-4 w-4 text-zinc-400" />
                                                <span className="font-semibold text-zinc-900 dark:text-zinc-100 italic">{brand.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-blue-600" onClick={() => handleEdit(brand)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-red-600" onClick={() => deleteBrand(brand.id)}>
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
                            <DialogTitle>{editingBrand ? 'Editar Marca' : 'Nova Marca'}</DialogTitle>
                            <DialogDescription>Nome do fabricante ou marca do item.</DialogDescription>
                        </DialogHeader>
                        <div className="py-4 grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nome da Marca</Label>
                                <Input id="name" value={data.name} onChange={e => setData('name', e.target.value)} placeholder="Ex: Apple, Samsung, Dell" />
                                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={processing}>Salvar Marca</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
