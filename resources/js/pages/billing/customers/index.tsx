import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Pencil, Trash2, Search, X, User, Phone, Mail, Eye, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { PageHeader, TableCard, PrimaryButton, OutlineButton } from '@/components/ui/brand';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { useConfirmDelete } from '@/contexts/confirm-delete-context';

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

    const { confirmDelete } = useConfirmDelete();

    const handleDelete = (id: number, name: string) => {
        confirmDelete({
            url: `/billing/customers/${id}`,
            title: 'Eliminar Cliente',
            description: `Tem a certeza que pretende eliminar o cliente "${name}"?`,
        });
    };

    return (
        <>
            <Head title="Clientes" />

            <div className="p-6 space-y-4 bg-slate-50 min-h-screen">
                {/* PAGE HEADER */}
                <PageHeader
                    title="Clientes"
                    subtitle="Base de dados de clientes e entidades associadas."
                    actions={
                        <Link href="/billing/customers/create">
                            <PrimaryButton>
                                <Plus className="h-4 w-4" />
                                Novo Cliente
                            </PrimaryButton>
                        </Link>
                    }
                />

                {/* FILTERS BAR */}
                <div className="flex items-center gap-3">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            className="pl-9 bg-white border-slate-200 rounded-[4px] h-9 text-sm focus-visible:ring-[#2DB8A0]/30"
                            placeholder="Pesquisar por nome, NUIT ou email..."
                            value={search}
                            onChange={handleSearch}
                        />
                    </div>
                    {filters.search && (
                        <OutlineButton onClick={clearSearch}>
                            <X className="h-3.5 w-3.5" />
                            Limpar
                        </OutlineButton>
                    )}
                    <span className="text-xs text-slate-400 font-medium ml-auto">
                        {customers.total} cliente{customers.total !== 1 ? 's' : ''}
                    </span>
                </div>

                {/* TABLE CARD */}
                <TableCard>
                    {customers.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <div className="h-12 w-12 rounded-[4px] bg-slate-100 flex items-center justify-center">
                                <Users className="h-6 w-6 text-slate-400" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-medium text-slate-600">Nenhum cliente encontrado</p>
                                <p className="text-xs text-slate-400 mt-0.5">Registe o primeiro cliente ou ajuste os filtros.</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50 border-b border-slate-100 hover:bg-slate-50">
                                        <TableHead className="uppercase text-[10px] tracking-wider text-slate-400 font-semibold">
                                            Cliente
                                        </TableHead>
                                        <TableHead className="uppercase text-[10px] tracking-wider text-slate-400 font-semibold">
                                            Tipo
                                        </TableHead>
                                        <TableHead className="uppercase text-[10px] tracking-wider text-slate-400 font-semibold">
                                            Contacto
                                        </TableHead>
                                        <TableHead className="uppercase text-[10px] tracking-wider text-slate-400 font-semibold">
                                            Localidade
                                        </TableHead>
                                        <TableHead className="uppercase text-[10px] tracking-wider text-slate-400 font-semibold text-right">
                                            Saldo
                                        </TableHead>
                                        <TableHead className="uppercase text-[10px] tracking-wider text-slate-400 font-semibold w-[100px]">
                                            Estado
                                        </TableHead>
                                        <TableHead className="uppercase text-[10px] tracking-wider text-slate-400 font-semibold text-right w-[100px]">
                                            Acções
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {customers.data.map((customer) => (
                                        <TableRow
                                            key={customer.id}
                                            className="hover:bg-slate-50/50 transition-colors border-b border-slate-100"
                                        >
                                            {/* CLIENTE */}
                                            <TableCell className="py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-[4px] bg-[#2DB8A0]/10 flex items-center justify-center flex-shrink-0">
                                                        <User className="h-4 w-4 text-[#2DB8A0]" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-900 leading-none">{customer.name}</p>
                                                        <p className="text-[10px] font-mono text-slate-400 mt-0.5 uppercase tracking-wider">
                                                            NUIT: {customer.nuit || '—'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            {/* TIPO */}
                                            <TableCell>
                                                <span className="inline-flex items-center text-[10px] font-semibold px-2 py-1 rounded-[4px] bg-slate-100 text-slate-600 uppercase tracking-wide">
                                                    {customer.nuit && customer.nuit.length > 9 ? 'Empresa' : 'Individual'}
                                                </span>
                                            </TableCell>

                                            {/* CONTACTO */}
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    {customer.phone && (
                                                        <span className="flex items-center gap-1.5 text-xs text-slate-600">
                                                            <Phone className="h-3 w-3 text-slate-400 flex-shrink-0" />
                                                            {customer.phone}
                                                        </span>
                                                    )}
                                                    {customer.email && (
                                                        <span className="flex items-center gap-1.5 text-xs text-slate-400">
                                                            <Mail className="h-3 w-3 flex-shrink-0" />
                                                            {customer.email}
                                                        </span>
                                                    )}
                                                    {!customer.phone && !customer.email && (
                                                        <span className="text-xs text-slate-400 italic">Sem contacto</span>
                                                    )}
                                                </div>
                                            </TableCell>

                                            {/* LOCALIDADE */}
                                            <TableCell>
                                                <span className="text-xs text-slate-600">
                                                    {customer.address || <span className="text-slate-400 italic">—</span>}
                                                </span>
                                            </TableCell>

                                            {/* SALDO */}
                                            <TableCell className="text-right">
                                                {Number(customer.balance) > 0 ? (
                                                    <span className="font-mono text-sm font-semibold text-red-500">
                                                        {Number(customer.balance).toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} MZN
                                                    </span>
                                                ) : (
                                                    <span className="font-mono text-sm font-semibold text-[#2DB8A0]">
                                                        0,00 MZN
                                                    </span>
                                                )}
                                            </TableCell>

                                            {/* ESTADO */}
                                            <TableCell>
                                                {customer.is_active ? (
                                                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-[4px] bg-[#2DB8A0]/10 text-[#2DB8A0]">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-[#2DB8A0] flex-shrink-0" />
                                                        Activo
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-[4px] bg-slate-100 text-slate-500">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 flex-shrink-0" />
                                                        Inactivo
                                                    </span>
                                                )}
                                            </TableCell>

                                            {/* ACÇÕES */}
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Link href={`/billing/customers/${customer.id}`}>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-[4px]"
                                                        >
                                                            <Eye className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </Link>
                                                    <Link href={`/billing/customers/${customer.id}/edit`}>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-slate-400 hover:text-[#2DB8A0] hover:bg-[#2DB8A0]/10 rounded-[4px]"
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-[4px]"
                                                        onClick={() => handleDelete(customer.id, customer.name)}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {/* PAGINAÇÃO */}
                            {customers.last_page > 1 && (
                                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                                    <p className="text-xs text-slate-400">
                                        Página {customers.current_page} de {customers.last_page}
                                    </p>
                                    <div className="flex gap-1">
                                        {customers.links.map((link, i) => (
                                            <button
                                                key={i}
                                                disabled={!link.url}
                                                onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                                className={cn(
                                                    'px-3 py-1.5 text-xs rounded-[4px] border transition-colors',
                                                    link.active
                                                        ? 'bg-[#1A2332] text-white border-transparent font-semibold'
                                                        : !link.url
                                                            ? 'text-slate-300 border-transparent cursor-not-allowed'
                                                            : 'border-slate-200 text-slate-600 hover:bg-slate-50 bg-white',
                                                )}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </TableCard>
            </div>
        </>
    );
}

CustomerIndex.layout = {
    breadcrumbs,
};