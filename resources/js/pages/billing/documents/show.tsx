import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    ReceiptText, CheckCircle2, Clock, Ban, ArrowLeft,
    Building2, Calendar, CreditCard, FileText, PackageSearch,
    AlertCircle, Warehouse as WarehouseIcon,
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
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────
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
}

interface Warehouse {
    id: number;
    name: string;
}

interface Props {
    document: Document;
    warehouses: Warehouse[];
}

// ─── Constants ────────────────────────────────────────────────────────────────
const DOC_TYPE_LABELS: Record<string, string> = {
    FT: 'Fatura',
    FR: 'Fatura-Recibo',
    CT: 'Consulta',
    NC: 'Nota de Crédito',
    ND: 'Nota de Débito',
    GR: 'Guia de Remessa',
};

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; className: string; headerClass: string }> = {
    draft: {
        label: 'Rascunho',
        icon: <Clock size={14} />,
        className: 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700',
        headerClass: 'border-zinc-200 dark:border-zinc-700',
    },
    confirmed: {
        label: 'Confirmado',
        icon: <CheckCircle2 size={14} />,
        className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
        headerClass: 'border-blue-100 dark:border-blue-900/50',
    },
    paid: {
        label: 'Pago',
        icon: <CheckCircle2 size={14} />,
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
        headerClass: 'border-emerald-100 dark:border-emerald-900/50',
    },
    partial: {
        label: 'Parcialmente Pago',
        icon: <CreditCard size={14} />,
        className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
        headerClass: 'border-amber-100 dark:border-amber-900/50',
    },
    cancelled: {
        label: 'Cancelado',
        icon: <Ban size={14} />,
        className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
        headerClass: 'border-red-100 dark:border-red-900/50',
    },
};

