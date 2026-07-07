import React, { useState, useMemo, useCallback } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import { Plus, Trash2, Save, ReceiptText, AlertCircle, PackageSearch, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface Customer {
    id: number;
    name: string;
    nuit: string;
    email: string | null;
    phone: string | null;
    address: string | null;
}

interface Product {
    id: number;
    name: string;
    sku: string | null;
    barcode: string | null;
    price: string;
    tax_rate: string;
}

interface DocumentSeries {
    id: number;
    code: string;
    name: string;
}

interface DocumentItem {
    product_id: string;
    product_name: string;
    product_sku: string;
    product_barcode: string;
    quantity: number;
    unit_price: number;
    tax_rate: number;
    discount_percent: number;
}

interface DBItem {
    product_id: number | null;
    product_name: string;
    product_sku: string | null;
    product_barcode: string | null;
    quantity: string;
    unit_price: string;
    tax_rate: string;
    discount_percent: string;
}

interface DBDocument {
    id: number;
    customer_id: number | null;
    customer_name: string;
    customer_nuit: string;
    customer_phone: string | null;
    customer_email: string | null;
    customer_address: string | null;
    series_id: number;
    issue_date: string;
    due_date: string;
    notes: string | null;
    items: DBItem[];
}

interface Props {
    customers: Customer[];
    products: Product[];
    series: DocumentSeries[];
    warehouses?: { id: number; name: string }[];
    type: string;
    document?: DBDocument;
    submitRoute: string;
    method: 'post' | 'put';
    cancelRoute: string;
}

const TYPE_LABELS: Record<string, string> = {
    FT: 'Fatura a Crédito',
    FR: 'Fatura-Recibo',
    CT: 'Cotação / Orçamento',
    NC: 'Nota de Crédito',
    ND: 'Nota de Débito',
    GR: 'Guia de Remessa',
};

function today(): string {
    return new Date().toISOString().split('T')[0];
}

function addDays(dateStr: string, days: number): string {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
}

function fmt(n: number): string {
    return n.toLocaleString('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface ItemRowProps {
    item: DocumentItem;
    index: number;
    products: Product[];
    onChange: (index: number, field: keyof DocumentItem, value: string | number) => void;
    onRemove: (index: number) => void;
}

function ItemRow({ item, index, products, onChange, onRemove }: ItemRowProps) {
    const lineSubtotal = item.quantity * item.unit_price;
    const lineDiscount = lineSubtotal * (item.discount_percent / 100);
    const lineTaxable = lineSubtotal - lineDiscount;
    const lineTax = lineTaxable * (item.tax_rate / 100);
    const lineTotal = lineTaxable + lineTax;

    const handleProductSelect = (productId: string) => {
        const p = products.find((p) => p.id.toString() === productId);
        if (!p) return;
        onChange(index, 'product_id', productId);
        onChange(index, 'product_name', p.name);
        onChange(index, 'product_sku', p.sku ?? '');
        onChange(index, 'product_barcode', p.barcode ?? '');
        onChange(index, 'unit_price', parseFloat(p.price) || 0);
        onChange(index, 'tax_rate', parseFloat(p.tax_rate) || 0);
    };

    return (
        <tr className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
            <td className="p-2 min-w-[200px]">
                <Select value={item.product_id} onValueChange={handleProductSelect}>
                    <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Selecionar produto…" />
                    </SelectTrigger>
                    <SelectContent>
                        {products.map((p) => (
                            <SelectItem key={p.id} value={p.id.toString()}>
                                <span className="font-medium">{p.name}</span>
                                {p.sku && <span className="text-zinc-400 ml-1 text-xs">({p.sku})</span>}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {!item.product_id && (
                    <Input
                        className="h-8 text-sm mt-1"
                        placeholder="ou escreva o nome…"
                        value={item.product_name}
                        onChange={(e) => onChange(index, 'product_name', e.target.value)}
                    />
                )}
            </td>
            <td className="p-2 w-24">
                <Input type="number" min="0.001" step="0.001" className="h-8 text-sm text-right"
                    value={item.quantity} onChange={(e) => onChange(index, 'quantity', parseFloat(e.target.value) || 0)} />
            </td>
            <td className="p-2 w-28">
                <Input type="number" min="0" step="0.01" className="h-8 text-sm text-right"
                    value={item.unit_price} onChange={(e) => onChange(index, 'unit_price', parseFloat(e.target.value) || 0)} />
            </td>
            <td className="p-2 w-20">
                <Input type="number" min="0" max="100" step="0.01" className="h-8 text-sm text-right"
                    value={item.discount_percent} onChange={(e) => onChange(index, 'discount_percent', parseFloat(e.target.value) || 0)} />
            </td>
            <td className="p-2 w-20">
                <Input type="number" min="0" step="0.01" className="h-8 text-sm text-right"
                    value={item.tax_rate} onChange={(e) => onChange(index, 'tax_rate', parseFloat(e.target.value) || 0)} />
            </td>
            <td className="p-2 w-32 text-right font-mono text-sm font-semibold text-zinc-800 dark:text-zinc-200 pr-4">
                {fmt(lineTotal)}
            </td>
            <td className="p-2 w-10">
                <Button type="button" variant="ghost" size="sm"
                    className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    onClick={() => onRemove(index)}>
                    <Trash2 size={14} />
                </Button>
            </td>
        </tr>
    );
}

export default function DocumentForm({ customers, products, series, type, document, submitRoute, method, cancelRoute }: Props) {
    const { data, setData, submit, processing, errors } = useForm({
        customer_id: document?.customer_id?.toString() ?? '',
        customer_name: document?.customer_name ?? '',
        customer_nuit: document?.customer_nuit ?? '',
        customer_phone: document?.customer_phone ?? '',
        customer_email: document?.customer_email ?? '',
        customer_address: document?.customer_address ?? '',
        document_type: type,
        series_id: document?.series_id?.toString() ?? series[0]?.id?.toString() ?? '',
        issue_date: document?.issue_date ?? today(),
        due_date: document?.due_date ?? addDays(today(), 30),
        notes: document?.notes ?? '',
        items: document?.items?.map(item => ({
            product_id: item.product_id?.toString() ?? '',
            product_name: item.product_name,
            product_sku: item.product_sku ?? '',
            product_barcode: item.product_barcode ?? '',
            quantity: parseFloat(item.quantity) || 1,
            unit_price: parseFloat(item.unit_price) || 0,
            tax_rate: parseFloat(item.tax_rate) || 16,
            discount_percent: parseFloat(item.discount_percent) || 0,
        })) ?? [] as DocumentItem[],
    });

    const isEdit = method === 'put';
    const formTitle = isEdit ? `Editar ${TYPE_LABELS[type] ?? type}` : `Novo ${TYPE_LABELS[type] ?? type}`;

    const handleCustomerChange = useCallback((customerId: string) => {
        const c = customers.find((c) => c.id.toString() === customerId);
        if (c) {
            setData((prev) => ({
                ...prev,
                customer_id: customerId,
                customer_name: c.name,
                customer_nuit: c.nuit ?? '',
                customer_phone: c.phone ?? '',
                customer_email: c.email ?? '',
                customer_address: c.address ?? '',
            }));
        } else {
            setData('customer_id', customerId);
        }
    }, [customers, setData]);

    const addItem = () => {
        setData('items', [
            ...data.items,
            { product_id: '', product_name: '', product_sku: '', product_barcode: '', quantity: 1, unit_price: 0, tax_rate: 16, discount_percent: 0 },
        ]);
    };

    const updateItem = useCallback((index: number, field: keyof DocumentItem, value: string | number) => {
        const updated = [...data.items];
        (updated[index] as any)[field] = value;
        setData('items', updated);
    }, [data.items, setData]);

    const removeItem = useCallback((index: number) => {
        setData('items', data.items.filter((_, i) => i !== index));
    }, [data.items, setData]);

    const totals = useMemo(() => {
        return data.items.reduce(
            (acc, item) => {
                const lineSubtotal = item.quantity * item.unit_price;
                const lineDiscount = lineSubtotal * (item.discount_percent / 100);
                const lineTaxable = lineSubtotal - lineDiscount;
                const lineTax = lineTaxable * (item.tax_rate / 100);
                return {
                    subtotal: acc.subtotal + lineSubtotal,
                    discount: acc.discount + lineDiscount,
                    tax: acc.tax + lineTax,
                    total: acc.total + lineTaxable + lineTax,
                };
            },
            { subtotal: 0, discount: 0, tax: 0, total: 0 }
        );
    }, [data.items]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        submit(method, submitRoute);
    };

    const hasErrors = Object.keys(errors).length > 0;

    return (
        <>
            <Head title={formTitle} />

            {/* Page Title */}
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30">
                    <ReceiptText className="text-blue-600 dark:text-blue-400" size={20} />
                </div>
                <div>
                    <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{formTitle}</h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        O documento é gravado como rascunho até ser confirmado e emitido oficialmente.
                    </p>
                </div>
            </div>

            {/* Validation Errors */}
            {hasErrors && (
                <div className="mb-4 p-4 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 flex items-start gap-3">
                    <AlertCircle className="text-red-500 mt-0.5 shrink-0" size={16} />
                    <div className="text-sm text-red-700 dark:text-red-300">
                        <p className="font-medium mb-1">Existem erros no formulário:</p>
                        <ul className="list-disc list-inside space-y-0.5">
                            {Object.entries(errors).map(([key, msg]) => (
                                <li key={key}><strong>{key}:</strong> {msg as string}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Document Data */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <ReceiptText size={14} className="text-blue-500" />
                                Dados do Documento
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="series_id" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                                    Série Documental <span className="text-red-500">*</span>
                                </Label>
                                <Select value={data.series_id} onValueChange={(v) => setData('series_id', v)}>
                                    <SelectTrigger id="series_id">
                                        <SelectValue placeholder="Selecionar série…" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {series.map((s) => (
                                            <SelectItem key={s.id} value={s.id.toString()}>
                                                {s.code} — {s.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="issue_date" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                                        Data de Emissão <span className="text-red-500">*</span>
                                    </Label>
                                    <Input id="issue_date" type="date" value={data.issue_date}
                                        onChange={(e) => setData('issue_date', e.target.value)} />
                                </div>
                                {type !== 'GR' && (
                                    <div className="space-y-1.5">
                                        <Label htmlFor="due_date" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                                            {type === 'CT' ? 'Válido Até' : 'Data de Vencimento'} <span className="text-red-500">*</span>
                                        </Label>
                                        <Input id="due_date" type="date" value={data.due_date}
                                            min={data.issue_date}
                                            onChange={(e) => setData('due_date', e.target.value)} />
                                    </div>
                                )}
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="notes" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                                    Notas / Observações
                                </Label>
                                <Textarea id="notes" placeholder="Condições de pagamento, termos, referências..."
                                    rows={3} value={data.notes} onChange={(e) => setData('notes', e.target.value)}
                                    className="resize-none text-sm" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Customer Data */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <User size={14} className="text-blue-500" />
                                Dados do Cliente
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="customer_select" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                                    Cliente Registado
                                </Label>
                                <Select value={data.customer_id} onValueChange={handleCustomerChange}>
                                    <SelectTrigger id="customer_select">
                                        <SelectValue placeholder="Selecionar cliente da lista…" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {customers.map((c) => (
                                            <SelectItem key={c.id} value={c.id.toString()}>
                                                <span className="font-medium">{c.name}</span>
                                                {c.nuit && <span className="text-zinc-400 ml-1 text-xs">· {c.nuit}</span>}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Separator />
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="customer_name" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                                        Nome / Razão Social <span className="text-red-500">*</span>
                                    </Label>
                                    <Input id="customer_name" value={data.customer_name}
                                        onChange={(e) => setData('customer_name', e.target.value)}
                                        placeholder="Nome do cliente" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="customer_nuit" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                                        NUIT <span className="text-red-500">*</span>
                                    </Label>
                                    <Input id="customer_nuit" value={data.customer_nuit}
                                        onChange={(e) => setData('customer_nuit', e.target.value)}
                                        placeholder="000000000" className="font-mono" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="customer_phone" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Telefone</Label>
                                    <Input id="customer_phone" value={data.customer_phone}
                                        onChange={(e) => setData('customer_phone', e.target.value)} placeholder="+258..." />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="customer_email" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Email</Label>
                                    <Input id="customer_email" type="email" value={data.customer_email}
                                        onChange={(e) => setData('customer_email', e.target.value)} placeholder="email@..." />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="customer_address" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Morada</Label>
                                <Input id="customer_address" value={data.customer_address}
                                    onChange={(e) => setData('customer_address', e.target.value)}
                                    placeholder="Cidade, Bairro, Rua..." />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Line Items */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <PackageSearch size={14} className="text-blue-500" />
                                Linhas do Documento
                                <span className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-bold">
                                    {data.items.length}
                                </span>
                            </CardTitle>
                            <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-1.5">
                                <Plus size={14} />
                                Adicionar Linha
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {data.items.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors rounded-b-xl"
                                onClick={addItem}>
                                <PackageSearch className="text-zinc-300 dark:text-zinc-600 mb-2" size={36} />
                                <p className="text-zinc-400 dark:text-zinc-500 text-sm">Clique para adicionar a primeira linha</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
                                            <th className="text-left p-2 pl-4 text-xs font-medium text-zinc-500">Produto / Descrição</th>
                                            <th className="text-right p-2 text-xs font-medium text-zinc-500">Qtd</th>
                                            <th className="text-right p-2 text-xs font-medium text-zinc-500">Preço Unit.</th>
                                            <th className="text-right p-2 text-xs font-medium text-zinc-500">Desc. %</th>
                                            <th className="text-right p-2 text-xs font-medium text-zinc-500">IVA %</th>
                                            <th className="text-right p-2 pr-4 text-xs font-medium text-zinc-500">Total (MZN)</th>
                                            <th className="p-2 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.items.map((item, index) => (
                                            <ItemRow key={index} item={item} index={index}
                                                products={products} onChange={updateItem} onRemove={removeItem} />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Totals + Submit */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-end">
                    <div className="lg:col-span-2" />
                    <Card>
                        <CardContent className="pt-4 space-y-2">
                            <div className="flex justify-between text-sm text-zinc-600 dark:text-zinc-400">
                                <span>Subtotal</span>
                                <span className="font-mono">{fmt(totals.subtotal)} MZN</span>
                            </div>
                            {totals.discount > 0 && (
                                <div className="flex justify-between text-sm text-emerald-600 dark:text-emerald-400">
                                    <span>Desconto</span>
                                    <span className="font-mono">- {fmt(totals.discount)} MZN</span>
                                </div>
                            )}
                            <div className="flex justify-between text-sm text-zinc-600 dark:text-zinc-400">
                                <span>IVA</span>
                                <span className="font-mono">{fmt(totals.tax)} MZN</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between text-base font-bold text-zinc-900 dark:text-zinc-100">
                                <span>Total Geral</span>
                                <span className="font-mono text-blue-600 dark:text-blue-400">{fmt(totals.total)} MZN</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                    <Button type="button" variant="outline" onClick={() => router.get(cancelRoute)}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={processing || data.items.length === 0} className="gap-2 min-w-[180px]">
                        <Save size={16} />
                        {processing ? 'A gravar…' : 'Gravar Rascunho'}
                    </Button>
                </div>
            </form>
        </>
    );
}
