import { Head, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { MapPin, Plus, Trash2, Phone, Hash, Pencil, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useState } from 'react';
import { toast } from 'sonner';
import { PageHeader, StockBadge, TableCard, PrimaryButton, OutlineButton } from '@/components/ui/brand';

interface Branch {
    id: number;
    name: string;
    code: string;
    address: string | null;
    phone: string | null;
    status: string;
}

export default function BranchesIndex() {
    const { branches } = usePage<{ branches: Branch[] }>().props;
    const [open, setOpen] = useState(false);
    const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

    const { data, setData, post, put, processing, reset, errors } = useForm({
        name: '',
        code: '',
        address: '',
        phone: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingBranch) {
            put(`/branches/${editingBranch.id}`, {
                onSuccess: () => {
                    setOpen(false);
                    setEditingBranch(null);
                    reset();
                    toast.success('Filial atualizada com sucesso!');
                },
            });
        } else {
            post('/branches', {
                onSuccess: () => {
                    setOpen(false);
                    reset();
                    toast.success('Filial criada com sucesso!');
                },
            });
        }
    };

    const handleEdit = (branch: Branch) => {
        setEditingBranch(branch);
        setData({
            name: branch.name,
            code: branch.code,
            address: branch.address || '',
            phone: branch.phone || '',
        });
        setOpen(true);
    };

    const handleNew = () => {
        setEditingBranch(null);
        reset();
        setOpen(true);
    };

    const deleteBranch = (id: number) => {
        if (confirm('Tem certeza que deseja remover esta filial?')) {
            import('@inertiajs/react').then(({ router }) => {
                router.delete(`/branches/${id}`, {
                    onSuccess: () => toast.success('Filial removida com sucesso!'),
                });
            });
        }
    };

    return (
        <>
            <Head title="Filiais" />

            <div className="flex flex-col gap-6">
                {/* Page Header */}
                <PageHeader
                    title="Filiais"
                    subtitle="Gerencie as unidades da sua empresa"
                    actions={
                        <Dialog open={open} onOpenChange={(val) => {
                            setOpen(val);
                            if (!val) setEditingBranch(null);
                        }}>
                            <DialogTrigger asChild>
                                <PrimaryButton onClick={handleNew} className="gap-1.5 h-9 px-3.5">
                                    <Plus className="h-3.5 w-3.5" />
                                    Nova Filial
                                </PrimaryButton>
                            </DialogTrigger>
                            <DialogContent className="rounded-[4px]">
                                <form onSubmit={submit}>
                                    <DialogHeader>
                                        <DialogTitle className="text-slate-900">
                                            {editingBranch ? 'Editar Filial' : 'Adicionar Filial'}
                                        </DialogTitle>
                                        <DialogDescription className="text-slate-500">
                                            {editingBranch
                                                ? 'Atualize os dados da filial selecionada.'
                                                : 'Preencha os dados da nova filial ou ponto de venda.'}
                                        </DialogDescription>
                                    </DialogHeader>

                                    <div className="grid gap-4 py-4">
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="name" className="text-sm font-medium text-slate-700">
                                                Nome da Filial
                                            </Label>
                                            <Input
                                                id="name"
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                placeholder="Ex: Loja Central, Depósito Norte"
                                                className="border border-slate-200 rounded-[4px] focus:ring-1 focus:ring-[#2DB8A0]"
                                            />
                                            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-1.5">
                                                <Label htmlFor="code" className="text-sm font-medium text-slate-700">
                                                    Código
                                                </Label>
                                                <Input
                                                    id="code"
                                                    value={data.code}
                                                    onChange={(e) => setData('code', e.target.value)}
                                                    placeholder="Ex: UN-001"
                                                    className="border border-slate-200 rounded-[4px] focus:ring-1 focus:ring-[#2DB8A0]"
                                                />
                                                {errors.code && <p className="text-xs text-red-500">{errors.code}</p>}
                                            </div>
                                            <div className="grid gap-1.5">
                                                <Label htmlFor="phone" className="text-sm font-medium text-slate-700">
                                                    Telefone
                                                </Label>
                                                <Input
                                                    id="phone"
                                                    value={data.phone}
                                                    onChange={(e) => setData('phone', e.target.value)}
                                                    placeholder="+258..."
                                                    className="border border-slate-200 rounded-[4px] focus:ring-1 focus:ring-[#2DB8A0]"
                                                />
                                                {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
                                            </div>
                                        </div>

                                        <div className="grid gap-1.5">
                                            <Label htmlFor="address" className="text-sm font-medium text-slate-700">
                                                Endereço Completo
                                            </Label>
                                            <Input
                                                id="address"
                                                value={data.address}
                                                onChange={(e) => setData('address', e.target.value)}
                                                placeholder="Rua, Bairro, Cidade..."
                                                className="border border-slate-200 rounded-[4px] focus:ring-1 focus:ring-[#2DB8A0]"
                                            />
                                            {errors.address && <p className="text-xs text-red-500">{errors.address}</p>}
                                        </div>
                                    </div>

                                    <DialogFooter>
                                        <OutlineButton type="button" onClick={() => setOpen(false)}>
                                            Cancelar
                                        </OutlineButton>
                                        <PrimaryButton type="submit" className={processing ? 'opacity-60 cursor-not-allowed' : ''}>
                                            {processing ? 'A guardar...' : (editingBranch ? 'Atualizar' : 'Guardar')}
                                        </PrimaryButton>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    }
                />

                {/* Table */}
                <TableCard>
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow className="border-b border-slate-200">
                                <TableHead className="w-[280px] text-[11px] font-semibold uppercase tracking-wide text-slate-500 py-3">
                                    Filial
                                </TableHead>
                                <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 py-3">
                                    Empresa
                                </TableHead>
                                <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 py-3">
                                    Tipo
                                </TableHead>
                                <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 py-3">
                                    Estado
                                </TableHead>
                                <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wide text-slate-500 py-3">
                                    Acções
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {branches.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-40 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <Building2 className="h-8 w-8 text-slate-300" />
                                            <p className="text-sm text-slate-400">Nenhuma filial cadastrada.</p>
                                            <p className="text-xs text-slate-300">Clique em &quot;Nova Filial&quot; para começar.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                branches.map((branch) => (
                                    <TableRow key={branch.id} className="hover:bg-slate-50 border-b border-slate-100 last:border-0">
                                        {/* FILIAL — name + address sub */}
                                        <TableCell className="py-3">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-semibold text-[13px] text-slate-900">{branch.name}</span>
                                                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                                                    {branch.address ? (
                                                        <>
                                                            <MapPin className="h-3 w-3 flex-shrink-0" />
                                                            <span className="truncate max-w-[200px]">{branch.address}</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Hash className="h-3 w-3 flex-shrink-0" />
                                                            <span className="font-mono uppercase tracking-wider">{branch.code}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>

                                        {/* EMPRESA */}
                                        <TableCell className="py-3">
                                            <span className="text-[12px] text-slate-600">—</span>
                                        </TableCell>

                                        {/* TIPO */}
                                        <TableCell className="py-3">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-semibold bg-slate-100 text-slate-600 uppercase tracking-wide">
                                                Filial
                                            </span>
                                        </TableCell>

                                        {/* ESTADO */}
                                        <TableCell className="py-3">
                                            <StockBadge status={branch.status === 'active' ? 'active' : 'inactive'} />
                                        </TableCell>

                                        {/* ACÇÕES */}
                                        <TableCell className="py-3 text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEdit(branch)}
                                                    className="h-8 w-8 text-slate-400 hover:text-[#2DB8A0] hover:bg-[#2DB8A0]/10 rounded-[4px]"
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => deleteBranch(branch.id)}
                                                    className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-[4px]"
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
        </>
    );
}

BranchesIndex.layout = (page: any) => (
    <AppLayout breadcrumbs={[
        { title: 'Catálogo', href: '#' },
        { title: 'Filiais', href: '/branches' },
    ]}>
        {page}
    </AppLayout>
);