function fmt(n: number | string): string {
    return Number(n).toLocaleString('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
    if (!value) return null;
    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-xs text-zinc-400 dark:text-zinc-500">{label}</span>
            <span className="text-sm text-zinc-800 dark:text-zinc-200">{value}</span>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DocumentShow({ document: doc, warehouses }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        warehouse_id: warehouses[0]?.id?.toString() ?? '',
    });

    const handleConfirm = () => {
        post(`/billing/documents/${doc.id}/confirm`);
    };

    const status = STATUS_CONFIG[doc.status] ?? STATUS_CONFIG.draft;
    const isDraft = doc.status === 'draft';

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Faturação', href: '#' },
        { title: 'Documentos', href: '/billing/documents' },
        {
            title: doc.document_number ?? 'Rascunho',
            href: `/billing/documents/${doc.id}`,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${DOC_TYPE_LABELS[doc.document_type] ?? doc.document_type} ${doc.document_number ?? '— Rascunho'}`} />

            {/* ── Page Header ─────────────────────────────────────────── */}
            <div className="flex items-start justify-between mb-6">
                <div className="flex items-start gap-3">
                    <Link href="/billing/documents">
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
                                {DOC_TYPE_LABELS[doc.document_type] ?? doc.document_type}
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

                {/* Action: Confirmar e Emitir (apenas rascunhos) */}
                {isDraft && (
                    <div className="flex items-end gap-2">
                        <div className="space-y-1 min-w-[180px]">
                            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                                <WarehouseIcon size={11} />
                                Armazém de Saída
                            </label>
                            <Select
                                value={data.warehouse_id}
                                onValueChange={(v) => setData('warehouse_id', v)}
                            >
                                <SelectTrigger id="warehouse-select" className="w-full">
                                    <SelectValue placeholder="Selecionar armazém…" />
                                </SelectTrigger>
                                <SelectContent>
                                    {warehouses.map((w) => (
                                        <SelectItem key={w.id} value={w.id.toString()}>{w.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.warehouse_id && <p className="text-xs text-red-500">{errors.warehouse_id}</p>}
                        </div>
                        <Button
                            id="confirm-document"
                            onClick={handleConfirm}
                            disabled={processing || !data.warehouse_id}
                            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            <CheckCircle2 size={15} />
                            {processing ? 'A confirmar…' : 'Confirmar e Emitir'}
                        </Button>
                    </div>
                )}
            </div>

            {/* ── Info Cards Row ───────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">

                {/* Cliente */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                            <Building2 size={12} />
                            Cliente
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <p className="font-semibold text-zinc-800 dark:text-zinc-200 text-sm">{doc.customer_name}</p>
                        <InfoRow label="NUIT" value={<span className="font-mono">{doc.customer_nuit}</span>} />
                        <InfoRow label="Telefone" value={doc.customer_phone} />
                        <InfoRow label="Email" value={doc.customer_email} />
                        <InfoRow label="Morada" value={doc.customer_address} />
                    </CardContent>
                </Card>

                {/* Datas & Série */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                            <Calendar size={12} />
                            Datas
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <InfoRow label="Data de Emissão" value={doc.issue_date} />
                        <InfoRow label="Data de Vencimento" value={doc.due_date} />
                        {doc.series && (
                            <InfoRow label="Série" value={`${doc.series.code} — ${doc.series.name}`} />
                        )}
                    </CardContent>
                </Card>

                {/* Totais Resumo */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                            <CreditCard size={12} />
                            Resumo Financeiro
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex justify-between text-sm text-zinc-500 dark:text-zinc-400">
                            <span>Subtotal</span>
                            <span className="font-mono">{fmt(doc.subtotal)} MZN</span>
                        </div>
                        {Number(doc.discount_total) > 0 && (
                            <div className="flex justify-between text-sm text-emerald-600 dark:text-emerald-400">
                                <span>Desconto</span>
                                <span className="font-mono">- {fmt(doc.discount_total)} MZN</span>
                            </div>
                        )}
                        <div className="flex justify-between text-sm text-zinc-500 dark:text-zinc-400">
                            <span>IVA</span>
                            <span className="font-mono">{fmt(doc.tax_total)} MZN</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-bold text-zinc-900 dark:text-zinc-100">
                            <span>Total Geral</span>
                            <span className="font-mono text-blue-600 dark:text-blue-400">{fmt(doc.grand_total)} MZN</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ── Items Table ──────────────────────────────────────────── */}
            <Card className="mb-4">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <PackageSearch size={14} className="text-blue-500" />
                        Linhas do Documento
                        <span className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-bold">
                            {doc.items.length}
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {doc.items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <PackageSearch className="text-zinc-300 dark:text-zinc-600 mb-2" size={36} />
                            <p className="text-zinc-400 dark:text-zinc-500 text-sm">Sem linhas neste documento</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="pl-4">#</TableHead>
                                    <TableHead>Produto / Descrição</TableHead>
                                    <TableHead className="text-right">Qtd</TableHead>
                                    <TableHead className="text-right">Preço Unit.</TableHead>
                                    <TableHead className="text-right">Desc. %</TableHead>
                                    <TableHead className="text-right">IVA %</TableHead>
                                    <TableHead className="text-right">IVA (MZN)</TableHead>
                                    <TableHead className="text-right pr-4">Total (MZN)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {doc.items.map((item, i) => {
                                    const qty = Number(item.quantity);
                                    const price = Number(item.unit_price);
                                    const discPct = Number(item.discount_percent);
                                    const taxPct = Number(item.tax_rate);
                                    const lineSubtotal = qty * price;
                                    const lineDiscount = lineSubtotal * (discPct / 100);
                                    const lineTaxable = lineSubtotal - lineDiscount;
                                    const lineTax = lineTaxable * (taxPct / 100);
                                    const lineTotal = lineTaxable + lineTax;

                                    return (
                                        <TableRow key={item.id}>
                                            <TableCell className="pl-4 text-zinc-400 text-xs">{i + 1}</TableCell>
                                            <TableCell>
                                                <div className="font-medium text-zinc-800 dark:text-zinc-200 text-sm">
                                                    {item.product_name}
                                                </div>
                                                {item.product_sku && (
                                                    <div className="text-xs text-zinc-400 font-mono">{item.product_sku}</div>
                                                )}
                                                {item.description && (
                                                    <div className="text-xs text-zinc-400 mt-0.5">{item.description}</div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-sm">{fmt(item.quantity)}</TableCell>
                                            <TableCell className="text-right font-mono text-sm">{fmt(item.unit_price)}</TableCell>
                                            <TableCell className="text-right font-mono text-sm">
                                                {Number(item.discount_percent) > 0 ? `${fmt(item.discount_percent)}%` : '—'}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-sm">{fmt(item.tax_rate)}%</TableCell>
                                            <TableCell className="text-right font-mono text-sm text-zinc-500">{fmt(lineTax)}</TableCell>
                                            <TableCell className="text-right font-mono font-semibold text-zinc-800 dark:text-zinc-200 pr-4">
                                                {fmt(lineTotal)}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                            <TableFooter>
                                <TableRow>
                                    <TableCell colSpan={7} className="text-right text-sm font-medium text-zinc-500 pr-2">
                                        Total Geral
                                    </TableCell>
                                    <TableCell className="text-right font-mono font-bold text-blue-600 dark:text-blue-400 pr-4 text-base">
                                        {fmt(doc.grand_total)} MZN
                                    </TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* ── Notes ───────────────────────────────────────────────── */}
            {doc.notes && (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                            <FileText size={12} />
                            Notas / Observações
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-line">{doc.notes}</p>
                    </CardContent>
                </Card>
            )}

            {/* ── Draft Warning Banner ─────────────────────────────────── */}
            {isDraft && (
                <div className="mt-4 p-4 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 flex items-start gap-3">
                    <AlertCircle className="text-amber-500 mt-0.5 shrink-0" size={16} />
                    <div className="text-sm text-amber-700 dark:text-amber-300">
                        <p className="font-medium">Este documento é um Rascunho</p>
                        <p className="mt-0.5 text-amber-600 dark:text-amber-400">
                            Selecione um armazém e clique em <strong>Confirmar e Emitir</strong> para emitir o documento fiscalmente
                            e efectuar a baixa de stock correspondente.
                        </p>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}