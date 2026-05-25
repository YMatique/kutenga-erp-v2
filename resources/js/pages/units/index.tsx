import { Head, usePage, useForm } from '@inertiajs/react';
import { Plus, Search, Ruler, Edit, Trash2 } from 'lucide-react';
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

    const deleteUnit = (id: number) => {
        if (confirm('Deseja excluir esta unidade de medida?')) {
            import('@inertiajs/react').then(({ router }) => {
                router.delete(`/units/${id}`, {
                    onSuccess: () => toast.success('Unidade removida!'),
                });
            });
        }
    };

    return (
        <>
            <Head title="Unidades de Medida" />

            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-white italic">Unidades de Medida</h1>
                        <p className="text-muted-foreground text-sm">Defina as métricas usadas para quantificar seus itens.</p>
                    </div>
                    <Button className="gap-2" onClick={handleNew}>
                        <Plus className="h-4 w-4" /> Nova Unidade
                    </Button>
                </div>

                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <Input 
                        placeholder="Filtrar unidades..." 
                        className="pl-9 bg-white dark:bg-zinc-900"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="rounded-xl border border-zinc-200/50 bg-white/70 backdrop-blur-md dark:bg-zinc-900/70 overflow-hidden shadow-xs">
                    <Table>
                        <TableHeader className="bg-zinc-50/50 dark:bg-zinc-800/30">
                            <TableRow>
                                <TableHead className="w-[300px]">Nome por Extenso</TableHead>
                                <TableHead>Sigla / Short Name</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUnits.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-48 text-center text-muted-foreground">
                                        Nenhuma unidade encontrada.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredUnits.map((unit) => (
                                    <TableRow key={unit.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Ruler className="h-4 w-4 text-zinc-400" />
                                                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{unit.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-xs font-mono font-bold text-zinc-600 dark:text-zinc-400 uppercase">
                                                {unit.short_name}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-blue-600" onClick={() => handleEdit(unit)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-red-600" onClick={() => deleteUnit(unit.id)}>
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
                            <DialogTitle>{editingUnit ? 'Editar Unidade' : 'Nova Unidade'}</DialogTitle>
                            <DialogDescription>As unidades são usadas para definir como você vende e compra seus itens.</DialogDescription>
                        </DialogHeader>
                        <div className="py-4 grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nome (Ex: Quilograma)</Label>
                                <Input id="name" value={data.name} onChange={e => setData('name', e.target.value)} placeholder="Ex: Unidade, Metro, Litro" />
                                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="short">Sigla (Ex: KG)</Label>
                                <Input id="short" value={data.short_name} onChange={e => setData('short_name', e.target.value)} placeholder="Ex: UN, M, LT" />
                                {errors.short_name && <p className="text-sm text-red-500">{errors.short_name}</p>}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={processing}>Salvar Unidade</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
