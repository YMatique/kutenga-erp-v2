import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Pencil, Trash2, Search, X, User, Phone, Mail, MapPin, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

interface Customer {
    id: number;
    name: string;
    nuit: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    balance: string;
    is_active: boolean;
}

interface PaginatedCustomers {
    data: Customer[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Props {
    customers: PaginatedCustomers;
    filters: { search?: string };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Faturação', href: '#' },
    { title: 'Clientes', href: '/billing/customers' },
];

export default function CustomerIndex({ customers, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearch(value);
        const timeout = setTimeout(() => {
            router.get('/billing/customers', { search: value }, { preserveState: true, replace: true });
        }, 400);
        return () => clearTimeout(timeout);
    };

    const clearSearch = () => {
        setSearch('');
        router.get('/billing/customers', {}, { preserveState: false });
    };

    const handleDelete = (id: number, name: string) => {
        if (confirm(`Tem a certeza que pretende eliminar o cliente "${name}"?`)) {
            router.delete(`/billing/customers/${id}`);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Clientes" />

            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Clientes</h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {customers.total} cliente{customers.total !== 1 ? 's' : ''} encontrado{customers.total !== 1 ? 's' : ''}
                    </p>
                </div>
                <Link href="/billing/customers/create">
                    <Button className="gap-2">
                        <Plus size={16} />
                        Novo Cliente
                    </Button>
                </Link>
            </div>

            <Card className="mb-4">
                <CardContent className="pt-4 pb-4">
                    <div className="flex gap-3 items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={15} />
                            <Input
                                className="pl-9"
                                placeholder="Pesquisar por nome, NUIT ou email..."
                                value={search}
                                onChange={handleSearch}
                            />
                        </div>
                        {filters.search && (
                            <Button variant="ghost" size="sm" onClick={clearSearch} className="gap-1">
                                <X size={14} /> Limpar
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="pt-4">
                    {customers.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <User className="text-zinc-300 dark:text-zinc-600 mb-3" size={40} />
                            <p className="text-zinc-500 dark:text-zinc-400 font-medium">Nenhum cliente encontrado</p>
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nome</TableHead>
                                        <TableHead>NUIT</TableHead>
                                        <TableHead>Contacto</TableHead>
                                        <TableHead className="text-right">Saldo</TableHead>
                                        <TableHead className="text-center">Estado</TableHead>
                                        <TableHead className="text-right">Acções</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {customers.data.map((customer) => (
                                        <TableRow key={customer.id}>
                                            <TableCell className="font-medium">{customer.name}</TableCell>
                                            <TableCell className="font-mono text-sm">{customer.nuit}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col text-sm">
                                                    {customer.phone && <span className="flex items-center gap-1"><Phone size={12} /> {customer.phone}</span>}
                                                    {customer.email && <span className="flex items-center gap-1 text-zinc-500"><Mail size={12} /> {customer.email}</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                {Number(customer.balance) > 0 ? (
                                                    <span className="text-red-600 dark:text-red-400">{Number(customer.balance).toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} MZN</span>
                                                ) : (
                                                    <span className="text-emerald-600 dark:text-emerald-400">0.00 MZN</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {customer.is_active ? (
                                                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800">Activo</Badge>
                                                ) : (
                                                    <Badge variant="outline" className="bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400">Inactivo</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Link href={`/billing/customers/${customer.id}/edit`}>
                                                        <Button variant="ghost" size="sm">
                                                            <Pencil size={14} />
                                                        </Button>
                                                    </Link>
                                                    <Link href={`/billing/customers/${customer.id}`}>
                                                        <Button variant="ghost" size="sm">
                                                            <Eye size={14} />
                                                        </Button>
                                                    </Link>

                                                    <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-600" onClick={() => handleDelete(customer.id, customer.name)}>
                                                        <Trash2 size={14} />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {/* Paginação */}
                            {customers.last_page > 1 && (
                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                    <p className="text-sm text-zinc-500">Página {customers.current_page} de {customers.last_page}</p>
                                    <div className="flex gap-1">
                                        {customers.links.map((link, i) => (
                                            <button
                                                key={i}
                                                disabled={!link.url}
                                                onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                                className={[
                                                    'px-3 py-1.5 text-sm rounded-md border transition-colors',
                                                    link.active
                                                        ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-transparent font-medium'
                                                        : !link.url
                                                            ? 'text-zinc-300 dark:text-zinc-600 border-transparent cursor-not-allowed'
                                                            : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800',
                                                ].join(' ')}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </AppLayout>
    );
}