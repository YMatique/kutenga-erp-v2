import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    ReceiptText, CheckCircle2, Clock, Ban, ArrowLeft,
    Building2, Calendar, CreditCard, FileText, PackageSearch,
    AlertCircle, Warehouse as WarehouseIcon, Printer, Plus, History
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Table, TableBody, TableCell, TableHead,
    TableHeader, TableRow, TableFooter,
} from '@/components/ui/table';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

interface DocumentItem {
    id: number;
    product_name: string;
    product_sku: string | null;
    description: string | null;
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

interface User {
    id: number;
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
    created_at: string;
    updated_at: string;
    created_by?: number;
    updated_by?: number;
    cancelled_by?: number;
    creator?: User | null;
    updator?: User | null;
    canceller?: User | null;
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
    draft: {
        label: 'Rascunho',
        icon: <Clock size={14} />,
        className: 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700',
    },
    confirmed: {
        label: 'Confirmado',
        icon: <CheckCircle2 size={14} />,
        className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
    },
    paid: {
        label: 'Pago',
        icon: <CheckCircle2 size={14} />,
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
    },
    partial: {
        label: 'Parcial',
        icon: <CreditCard size={14} />,
        className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
    },
    cancelled: {
        label: 'Cancelado',
        icon: <Ban size={14} />,
        className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
    },
};

function fmt(n: number | string): string {
    return Number(n).toLocaleString('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function DocumentShow({
    document: doc,
    warehouses = [],
    type,
    backRoute,
    confirmRoute,
    cancelRoute,
    receivePaymentRoute = '/billing/invoices/receive-payment'
}: Props) {
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);

    // Form para Confirmar/Emitir
    const confirmForm = useForm({
        warehouse_id: warehouses[0]?.id?.toString() ?? '',
    });

    // Form para Registar Pagamento
    const paymentForm = useForm({
        customer_id: doc.customer_id?.toString() ?? '',
        amount: doc.grand_total,
        payment_method: 'Cash',
        reference: '',
    });

    // Form para Cancelar
    const cancelForm = useForm({});

    const handleConfirm = () => {
        confirmForm.post(confirmRoute);
    };

    const handleCancel = () => {
        if (window.confirm('Tem a certeza que pretende cancelar/estornar este documento? Esta ação reverterá stock e saldos correspondentes.')) {
            cancelForm.post(cancelRoute);
        }
    };

    const handleRegisterPayment = () => {
        paymentForm.post(receivePaymentRoute, {
            onSuccess: () => {
                setIsPaymentOpen(false);
                paymentForm.reset('reference');
            }
        });
    };

    const handlePrint = () => {
        window.print();
    };

