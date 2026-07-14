import { Head, useForm } from '@inertiajs/react';
import { KeyRound, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useConfirmDelete } from '@/contexts/confirm-delete-context';

export default function RolesIndex({ roles, permissions }: { roles: any[], permissions: Record<string, any[]> }) {
    const { confirmDelete } = useConfirmDelete();
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<any>(null);

    const form = useForm({
        name: '',
        permissions: [] as string[],
    });

    const editForm = useForm({
        name: '',
        permissions: [] as string[],
    });

    const openAdd = () => {
        form.reset();
        setIsAddOpen(true);
    };

    const openEdit = (role: any) => {
        setEditingRole(role);
        editForm.setData({
            name: role.name,
            permissions: role.permissions.map((p: any) => p.name),
        });
        setIsEditOpen(true);
    };

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/settings/roles', {
            preserveScroll: true,
            onSuccess: () => {
                setIsAddOpen(false);
                form.reset();
            }
        });
    };

    const handleEdit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!editingRole) {
return;
}

        editForm.put(`/settings/roles/${editingRole.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setIsEditOpen(false);
                editForm.reset();
            }
        });
    };

    const handleDelete = (id: number) => {
        confirmDelete({
            url: `/settings/roles/${id}`,
            title: 'Remover Papel / Perfil',
            description: 'Tens a certeza que pretendes remover este papel? Os utilizadores com este papel perderão os acessos correspondentes.',
            onSuccess: () => toast.success('Papel removido com sucesso!'),
        });
    };

    const handlePermissionToggle = (permissionName: string, isEdit = false) => {
        const targetForm = isEdit ? editForm : form;
        const currentPermissions = targetForm.data.permissions;

        if (currentPermissions.includes(permissionName)) {
            targetForm.setData('permissions', currentPermissions.filter(p => p !== permissionName));
        } else {
            targetForm.setData('permissions', [...currentPermissions, permissionName]);
        }
    };

    const renderPermissionsGrid = (targetForm: any, isEdit = false) => {
        return (
            <div className="grid grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto pr-2 mt-4">
                {Object.entries(permissions).map(([group, groupPermissions]) => (
                    <div key={group} className="border p-3 rounded-md bg-slate-50">
                        <h4 className="font-semibold capitalize mb-2 text-sm text-slate-700">{group}</h4>
                        <div className="space-y-2">
                            {groupPermissions?.map(p => p && (
                                <div key={p.id} className="flex items-center gap-2">
                                    <Checkbox
                                        id={`${isEdit ? 'edit-' : ''}perm-${p.id}`}
                                        checked={targetForm.data.permissions.includes(p.name)}
                                        onCheckedChange={() => handlePermissionToggle(p.name, isEdit)}
                                    />
                                    <Label htmlFor={`${isEdit ? 'edit-' : ''}perm-${p.id}`} className="text-xs font-normal">
                                        {p.name.split('.')[1]}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <>
            <Head title="Papéis e Permissões" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <Heading
                        variant="small"
                        title="Papéis e Permissões"
                        description="Cria papéis personalizados e define os acessos que cada um possui."
                    />
                    <Button onClick={openAdd} className="bg-[#2DB8A0] hover:bg-[#239B86] gap-2">
                        <KeyRound className="h-4 w-4" />
                        Criar Papel
                    </Button>
                </div>

                <div className="border rounded-md bg-white overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome do Papel</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {roles?.map((role: any) => role && (
                                <TableRow key={role.id}>
                                    <TableCell className="font-medium">{role.name}</TableCell>
                                    <TableCell>
                                        {role.company_id === null ? (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                Sistema
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                                Personalizado
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {role.company_id !== null && (
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => openEdit(role)}>
                                                    <Pencil className="h-4 w-4 text-slate-500" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(role.id)}>
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {roles.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center text-slate-500">
                                        Nenhum papel encontrado.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* ADD DIALOG */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Criar Papel</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAdd} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome do Papel</Label>
                            <Input
                                id="name"
                                value={form.data.name}
                                onChange={e => form.setData('name', e.target.value)}
                                placeholder="Ex: Comercial Senior"
                                required
                            />
                            <InputError message={form.errors.name} />
                        </div>
                        
                        <div>
                            <Label className="mb-2 block">Permissões de Acesso</Label>
                            {renderPermissionsGrid(form, false)}
                        </div>

                        <DialogFooter className="mt-4">
                            <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={form.processing} className="bg-[#2DB8A0] hover:bg-[#239B86]">Criar Papel</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* EDIT DIALOG */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Editar Papel</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleEdit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Nome do Papel</Label>
                            <Input
                                id="edit-name"
                                value={editForm.data.name}
                                onChange={e => editForm.setData('name', e.target.value)}
                                required
                            />
                            <InputError message={editForm.errors.name} />
                        </div>
                        
                        <div>
                            <Label className="mb-2 block">Permissões de Acesso</Label>
                            {renderPermissionsGrid(editForm, true)}
                        </div>

                        <DialogFooter className="mt-4">
                            <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={editForm.processing} className="bg-[#2DB8A0] hover:bg-[#239B86]">Guardar Alterações</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
