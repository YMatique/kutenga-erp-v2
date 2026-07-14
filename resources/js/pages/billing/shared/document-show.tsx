import { Head, Link, useForm } from '@inertiajs/react';
import {
    ReceiptText, CheckCircle2, Clock, Ban, ArrowLeft,
    Calendar, CreditCard, AlertCircle,
    Warehouse as WarehouseIcon, Printer, Plus, History,
    FileDown, Mail,
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
    Table, TableBody, TableCell, TableHead,
    TableHeader, TableRow, TableFooter,
} from '@/components/ui/table';
import { useConfirmDelete } from '@/contexts/confirm-delete-context';

interface DocumentItem {
    id: number;
    product_name: string;
    product_sku: string | null;
    quantity: string;
    unit_price: string;
    tax_rate: string;
    discount_percent: string;
    total: string;
}

interface DocumentSeries {
    id: number;
    code: string;
    name: string;
}

interface Document {
    id: number;
    document_number: string | null;
    document_type: string;
    status: string;
    payment_status: string | null;
    issue_date: string;
    due_date: string;
    customer_id: number | null;
    customer_name: string;
    customer_nuit: string;
    customer_phone: string | null;
    customer_email: string | null;
    customer_address: string | null;
    subtotal: string;
    tax_total: string;
    discount_total: string;
    grand_total: string;
    notes: string | null;
    series: DocumentSeries | null;
    items: DocumentItem[];
    has_physical_products?: boolean;
    created_at: string;
    updated_at: string;
    company?: {
        name: string;
        nuit: string | null;
        address: string | null;
        phone: string | null;
        email: string | null;
    } | null;
    referenced_document_id?: number | null;
    referenced_document?: Document | null;
}

interface Warehouse {
    id: number;
    name: string;
}

interface Props {
    document: Document;
    warehouses?: Warehouse[];
    type: string;
    backRoute: string;
    confirmRoute: string;
    cancelRoute: string;
    receivePaymentRoute?: string;
}

