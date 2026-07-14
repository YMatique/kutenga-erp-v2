import { Head, useForm, router } from '@inertiajs/react';
import { UserPlus, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useConfirmDelete } from '@/contexts/confirm-delete-context';
import { cn } from '@/lib/utils';

export default function UsersIndex({ users, roles }: { users: any, roles: any[] }) {
    const { confirmDelete } = useConfirmDelete();
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);

    const form = useForm({
        name: '',
        email: '',
        password: '',
        role: '',
    });

    const editForm = useForm({
        name: '',
        email: '',
        password: '',
        role: '',
    });

    const openAdd = () => {
        form.reset();
        setIsAddOpen(true);
    };

    const openEdit = (user: any) => {
        setEditingUser(user);
        editForm.setData({
            name: user.name,
            email: user.email,
            password: '',
            role: user.roles?.[0]?.name || '',
        });
        setIsEditOpen(true);
    };

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/settings/users', {
            preserveScroll: true,
            onSuccess: () => {
                setIsAddOpen(false);
                form.reset();
            }
        });
    };

    const handleEdit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!editingUser) {
return;
}

        editForm.put(`/settings/users/${editingUser.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setIsEditOpen(false);
                editForm.reset();
            }
        });
    };

    const handleDelete = (id: number) => {
        confirmDelete({
            url: `/settings/users/${id}`,
            title: 'Remover Utilizador',
            description: 'Tens a certeza que pretendes remover este utilizador? O seu acesso será revogado imediatamente.',
            onSuccess: () => toast.success('Utilizador removido com sucesso!'),
        });
    };

    return (
        <>
            <Head title="Equipa" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <Heading
                        variant="small"
                        title="Equipa"
                        description="Gere os membros da tua equipa e os seus acessos ao sistema."
                    />
                    <Button onClick={openAdd} className="bg-[#2DB8A0] hover:bg-[#239B86] gap-2">
                        <UserPlus className="h-4 w-4" />
                        Convidar Membro
                    </Button>
                </div>

                <div className="border rounded-md bg-white overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>E-mail</TableHead>
                                <TableHead>Papel</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users?.data?.map((user: any) => user && (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.name}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                                            {user.roles?.[0]?.name || 'Sem Papel'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(user)}>
                                                <Pencil className="h-4 w-4 text-slate-500" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(user.id)}>
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {users?.data?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-slate-500">
                                        Nenhum utilizador encontrado.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    {/* Pagination */}
                    {users?.last_page > 1 && (
                        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-white">
                            <p className="text-xs text-slate-500">
                                Página {users.current_page} de {users.last_page} · {users.total} registos
                            </p>
                            <div className="flex gap-1">
                                {users.links.map((link: any, i: number) => (
                                    <button
                                        key={i}
                                        disabled={!link.url}
                                        onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                        className={cn(
                                            'px-3 py-1.5 text-xs rounded-[4px] border transition-colors',
                                            link.active
                                                ? 'bg-[#2DB8A0] text-white border-transparent font-medium'
                                                : !link.url
                                                ? 'text-slate-300 border-transparent cursor-not-allowed'
                                                : 'border-slate-200 text-slate-600 hover:bg-slate-50',
                                        )}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Convidar Membro</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAdd} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome Completo</Label>
                            <Input
                                id="name"
                                value={form.data.name}
                                onChange={e => form.setData('name', e.target.value)}
                                required
                            />
                            <InputError message={form.errors.name} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">E-mail</Label>
                            <Input
                                id="email"
                                type="email"
                                value={form.data.email}
                                onChange={e => form.setData('email', e.target.value)}
                                required
                            />
                            <InputError message={form.errors.email} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Palavra-passe</Label>
                            <Input
                                id="password"
                                type="password"
                                value={form.data.password}
                                onChange={e => form.setData('password', e.target.value)}
                                required
                            />
                            <InputError message={form.errors.password} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="role">Papel / Nível de Acesso</Label>
                            <Select
                                value={form.data.role}
                                onValueChange={val => form.setData('role', val)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um papel" />
                                </SelectTrigger>
                                <SelectContent>
                                    {roles?.map(r => r && (
                                        <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={form.errors.role} />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={form.processing} className="bg-[#2DB8A0] hover:bg-[#239B86]">Adicionar</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Membro</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleEdit} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Nome Completo</Label>
                            <Input
                                id="edit-name"
                                value={editForm.data.name}
                                onChange={e => editForm.setData('name', e.target.value)}
                                required
                            />
                            <InputError message={editForm.errors.name} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-email">E-mail</Label>
                            <Input
                                id="edit-email"
                                type="email"
                                value={editForm.data.email}
                                onChange={e => editForm.setData('email', e.target.value)}
                                required
                            />
                            <InputError message={editForm.errors.email} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-password">Palavra-passe (Opcional)</Label>
                            <Input
                                id="edit-password"
                                type="password"
                                value={editForm.data.password}
                                onChange={e => editForm.setData('password', e.target.value)}
                                placeholder="Deixa em branco para manter a atual"
                            />
                            <InputError message={editForm.errors.password} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-role">Papel / Nível de Acesso</Label>
                            <Select
                                value={editForm.data.role}
                                onValueChange={val => editForm.setData('role', val)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um papel" />
                                </SelectTrigger>
                                <SelectContent>
                                    {roles?.map(r => r && (
                                        <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={editForm.errors.role} />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={editForm.processing} className="bg-[#2DB8A0] hover:bg-[#239B86]">Atualizar</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
