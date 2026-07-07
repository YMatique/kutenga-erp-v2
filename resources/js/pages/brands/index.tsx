import { Head, usePage, useForm } from '@inertiajs/react';
import { Plus, Search, Tag, Edit, Trash2, Award } from 'lucide-react';
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

            <div className="p-6 space-y-4 bg-slate-50 min-h-screen">
                {/* PAGE HEADER */}
                <PageHeader
                    title="Marcas"
                    subtitle="Gestão de marcas do catálogo de produtos."
                    actions={
                        <PrimaryButton onClick={handleNew}>
                            <Plus className="h-4 w-4" />
                            Nova Marca
                        </PrimaryButton>
                    }
                />

                {/* SEARCH BAR */}
                <div className="flex items-center gap-3">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Filtrar marcas por nome..."
                            className="pl-9 bg-white border-slate-200 rounded-[4px] h-9 text-sm focus-visible:ring-[#2DB8A0]/30"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <span className="text-xs text-slate-400 font-medium">
                        {filteredBrands.length} marca{filteredBrands.length !== 1 ? 's' : ''}
                    </span>
                </div>

                {/* TABLE CARD */}
                <TableCard>
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50 border-b border-slate-100 hover:bg-slate-50">
                                <TableHead className="uppercase text-[10px] tracking-wider text-slate-400 font-semibold">
                                    Nome da Marca
                                </TableHead>
                                <TableHead className="uppercase text-[10px] tracking-wider text-slate-400 font-semibold text-right w-[100px]">
                                    Acções
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredBrands.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={2} className="h-52 text-center">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="h-12 w-12 rounded-[4px] bg-slate-100 flex items-center justify-center">
                                                <Award className="h-6 w-6 text-slate-400" />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm font-medium text-slate-600">Nenhuma marca encontrada</p>
                                                <p className="text-xs text-slate-400 mt-0.5">Registe a primeira marca do catálogo.</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredBrands.map((brand) => (
                                    <TableRow
                                        key={brand.id}
                                        className="hover:bg-slate-50/50 transition-colors border-b border-slate-100"
                                    >
                                        <TableCell className="py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-[4px] bg-[#E8A020]/10 flex items-center justify-center flex-shrink-0">
                                                    <Tag className="h-4 w-4 text-[#E8A020]" />
                                                </div>
                                                <span className="font-semibold text-slate-900 text-sm">
                                                    {brand.name}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-400 hover:text-[#2DB8A0] hover:bg-[#2DB8A0]/10 rounded-[4px]"
                                                    onClick={() => handleEdit(brand)}
                                                >
                                                    <Edit className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-[4px]"
                                                    onClick={() => deleteBrand(brand.id)}
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
                                {editingBrand ? 'Editar Marca' : 'Nova Marca'}
                            </DialogTitle>
                            <DialogDescription className="text-xs text-slate-500">
                                Nome do fabricante ou marca do item.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-5 grid gap-4">
                            <div className="grid gap-2">
                                <Label
                                    htmlFor="name"
                                    className="text-xs font-semibold uppercase tracking-wider text-slate-500"
                                >
                                    Nome da Marca *
                                </Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    placeholder="Ex: Apple, Samsung, Dell"
                                    className="h-9 rounded-[4px] border-slate-200"
                                />
                                {errors.name && (
                                    <p className="text-xs text-red-500 mt-0.5">{errors.name}</p>
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
                                {processing ? 'A gravar...' : 'Salvar Marca'}
                            </button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
