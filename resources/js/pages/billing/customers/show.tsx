import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, User, Phone, Mail, MapPin, Building2, CreditCard, Calendar, Briefcase, Edit, ReceiptText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

interface Contact {
    id: number;
    name: string;
    role: string | null;
    phone: string | null;
    email: string | null;
}

interface Address {
    id: number;
    type: 'billing' | 'delivery';
    address: string;
    city: string;
}

interface Customer {
    id: number;
    name: string;
    nuit: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    credit_limit: number;
    balance: number;
    is_active: boolean;
    contacts: Contact[];
    addresses: Address[];
    created_at: string;
    updated_at: string;
}

interface Props {
    customer: Customer;
}

export default function Show({ customer }: Props) {
    return (
        <>
            <Head title={`Cliente: ${customer.name}`} />

            {/* ─── Page Header ─────────────────────────────────────────── */}
            <div className="flex items-start justify-between mb-6">
                <div className="flex items-start gap-3">
                    <Link href="/billing/customers">
                        <Button variant="ghost" size="sm" className="gap-1.5 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 mt-0.5">
                            <ArrowLeft size={14} />
                            Voltar
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-2 mb-0.5">
                            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                                {customer.name}
                            </h1>
                            <Badge variant={customer.is_active ? 'default' : 'secondary'} className="ml-2">
                                {customer.is_active ? 'Activo' : 'Inactivo'}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
                            <span className="font-mono">NUIT: {customer.nuit}</span>
                            {customer.phone && <span>• {customer.phone}</span>}
                            {customer.email && <span>• {customer.email}</span>}
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Link href={`/billing/customers/${customer.id}/edit`}>
                        <Button variant="outline" className="gap-1.5">
                            <Edit size={14} />
                            Editar
                        </Button>
                    </Link>
                    <Link href={`/billing/documents/create?customer_id=${customer.id}`}>
                        <Button className="gap-1.5">
                            <ReceiptText size={14} />
                            Nova Fatura
                        </Button>
                    </Link>
                </div>
            </div>

            {/* ─── Cards de Resumo ─────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                            <CreditCard size={12} />
                            Saldo Corrente
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${Number(customer.balance) > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                            {Number(customer.balance).toLocaleString('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MZN
                        </div>
                        <p className="text-xs text-zinc-400 mt-1">
                            Limite de crédito: {Number(customer.credit_limit).toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} MZN
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                            <Building2 size={12} />
                            Morada Principal
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-zinc-800 dark:text-zinc-200">
                            {customer.address || <span className="text-zinc-400 italic">Não definida</span>}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                            <Calendar size={12} />
                            Detalhes do Registo
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1">
                        <p className="text-sm text-zinc-600 dark:text-zinc-300">
                            Criado em: {new Date(customer.created_at).toLocaleDateString('pt-MZ')}
                        </p>
                        <p className="text-sm text-zinc-600 dark:text-zinc-300">
                            Última atualização: {new Date(customer.updated_at).toLocaleDateString('pt-MZ')}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* ─── Contactos ───────────────────────────────────────────── */}
            {customer.contacts && customer.contacts.length > 0 && (
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Briefcase size={14} className="text-blue-500" />
                            Contactos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {customer.contacts.map((contact) => (
                                <div key={contact.id} className="p-3 border border-zinc-100 dark:border-zinc-800 rounded-lg">
                                    <div className="font-medium text-sm text-zinc-800 dark:text-zinc-200">
                                        {contact.name}
                                    </div>
                                    {contact.role && (
                                        <div className="text-xs text-zinc-500 dark:text-zinc-400">{contact.role}</div>
                                    )}
                                    <div className="flex flex-col gap-0.5 mt-1 text-sm">
                                        {contact.phone && (
                                            <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
                                                <Phone size={12} className="text-zinc-400" />
                                                {contact.phone}
                                            </div>
                                        )}
                                        {contact.email && (
                                            <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
                                                <Mail size={12} className="text-zinc-400" />
                                                {contact.email}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ─── Endereços ───────────────────────────────────────────── */}
            {customer.addresses && customer.addresses.length > 0 && (
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <MapPin size={14} className="text-blue-500" />
                            Endereços
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {customer.addresses.map((address) => (
                                <div key={address.id} className="p-3 border border-zinc-100 dark:border-zinc-800 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-xs">
                                            {address.type === 'billing' ? 'Cobrança' : 'Entrega'}
                                        </Badge>
                                    </div>
                                    <div className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
                                        {address.address}
                                    </div>
                                    <div className="text-sm text-zinc-500 dark:text-zinc-400">
                                        {address.city}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ─── Se não houver contactos nem endereços ───────────────── */}
            {(!customer.contacts || customer.contacts.length === 0) &&
                (!customer.addresses || customer.addresses.length === 0) && (
                    <Card>
                        <CardContent className="py-8 text-center text-zinc-500 dark:text-zinc-400">
                            <p>Este cliente não possui contactos ou endereços adicionais registados.</p>
                        </CardContent>
                    </Card>
                )}
        </>
    );
}

Show.layout = (page: any) => (
    <AppLayout breadcrumbs={[
        { title: 'Faturação', href: '#' },
        { title: 'Clientes', href: '/billing/customers' },
        { title: page.props?.customer?.name ?? 'Cliente', href: '#' },
    ]}>
        {page}
    </AppLayout>
);