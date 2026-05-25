import { Head, useForm, usePage } from '@inertiajs/react';
import { MapPin, Plus, Trash2, Phone, Hash, MoreVertical } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { toast } from 'sonner';

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
            <Head title="Gestão de Unidades" />

            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-white italic">Unidades de Negócio</h1>
                        <p className="text-muted-foreground text-sm">
                            Gerencie os locais físicos e filiais da sua empresa.
                        </p>
                    </div>

                    <Dialog open={open} onOpenChange={(val) => {
                        setOpen(val);
                        if(!val) setEditingBranch(null);
                    }}>
                        <DialogTrigger asChild>
                            <Button className="gap-2" onClick={handleNew}>
                                <Plus className="h-4 w-4" />
                                Nova Unidade
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <form onSubmit={submit}>
                                <DialogHeader>
                                    <DialogTitle>{editingBranch ? 'Editar Unidade' : 'Adicionar Unidade'}</DialogTitle>
                                    <DialogDescription>
                                        {editingBranch ? 'Atualize os dados da unidade selecionada.' : 'Preencha os dados da nova filial ou ponto de venda.'}
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2 text-zinc-800 dark:text-zinc-200">
                                        <Label htmlFor="name">Nome da Unidade</Label>
                                        <Input
                                            id="name"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            placeholder="Ex: Loja Central, Depósito Norte"
                                        />
                                        {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="code" className="text-zinc-800 dark:text-zinc-200">Código / Indentificador</Label>
                                            <Input
                                                id="code"
                                                value={data.code}
                                                onChange={(e) => setData('code', e.target.value)}
                                                placeholder="Ex: UN-001"
                                            />
                                            {errors.code && <p className="text-sm text-red-500">{errors.code}</p>}
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="phone" className="text-zinc-800 dark:text-zinc-200">Telefone de Contato</Label>
                                            <Input
                                                id="phone"
                                                value={data.phone}
                                                onChange={(e) => setData('phone', e.target.value)}
                                                placeholder="+258..."
                                            />
                                            {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
                                        </div>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="address" className="text-zinc-800 dark:text-zinc-200">Endereço Completo</Label>
                                        <Input
                                            id="address"
                                            value={data.address}
                                            onChange={(e) => setData('address', e.target.value)}
                                            placeholder="Rua, Bairro, Cidade..."
                                        />
                                        {errors.address && <p className="text-sm text-red-500">{errors.address}</p>}
                                    </div>
                                </div>

                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                        Cancelar
                                    </Button>
                                    <Button type="submit" disabled={processing}>
                                        {processing ? 'Gravando...' : (editingBranch ? 'Atualizar Unidade' : 'Salvar Unidade')}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="rounded-xl border border-zinc-200/50 bg-white/70 backdrop-blur-md dark:bg-zinc-900/70 overflow-hidden shadow-xs">
                    <Table>
                        <TableHeader className="bg-zinc-50/50 dark:bg-zinc-800/30">
                            <TableRow>
                                <TableHead className="w-[300px]">Nome / Código</TableHead>
                                <TableHead>Contato</TableHead>
                                <TableHead>Localização</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {branches.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                        Nenhuma unidade cadastrada.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                branches.map((branch) => (
                                    <TableRow key={branch.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                                        <TableCell>
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-semibold text-zinc-900 dark:text-zinc-100 italic">{branch.name}</span>
                                                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono uppercase tracking-tighter">
                                                    <Hash className="h-2.5 w-2.5" />
                                                    {branch.code}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {branch.phone ? (
                                                <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                                                    <Phone className="h-3 w-3 text-zinc-400" />
                                                    {branch.phone}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-zinc-300 italic">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {branch.address ? (
                                                <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 truncate max-w-[200px]">
                                                    <MapPin className="h-3 w-3 text-zinc-400" />
                                                    {branch.address}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-zinc-300 italic">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={branch.status === 'active' ? 'default' : 'secondary'} className="px-1.5 py-0 text-[10px] font-bold">
                                                ATIVA
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEdit(branch)}
                                                    className="h-8 w-8 text-zinc-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                                                >
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => deleteBranch(branch.id)}
                                                    className="h-8 w-8 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
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
                </div>
            </div>
        </>
    );
}