    const status = STATUS_CONFIG[doc.status] ?? STATUS_CONFIG.draft;
    const isDraft = doc.status === 'draft';
    const isCancelled = doc.status === 'cancelled';
    const isConfirmed = doc.status === 'confirmed' || doc.status === 'partial';

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Faturação', href: '#' },
        { title: TYPE_LABELS[type] || 'Documentos', href: backRoute },
        { title: doc.document_number ?? 'Rascunho', href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${TYPE_LABELS[type]} ${doc.document_number ?? '— Rascunho'}`} />

            {/* ── Page Header (Ocultado ao imprimir) ─────────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6 print:hidden">
                <div className="flex items-start gap-3">
                    <Link href={backRoute}>
                        <Button variant="ghost" size="sm" className="gap-1.5 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 mt-0.5">
                            <ArrowLeft size={14} />
                            Voltar
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="inline-flex items-center rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-1.5 py-0.5 text-xs font-mono text-zinc-600 dark:text-zinc-400">
                                {doc.document_type}
                            </span>
                            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                                {TYPE_LABELS[doc.document_type] ?? doc.document_type}
                                {doc.document_number && (
                                    <span className="font-mono ml-1.5 text-blue-600 dark:text-blue-400">
                                        {doc.document_number}
                                    </span>
                                )}
                            </h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${status.className}`}>
                                {status.icon}
                                {status.label}
                            </span>
                            {doc.series && (
                                <span className="text-xs text-zinc-400 dark:text-zinc-500">
                                    Série {doc.series.code}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-auto">
                    {/* Botão de Impressão */}
                    <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5">
                        <Printer size={14} />
                        Imprimir / PDF
                    </Button>

                    {/* Botão de Edição (Rascunho apenas) */}
                    {isDraft && (
                        <Link href={`${backRoute}/${doc.id}/edit`}>
                            <Button variant="outline" size="sm">
                                Editar Rascunho
                            </Button>
                        </Link>
                    )}

                    {/* Botão de Cancelar */}
                    {!isCancelled && !isDraft && (
                        <Button variant="destructive" size="sm" onClick={handleCancel} disabled={cancelForm.processing} className="gap-1.5">
                            <Ban size={14} />
                            Cancelar Documento
                        </Button>
                    )}

                    {/* Registar Pagamento (Apenas Fatura confirmed/partial) */}
                    {type === 'FT' && isConfirmed && (
                        <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
                            <DialogTrigger asChild>
                                <Button className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white" size="sm">
                                    <Plus size={14} />
                                    Registar Pagamento
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Registar Pagamento</DialogTitle>
                                    <DialogDescription>
                                        Introduza o pagamento efetuado pelo cliente. O valor será amortizado nas faturas pendentes.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="amount">Valor Recebido (MZN)</Label>
                                        <Input
                                            id="amount"
                                            type="number"
                                            step="0.01"
                                            value={paymentForm.data.amount}
                                            onChange={(e) => paymentForm.setData('amount', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="method">Método de Pagamento</Label>
                                        <Select
                                            value={paymentForm.data.payment_method}
                                            onValueChange={(v) => paymentForm.setData('payment_method', v)}
                                        >
                                            <SelectTrigger id="method">
                                                <SelectValue />
                                            </SelectTrigger>
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
                                        <Label htmlFor="ref">Referência (NIB, ID Transacção, etc.)</Label>
                                        <Input
                                            id="ref"
                                            value={paymentForm.data.reference}
                                            onChange={(e) => paymentForm.setData('reference', e.target.value)}
                                            placeholder="Ex: Ref MPesa / Talão de Depósito"
                                        />
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

                    {/* Acção: Confirmar e Emitir (apenas rascunhos) */}
                    {isDraft && (
                        <div className="flex items-end gap-2 border-l pl-3 ml-1 border-zinc-200 dark:border-zinc-800">
                            {warehouses.length > 0 && (
                                <div className="space-y-1 min-w-[160px]">
                                    <label className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                                        <WarehouseIcon size={11} />
                                        Armazém de Saída
                                    </label>
                                    <Select
                                        value={confirmForm.data.warehouse_id}
                                        onValueChange={(v) => confirmForm.setData('warehouse_id', v)}
                                    >
                                        <SelectTrigger className="h-9">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {warehouses.map((w) => (
                                                <SelectItem key={w.id} value={w.id.toString()}>{w.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            <Button
                                id="confirm-document"
                                onClick={handleConfirm}
                                disabled={confirmForm.processing}
                                className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                <CheckCircle2 size={15} />
                                Confirmar e Emitir
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Layout Principal (Pronto para Impressão) ──────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
                
                {/* Detalhes do Documento (Toma 3 colunas no ecrã largo) */}
                <div className="lg:col-span-3 space-y-4 print:col-span-4 print:w-full">
                    
                    <Card className="print:border-none print:shadow-none">
                        <CardContent className="pt-6 print:p-0">
                            {/* Logotipo e Cabeçalho do PDF */}
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                                        <ReceiptText className="text-blue-600 dark:text-blue-400" size={24} />
                                        KUTENGA ERP
                                    </div>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs">
                                        Maputo, Moçambique · NUIT: 100200300 · info@kutenga.co.mz
                                    </p>
                                </div>
                                <div className="text-right">
                                    <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-200">
                                        {TYPE_LABELS[doc.document_type] || doc.document_type}
                                    </h2>
                                    <p className="font-mono text-sm text-blue-600 dark:text-blue-400 mt-1">
                                        {doc.document_number ?? 'RASCUNHO'}
                                    </p>
                                    <p className="text-xs text-zinc-500 mt-1">
                                        Emissão: {doc.issue_date}
                                    </p>
                                    {type !== 'GR' && type !== 'FR' && (
                                        <p className="text-xs text-zinc-500">
                                            Vencimento: {doc.due_date}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <Separator className="mb-6" />

                            {/* Informações de Cliente */}
                            <div className="grid grid-cols-2 gap-6 mb-6">
                                <div>
                                    <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Entidade Emitente</h3>
                                    <p className="font-bold text-zinc-800 dark:text-zinc-200 text-sm">Kutenga Solutions Lda.</p>
                                    <p className="text-xs text-zinc-500 mt-1">Av. 24 de Julho, Maputo</p>
                                    <p className="text-xs text-zinc-500">NUIT: 100200300</p>
                                </div>
                                <div>
                                    <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Faturado A</h3>
                                    <p className="font-bold text-zinc-800 dark:text-zinc-200 text-sm">{doc.customer_name}</p>
                                    <p className="text-xs text-zinc-500 mt-1">NUIT: <span className="font-mono">{doc.customer_nuit}</span></p>
                                    {doc.customer_address && <p className="text-xs text-zinc-500 mt-0.5">{doc.customer_address}</p>}
                                    {doc.customer_phone && <p className="text-xs text-zinc-500 mt-0.5">Tel: {doc.customer_phone}</p>}
                                    {doc.customer_email && <p className="text-xs text-zinc-500 mt-0.5">Email: {doc.customer_email}</p>}
                                </div>
                            </div>

                            {/* Tabela de Itens */}
                            <Table className="border-t border-zinc-100 dark:border-zinc-800">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-10 pl-2">#</TableHead>
                                        <TableHead>Descrição do Artigo</TableHead>
                                        <TableHead className="text-right w-16">Qtd</TableHead>
                                        <TableHead className="text-right w-24">Preço Unit.</TableHead>
                                        <TableHead className="text-right w-16">Desc.</TableHead>
                                        <TableHead className="text-right w-16">IVA</TableHead>
                                        <TableHead className="text-right pr-2 w-32">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {doc.items.map((item, i) => {
                                        const discVal = Number(item.discount_percent) > 0 ? `${fmt(item.discount_percent)}%` : '—';
                                        return (
                                            <TableRow key={item.id}>
                                                <TableCell className="pl-2 text-zinc-400 text-xs">{i + 1}</TableCell>
                                                <TableCell>
                                                    <div className="font-medium text-zinc-800 dark:text-zinc-200 text-sm">{item.product_name}</div>
                                                    {item.product_sku && <div className="text-xs text-zinc-400 font-mono mt-0.5">{item.product_sku}</div>}
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-sm">{fmt(item.quantity)}</TableCell>
                                                <TableCell className="text-right font-mono text-sm">{fmt(item.unit_price)}</TableCell>
                                                <TableCell className="text-right font-mono text-sm text-zinc-500">{discVal}</TableCell>
                                                <TableCell className="text-right font-mono text-sm text-zinc-500">{fmt(item.tax_rate)}%</TableCell>
                                                <TableCell className="text-right font-mono font-semibold text-zinc-800 dark:text-zinc-200 pr-2">{fmt(item.total)}</TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                                <TableFooter>
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-right text-sm font-medium text-zinc-500">Subtotal</TableCell>
                                        <TableCell className="text-right font-mono text-sm pr-2">{fmt(doc.subtotal)} MZN</TableCell>
                                    </TableRow>
                                    {Number(doc.discount_total) > 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-right text-sm font-medium text-emerald-600">Desconto Comercial</TableCell>
                                            <TableCell className="text-right font-mono text-sm text-emerald-600 pr-2">- {fmt(doc.discount_total)} MZN</TableCell>
                                        </TableRow>
                                    )}
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-right text-sm font-medium text-zinc-500">Imposto (IVA 16%)</TableCell>
                                        <TableCell className="text-right font-mono text-sm pr-2">{fmt(doc.tax_total)} MZN</TableCell>
                                    </TableRow>
                                    <TableRow className="border-t border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40">
                                        <TableCell colSpan={6} className="text-right text-sm font-bold text-zinc-800 dark:text-zinc-100">Total Geral</TableCell>
                                        <TableCell className="text-right font-mono font-bold text-blue-600 dark:text-blue-400 pr-2 text-base">{fmt(doc.grand_total)} MZN</TableCell>
                                    </TableRow>
                                </TableFooter>
                            </Table>

                            {doc.notes && (
                                <div className="mt-8 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                    <h4 className="text-xs font-semibold text-zinc-400 uppercase mb-1">Notas e Termos</h4>
                                    <p className="text-xs text-zinc-600 dark:text-zinc-400 whitespace-pre-line leading-relaxed">{doc.notes}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Painel Lateral / Barra de Auditoria (Ocultado ao imprimir) */}
                <div className="space-y-4 print:hidden">
                    
                    {/* Historial / Timeline de Auditoria */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2 text-zinc-500">
                                <History size={14} className="text-blue-500" />
                                Histórico do Documento
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-2">
                            <div className="relative border-l border-zinc-200 dark:border-zinc-800 pl-4 space-y-4 text-xs">
                                
                                {/* Passo 1: Criação */}
                                <div className="relative">
                                    <span className="absolute -left-[21px] top-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700 ring-4 ring-white dark:ring-zinc-900" />
                                    <div>
                                        <p className="font-semibold text-zinc-800 dark:text-zinc-200">Rascunho Criado</p>
                                        <p className="text-zinc-500 mt-0.5">Criado em: {new Date(doc.created_at).toLocaleString('pt-MZ')}</p>
                                    </div>
                                </div>

                                {/* Passo 2: Confirmação / Emissão */}
                                {!isDraft && (
                                    <div className="relative">
                                        <span className="absolute -left-[21px] top-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-blue-500 ring-4 ring-white dark:ring-zinc-900" />
                                        <div>
                                            <p className="font-semibold text-blue-600 dark:text-blue-400">Documento Emitido</p>
                                            <p className="text-zinc-500 mt-0.5">Número: {doc.document_number}</p>
                                            <p className="text-zinc-500 mt-0.5">Emitido em: {new Date(doc.updated_at).toLocaleString('pt-MZ')}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Passo 3: Pagamento (Se aplicável) */}
                                {(doc.payment_status === 'paid' || doc.payment_status === 'partial') && (
                                    <div className="relative">
                                        <span className="absolute -left-[21px] top-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-emerald-500 ring-4 ring-white dark:ring-zinc-900" />
                                        <div>
                                            <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                                                {doc.payment_status === 'paid' ? 'Totalmente Pago' : 'Pagamento Parcial'}
                                            </p>
                                            <p className="text-zinc-500 mt-0.5">Atualizado em: {new Date(doc.updated_at).toLocaleString('pt-MZ')}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Passo 4: Cancelamento (Se cancelado) */}
                                {isCancelled && (
                                    <div className="relative">
                                        <span className="absolute -left-[21px] top-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 ring-4 ring-white dark:ring-zinc-900" />
                                        <div>
                                            <p className="font-semibold text-red-600 dark:text-red-400">Documento Estornado</p>
                                            <p className="text-zinc-500 mt-0.5">Cancelado em: {new Date(doc.updated_at).toLocaleString('pt-MZ')}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Rascunho Warning */}
                    {isDraft && (
                        <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-300">
                            <div className="flex gap-2">
                                <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={14} />
                                <div>
                                    <p className="font-bold">Aviso de Rascunho</p>
                                    <p className="mt-1 text-amber-600 dark:text-amber-400 leading-normal">
                                        Este documento não possui valor fiscal ou de stock até ser oficialmente confirmado e emitido.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
