import React from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import { ArrowLeft, Save, User, Phone, Mail, MapPin, Plus, Trash2, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

interface Contact {
    id?: number;
    name: string;
    role: string;
    phone: string;
    email: string;
}

interface Address {
    id?: number;
    type: 'billing' | 'delivery';
    address: string;
    city: string;
}

interface Props {
    customer: {
        id: number;
        name: string;
        nuit: string;
        email: string | null;
        phone: string | null;
        address: string | null;
        credit_limit: number;
        is_active: boolean;
        contacts: Contact[];
        addresses: Address[];
    };
}

export default function CustomerEdit({ customer }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: customer.name,
        nuit: customer.nuit,
        email: customer.email ?? '',
        phone: customer.phone ?? '',
        address: customer.address ?? '',
        credit_limit: customer.credit_limit,
        is_active: customer.is_active,
        contacts: customer.contacts.length > 0 ? customer.contacts : [{ name: '', role: '', phone: '', email: '' }],
        addresses: customer.addresses.length > 0 ? customer.addresses : [{ type: 'billing' as const, address: '', city: '' }],
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/billing/customers/${customer.id}`);
    };

    // Contact helpers
    const addContact = () => {
        setData('contacts', [...data.contacts, { name: '', role: '', phone: '', email: '' }]);
    };
    const removeContact = (index: number) => {
        if (data.contacts.length <= 1) return;
        setData('contacts', data.contacts.filter((_, i) => i !== index));
    };
    const updateContact = (index: number, field: keyof Contact, value: string) => {
        const updated = [...data.contacts];
        updated[index] = { ...updated[index], [field]: value };
        setData('contacts', updated);
    };

    // Address helpers
    const addAddress = () => {
        setData('addresses', [...data.addresses, { type: 'billing' as const, address: '', city: '' }]);
    };
    const removeAddress = (index: number) => {
        if (data.addresses.length <= 1) return;
        setData('addresses', data.addresses.filter((_, i) => i !== index));
    };
    const updateAddress = (index: number, field: keyof Address, value: string) => {
        const updated = [...data.addresses];
        updated[index] = { ...updated[index], [field]: value as any };
        setData('addresses', updated);
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Faturação', href: '#' },
        { title: 'Clientes', href: '/billing/customers' },
        { title: `Editar: ${customer.name}`, href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Editar Cliente: ${customer.name}`} />

            <div className="flex items-center gap-3 mb-6">
                <Link href="/billing/customers">
                    <Button variant="ghost" size="sm" className="gap-1.5">
                        <ArrowLeft size={14} /> Voltar
                    </Button>
                </Link>
                <div>
                    <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Editar Cliente</h1>
                </div>
            </div>

            <form onSubmit={submit} className="space-y-6">
                {/* Dados Principais */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <User size={14} className="text-blue-500" /> Dados Pessoais / Fiscais
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome <span className="text-red-500">*</span></Label>
                            <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="Nome completo ou razão social" />
                            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="nuit">NUIT <span className="text-red-500">*</span></Label>
                            <Input id="nuit" value={data.nuit} onChange={(e) => setData('nuit', e.target.value)} placeholder="000000000" className="font-mono" />
                            {errors.nuit && <p className="text-xs text-red-500">{errors.nuit}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Telefone</Label>
                            <Input id="phone" value={data.phone} onChange={(e) => setData('phone', e.target.value)} placeholder="+258 8X XXX XXXX" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} placeholder="cliente@empresa.co.mz" />
                            {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="address">Morada Principal</Label>
                            <Textarea id="address" value={data.address ?? ''} onChange={(e) => setData('address', e.target.value)} placeholder="Morada completa" rows={2} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="credit_limit">Limite de Crédito (MZN)</Label>
                            <Input id="credit_limit" type="number" step="0.01" min="0" value={data.credit_limit} onChange={(e) => setData('credit_limit', parseFloat(e.target.value) || 0)} />
                        </div>
                        <div className="flex items-center space-x-2 pt-6">
                            <Switch id="is_active" checked={data.is_active} onCheckedChange={(v) => setData('is_active', v)} />
                            <Label htmlFor="is_active" className="cursor-pointer">Cliente Activo</Label>
                        </div>
                    </CardContent>
                </Card>

                {/* Contactos */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Briefcase size={14} className="text-blue-500" /> Contactos
                        </CardTitle>
                        <Button type="button" variant="outline" size="sm" onClick={addContact} className="gap-1.5">
                            <Plus size={14} /> Adicionar Contacto
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {data.contacts.map((contact, index) => (
                            <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 border border-zinc-100 dark:border-zinc-800 rounded-lg relative">
                                <Button type="button" variant="ghost" size="sm" className="absolute top-2 right-2 h-6 w-6 p-0 text-red-400 hover:text-red-600" onClick={() => removeContact(index)}>
                                    <Trash2 size={14} />
                                </Button>
                                <div className="space-y-1">
                                    <Label className="text-xs">Nome</Label>
                                    <Input size="sm" value={contact.name} onChange={(e) => updateContact(index, 'name', e.target.value)} placeholder="Nome do contacto" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Função</Label>
                                    <Input size="sm" value={contact.role} onChange={(e) => updateContact(index, 'role', e.target.value)} placeholder="Ex: Gerente" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Telefone</Label>
                                    <Input size="sm" value={contact.phone} onChange={(e) => updateContact(index, 'phone', e.target.value)} placeholder="+258..." />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Email</Label>
                                    <Input size="sm" type="email" value={contact.email} onChange={(e) => updateContact(index, 'email', e.target.value)} placeholder="email@..." />
                                </div>
                            </div>
                        ))}
                        {errors.contacts && <p className="text-xs text-red-500">{errors.contacts}</p>}
                    </CardContent>
                </Card>

                {/* Endereços */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <MapPin size={14} className="text-blue-500" /> Endereços
                        </CardTitle>
                        <Button type="button" variant="outline" size="sm" onClick={addAddress} className="gap-1.5">
                            <Plus size={14} /> Adicionar Endereço
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {data.addresses.map((address, index) => (
                            <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 border border-zinc-100 dark:border-zinc-800 rounded-lg relative">
                                <Button type="button" variant="ghost" size="sm" className="absolute top-2 right-2 h-6 w-6 p-0 text-red-400 hover:text-red-600" onClick={() => removeAddress(index)}>
                                    <Trash2 size={14} />
                                </Button>
                                <div className="space-y-1">
                                    <Label className="text-xs">Tipo</Label>
                                    <Select value={address.type} onValueChange={(v) => updateAddress(index, 'type', v as any)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="billing">Cobrança</SelectItem>
                                            <SelectItem value="delivery">Entrega</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1 md:col-span-2">
                                    <Label className="text-xs">Morada</Label>
                                    <Input size="sm" value={address.address} onChange={(e) => updateAddress(index, 'address', e.target.value)} placeholder="Rua, número, bairro..." />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Cidade</Label>
                                    <Input size="sm" value={address.city} onChange={(e) => updateAddress(index, 'city', e.target.value)} placeholder="Maputo, Beira..." />
                                </div>
                            </div>
                        ))}
                        {errors.addresses && <p className="text-xs text-red-500">{errors.addresses}</p>}
                    </CardContent>
                </Card>

                {/* Submeter */}
                <div className="flex items-center justify-end gap-3">
                    <Link href="/billing/customers">
                        <Button type="button" variant="outline">Cancelar</Button>
                    </Link>
                    <Button type="submit" disabled={processing} className="gap-2 min-w-[180px]">
                        <Save size={16} />
                        {processing ? 'A actualizar...' : 'Actualizar Cliente'}
                    </Button>
                </div>
            </form>
        </AppLayout>
    );
}