const TYPE_LABELS: Record<string, string> = {
    FT: 'Fatura a Crédito',
    FR: 'Fatura-Recibo',
    CT: 'Cotação / Orçamento',
    NC: 'Nota de Crédito',
    ND: 'Nota de Débito',
    GR: 'Guia de Remessa',
};

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
    draft:     { label: 'Rascunho',   icon: <Clock size={13} />,        className: 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700' },
    confirmed: { label: 'Confirmado', icon: <CheckCircle2 size={13} />, className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' },
    paid:      { label: 'Pago',       icon: <CheckCircle2 size={13} />, className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800' },
    partial:   { label: 'Parcial',    icon: <CreditCard size={13} />,   className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800' },
    cancelled: { label: 'Cancelado',  icon: <Ban size={13} />,          className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800' },
};

function fmt(n: number | string): string {
    return Number(n).toLocaleString('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) {
return '—';
}

    try {
        const cleanDateStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
        const parts = cleanDateStr.split('-');

        if (parts.length === 3) {
            const [year, month, day] = parts;

            return `${day}/${month}/${year}`;
        }

        const date = new Date(dateStr);

        if (isNaN(date.getTime())) {
return dateStr;
}

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        return `${day}/${month}/${year}`;
    } catch {
        return dateStr;
    }
}

export default function DocumentShow({
    document: doc,
    warehouses = [],
    type,
    backRoute,
    confirmRoute,
    cancelRoute,
    receivePaymentRoute,
}: Props) {
    const { confirmDelete } = useConfirmDelete();
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [isEmailOpen, setIsEmailOpen] = useState(false);

    const confirmForm = useForm({ warehouse_id: warehouses[0]?.id?.toString() ?? '' });
    const paymentForm = useForm({
        customer_id: doc.customer_id?.toString() ?? '',
        amount: doc.grand_total,
        payment_method: 'Cash',
        reference: '',
    });
    const cancelForm = useForm({});
    const emailForm = useForm({
        email: doc.customer_email ?? '',
    });

    const handleConfirm = () => confirmForm.post(confirmRoute);

    const handleCancel = () => {
        confirmDelete({
            url: cancelRoute,
            title: 'Cancelar Documento',
            description: 'Tem a certeza que pretende cancelar este documento? Esta ação reverterá stock e saldos correspondentes.',
            onSuccess: () => toast.success('Documento cancelado com sucesso!'),
            method: 'post',
            confirmLabel: 'Confirmar Cancelamento',
        });
    };

    const handleRegisterPayment = () => {
        if (!receivePaymentRoute) {
return;
}

        paymentForm.post(receivePaymentRoute, {
            onSuccess: () => {
 setIsPaymentOpen(false); paymentForm.reset('reference'); 
},
        });
    };

    const handleSendEmail = () => {
        emailForm.post(`/billing/documents/${doc.id}/send-email`, {
            onSuccess: () => {
 setIsEmailOpen(false); 
},
        });
    };

    const status = STATUS_CONFIG[doc.status] ?? STATUS_CONFIG.draft;
    const isDraft = doc.status === 'draft';
    const isCancelled = doc.status === 'cancelled';
    const isConfirmed = doc.status === 'confirmed' || doc.status === 'partial';
    const needsWarehouse = ['FT', 'FR', 'NC', 'GR'].includes(type) && doc.has_physical_products;

    return (
        <>
            <Head title={`${TYPE_LABELS[doc.document_type] ?? doc.document_type} ${doc.document_number ?? '— Rascunho'}`} />

            {/* ── Page Header ───────────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6 print:hidden">
                <div className="flex items-start gap-2">
                    <Link href={backRoute}>
                        <Button variant="ghost" size="sm" className="gap-1.5 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200">
                            <ArrowLeft size={14} />
                            Voltar
                        </Button>
                    </Link>
                    <div className="mt-0.5">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="inline-flex items-center rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-1.5 py-0.5 text-xs font-mono text-zinc-600 dark:text-zinc-400">
                                {doc.document_type}
                            </span>
                            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                                {TYPE_LABELS[doc.document_type] ?? doc.document_type}
                                {doc.document_number && (
                                    <span className="font-mono ml-2 text-blue-600 dark:text-blue-400">{doc.document_number}</span>
                                )}
                            </h1>
                        </div>
                        {doc.referenced_document && (
                            <p className="text-xs text-zinc-500 mb-1">
                                {doc.document_type === 'NC' ? 'Retifica o documento: ' : 'Retificativo do documento: '}
                                <Link
                                    href={doc.referenced_document.document_type === 'FR' 
                                        ? `/billing/receipts/${doc.referenced_document.id}` 
                                        : `/billing/invoices/${doc.referenced_document.id}`}
                                    className="font-mono font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                    {doc.referenced_document.document_number}
                                </Link>
                            </p>
                        )}
                        <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${status.className}`}>
                                {status.icon} {status.label}
                            </span>
                            {doc.series && (
                                <span className="text-xs text-zinc-400">Série {doc.series.code}</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
                    <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1.5">
                        <Printer size={14} />
                        Imprimir
                    </Button>

                    {(type === 'FT' || type === 'FR') && !isDraft && !isCancelled && (
                        <>
                            <Link href={`/billing/credit-notes/create?referenced_document_id=${doc.id}`}>
                                <Button variant="outline" size="sm" className="gap-1.5 border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-900 dark:text-amber-400 dark:hover:bg-amber-950/20">
                                    Emitir Nota de Crédito
                                </Button>
                            </Link>
                            <Link href={`/billing/debit-notes/create?referenced_document_id=${doc.id}`}>
                                <Button variant="outline" size="sm" className="gap-1.5 border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-400 dark:hover:bg-blue-950/20">
                                    Emitir Nota de Débito
                                </Button>
                            </Link>
                        </>
                    )}

                    <a href={`/billing/documents/${doc.id}/pdf`} target="_blank" rel="noopener noreferrer" className="inline-block">
                        <Button variant="outline" size="sm" className="gap-1.5 border-border text-foreground hover:bg-muted font-medium">
                            <FileDown size={14} />
                            Descarregar PDF
                        </Button>
                    </a>

                    <Dialog open={isEmailOpen} onOpenChange={setIsEmailOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-1.5 border-border text-foreground hover:bg-muted font-medium">
                                <Mail size={14} />
                                Enviar por Email
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Enviar Documento por Email</DialogTitle>
                                <DialogDescription>
                                    O documento PDF correspondente será anexado e enviado por e-mail ao cliente.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-2">
                                <div className="space-y-2">
                                    <Label htmlFor="email-recipient">E-mail do Destinatário</Label>
                                    <Input
                                        id="email-recipient"
                                        type="email"
                                        required
                                        value={emailForm.data.email}
                                        onChange={(e) => emailForm.setData('email', e.target.value)}
                                        placeholder="exemplo@empresa.com"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsEmailOpen(false)}>Cancelar</Button>
                                <Button onClick={handleSendEmail} disabled={emailForm.processing} className="bg-[#2DB8A0] hover:bg-[#259b86] text-white">
                                    Confirmar e Enviar
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {isDraft && (
                        <Link href={`${backRoute}/${doc.id}/edit`}>
                            <Button variant="outline" size="sm">Editar Rascunho</Button>
                        </Link>
                    )}

                    {!isCancelled && !isDraft && (
                        <Button variant="destructive" size="sm" onClick={handleCancel} disabled={cancelForm.processing} className="gap-1.5">
                            <Ban size={14} />
                            Cancelar
                        </Button>
                    )}

                    {type === 'FT' && isConfirmed && receivePaymentRoute && (
                        <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
                                    <Plus size={14} />
                                    Registar Pagamento
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Registar Pagamento</DialogTitle>
                                    <DialogDescription>
                                        O valor será amortizado nas faturas pendentes do cliente (FIFO).
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="pay-amount">Valor Recebido (MZN)</Label>
                                        <Input id="pay-amount" type="number" step="0.01"
                                            value={paymentForm.data.amount}
                                            onChange={(e) => paymentForm.setData('amount', e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="pay-method">Método de Pagamento</Label>
                                        <Select value={paymentForm.data.payment_method}
                                            onValueChange={(v) => paymentForm.setData('payment_method', v)}>
                                            <SelectTrigger id="pay-method"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Cash">Dinheiro Físico</SelectItem>
                                                <SelectItem value="M-Pesa">M-Pesa</SelectItem>
                                                <SelectItem value="E-Mola">E-Mola</SelectItem>
                                                <SelectItem value="Bank">Transferência Bancária</SelectItem>
                                                <SelectItem value="Card">Cartão POS</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="pay-ref">Referência (opcional)</Label>
                                        <Input id="pay-ref" value={paymentForm.data.reference}
                                            onChange={(e) => paymentForm.setData('reference', e.target.value)}
                                            placeholder="NIB, ID Transacção, Talão..." />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsPaymentOpen(false)}>Cancelar</Button>
                                    <Button onClick={handleRegisterPayment} disabled={paymentForm.processing}>
                                        Confirmar Pagamento
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    )}

                    {/* Confirm & Emit (draft only) */}
                    {isDraft && (
                        <div className="flex items-end gap-2 border-l pl-3 border-zinc-200 dark:border-zinc-700">
                            {needsWarehouse && warehouses.length > 0 && (
                                <div className="space-y-1">
                                    <p className="text-[10px] font-medium text-zinc-500 flex items-center gap-1">
                                        <WarehouseIcon size={10} /> Armazém
                                    </p>
                                    <Select value={confirmForm.data.warehouse_id}
                                        onValueChange={(v) => confirmForm.setData('warehouse_id', v)}>
                                        <SelectTrigger className="h-9 min-w-[140px]"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {warehouses.map((w) => (
                                                <SelectItem key={w.id} value={w.id.toString()}>{w.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            <Button id="confirm-document" onClick={handleConfirm} disabled={confirmForm.processing}
                                className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                                <CheckCircle2 size={15} />
                                Confirmar e Emitir
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Content Grid ────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">

                {/* Document Body (3 cols) */}
                <div className="lg:col-span-3 space-y-4 print:col-span-4 print:w-full">
                    <Card className="print:border-none print:shadow-none">
                        <CardContent className="pt-6">

                            {/* Document Header (for print) */}
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                                        <ReceiptText className="text-blue-600 dark:text-blue-400" size={22} />
                                        KUTENGA ERP
                                    </div>
                                    <p className="text-xs text-zinc-500 mt-1">Maputo, Moçambique · NUIT: 100200300</p>
                                </div>
                                <div className="text-right">
                                    <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-200">
                                        {TYPE_LABELS[doc.document_type] ?? doc.document_type}
                                    </h2>
                                    <p className="font-mono text-sm text-blue-600 dark:text-blue-400 mt-0.5">
                                        {doc.document_number ?? 'RASCUNHO'}
                                    </p>
                                    {doc.referenced_document && (
                                        <p className="text-xs text-zinc-500 mt-0.5">
                                            {doc.document_type === 'NC' ? 'Retifica: ' : 'Ref: '}
                                            <span className="font-mono font-semibold">{doc.referenced_document.document_number}</span>
                                        </p>
                                    )}
                                    <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1 justify-end">
                                        <Calendar size={11} /> Emissão: {formatDate(doc.issue_date)}
                                    </p>
                                    {type !== 'GR' && type !== 'FR' && (
                                        <p className="text-xs text-zinc-500">Vencimento: {formatDate(doc.due_date)}</p>
                                    )}
                                </div>
                            </div>

                            <Separator className="mb-6" />

                            {/* Parties */}
                            <div className="grid grid-cols-2 gap-6 mb-6">
                                <div>
                                    <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">Entidade Emitente</p>
                                    <p className="font-bold text-zinc-800 dark:text-zinc-200 text-sm">
                                        {doc.company?.name || 'Kutenga Solutions Lda.'}
                                    </p>
                                    <p className="text-xs text-zinc-500 mt-1">
                                        {doc.company?.address || 'Av. 24 de Julho, Maputo'}
                                    </p>
                                    <p className="text-xs text-zinc-500">
                                        NUIT: {doc.company?.nuit || '100200300'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                                        {doc.document_type === 'CT' ? 'Cliente' : 'Faturado A'}
                                    </p>
                                    <p className="font-bold text-zinc-800 dark:text-zinc-200 text-sm">{doc.customer_name}</p>
                                    <p className="text-xs text-zinc-500 mt-1">NUIT: <span className="font-mono">{doc.customer_nuit}</span></p>
                                    {doc.customer_address && <p className="text-xs text-zinc-500 mt-0.5">{doc.customer_address}</p>}
                                    {doc.customer_phone && <p className="text-xs text-zinc-500 mt-0.5">Tel: {doc.customer_phone}</p>}
                                    {doc.customer_email && <p className="text-xs text-zinc-500 mt-0.5">Email: {doc.customer_email}</p>}
                                </div>
                            </div>

                            {/* Items Table */}
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-8 pl-2">#</TableHead>
                                        <TableHead>Descrição</TableHead>
                                        <TableHead className="text-right w-16">Qtd</TableHead>
                                        <TableHead className="text-right w-24">Preço Unit.</TableHead>
                                        <TableHead className="text-right w-16">Desc.</TableHead>
                                        <TableHead className="text-right w-16">IVA</TableHead>
                                        <TableHead className="text-right pr-2 w-28">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {doc.items.map((item, i) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="pl-2 text-zinc-400 text-xs">{i + 1}</TableCell>
                                            <TableCell>
                                                <p className="font-medium text-zinc-800 dark:text-zinc-200 text-sm">{item.product_name}</p>
                                                {item.product_sku && <p className="text-xs text-zinc-400 font-mono mt-0.5">{item.product_sku}</p>}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-sm">{fmt(item.quantity)}</TableCell>
                                            <TableCell className="text-right font-mono text-sm">{fmt(item.unit_price)}</TableCell>
                                            <TableCell className="text-right font-mono text-sm text-zinc-500">
                                                {Number(item.discount_percent) > 0 ? `${fmt(item.discount_percent)}%` : '—'}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-sm text-zinc-500">{fmt(item.tax_rate)}%</TableCell>
                                            <TableCell className="text-right font-mono font-semibold pr-2">{fmt(item.total)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                                <TableFooter>
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-right text-sm text-zinc-500">Subtotal</TableCell>
                                        <TableCell className="text-right font-mono text-sm pr-2">{fmt(doc.subtotal)} MZN</TableCell>
                                    </TableRow>
                                    {Number(doc.discount_total) > 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-right text-sm text-emerald-600">Desconto</TableCell>
                                            <TableCell className="text-right font-mono text-sm text-emerald-600 pr-2">- {fmt(doc.discount_total)} MZN</TableCell>
                                        </TableRow>
                                    )}
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-right text-sm text-zinc-500">IVA</TableCell>
                                        <TableCell className="text-right font-mono text-sm pr-2">{fmt(doc.tax_total)} MZN</TableCell>
                                    </TableRow>
                                    <TableRow className="bg-zinc-50 dark:bg-zinc-800/40">
                                        <TableCell colSpan={6} className="text-right text-sm font-bold text-zinc-800 dark:text-zinc-100">Total Geral</TableCell>
                                        <TableCell className="text-right font-mono font-bold text-blue-600 dark:text-blue-400 pr-2 text-base">{fmt(doc.grand_total)} MZN</TableCell>
                                    </TableRow>
                                </TableFooter>
                            </Table>

                            {doc.notes && (
                                <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                    <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">Notas</p>
                                    <p className="text-xs text-zinc-600 dark:text-zinc-400 whitespace-pre-line leading-relaxed">{doc.notes}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar — Audit & Info */}
                <div className="space-y-4 print:hidden">

                    {/* Draft Warning */}
                    {isDraft && (
                        <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-300 flex gap-2">
                            <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={14} />
                            <div>
                                <p className="font-bold">Rascunho</p>
                                <p className="mt-0.5 leading-normal text-amber-600 dark:text-amber-400">
                                    Este documento não tem valor fiscal até ser emitido oficialmente.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Audit Timeline */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2 text-zinc-500">
                                <History size={14} className="text-blue-500" />
                                Histórico
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-1">
                            <div className="relative border-l border-zinc-200 dark:border-zinc-800 pl-4 space-y-4 text-xs">

                                <div className="relative">
                                    <span className="absolute -left-[21px] top-1 flex h-3 w-3 items-center justify-center rounded-full bg-zinc-300 dark:bg-zinc-600 ring-4 ring-white dark:ring-zinc-900" />
                                    <p className="font-semibold text-zinc-700 dark:text-zinc-300">Rascunho Criado</p>
                                    <p className="text-zinc-400 mt-0.5">{new Date(doc.created_at).toLocaleString('pt-MZ')}</p>
                                </div>

                                {!isDraft && (
                                    <div className="relative">
                                        <span className="absolute -left-[21px] top-1 flex h-3 w-3 items-center justify-center rounded-full bg-blue-500 ring-4 ring-white dark:ring-zinc-900" />
                                        <p className="font-semibold text-blue-600 dark:text-blue-400">Emitido</p>
                                        <p className="text-zinc-400 mt-0.5 font-mono">{doc.document_number}</p>
                                    </div>
                                )}

                                {(doc.payment_status === 'paid' || doc.payment_status === 'partial') && (
                                    <div className="relative">
                                        <span className="absolute -left-[21px] top-1 flex h-3 w-3 items-center justify-center rounded-full bg-emerald-500 ring-4 ring-white dark:ring-zinc-900" />
                                        <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                                            {doc.payment_status === 'paid' ? 'Totalmente Pago' : 'Pago Parcialmente'}
                                        </p>
                                    </div>
                                )}

                                {isCancelled && (
                                    <div className="relative">
                                        <span className="absolute -left-[21px] top-1 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 ring-4 ring-white dark:ring-zinc-900" />
                                        <p className="font-semibold text-red-600 dark:text-red-400">Cancelado / Estornado</p>
                                        <p className="text-zinc-400 mt-0.5">{new Date(doc.updated_at).toLocaleString('pt-MZ')}</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
