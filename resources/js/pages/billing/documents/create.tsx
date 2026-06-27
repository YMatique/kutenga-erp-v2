import React, { useState, useMemo } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Plus, Trash2, Save, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';

export default function DocumentCreate({ customers, products, series, warehouses }) {
    const { data, setData, post, processing } = useForm({
        customer_id: '',
        customer_name: '',
        customer_nuit: '',
        document_type: 'FT',
        series_id: series[0]?.id || '',
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date().toISOString().split('T')[0],
        items: []
    });

    const addItem = () => {
        setData('items', [...data.items, { product_id: '', product_name: '', quantity: 1, unit_price: 0, tax_rate: 16, discount_percent: 0 }]);
    };

    const updateItem = (index, field, value) => {
        const newItems = [...data.items];
        newItems[index][field] = value;
        setData('items', newItems);
    };

    const totals = useMemo(() => {
        return data.items.reduce((acc, item) => {
            const subtotal = item.quantity * item.unit_price;
            const discount = subtotal * (item.discount_percent / 100);
            const taxable = subtotal - discount;
            const tax = taxable * (item.tax_rate / 100);
            return {
                subtotal: acc.subtotal + subtotal,
                tax: acc.tax + tax,
                total: acc.total + (taxable + tax)
            };
        }, { subtotal: 0, tax: 0, total: 0 });
    }, [data.items]);

    return (
        <div className="p-6 space-y-6">
            <Head title="Nova Fatura" />
            <h1 className="text-2xl font-bold flex items-center gap-2"><FileText /> Emitir Novo Documento</h1>
            
            <Card>
                <CardContent className="pt-6 grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label>Cliente</Label>
                        <Select onValueChange={(v) => setData('customer_id', v)}>
                            <SelectTrigger><SelectValue placeholder="Selecione o Cliente" /></SelectTrigger>
                            <SelectContent>
                                {customers.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    {/* Campos adicionais de NUIT, Tipo, Data... */}
                </CardContent>
            </Card>

            <table className="w-full border-collapse">
                <thead>
                    <tr className="border-b">
                        <th className="text-left p-2">Produto</th>
                        <th className="text-right p-2">Qtd</th>
                        <th className="text-right p-2">Preço</th>
                        <th className="text-right p-2">Total</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {data.items.map((item, index) => (
                        <tr key={index} className="border-b">
                            <td className="p-2"><Input onChange={e => updateItem(index, 'product_name', e.target.value)} /></td>
                            <td className="p-2"><Input type="number" onChange={e => updateItem(index, 'quantity', e.target.value)} /></td>
                            <td className="p-2"><Input type="number" onChange={e => updateItem(index, 'unit_price', e.target.value)} /></td>
                            <td className="p-2 text-right">{((item.quantity * item.unit_price)).toFixed(2)} MZN</td>
                            <td className="p-2"><Button variant="ghost" onClick={() => setData('items', data.items.filter((_, i) => i !== index))}><Trash2 className="text-red-500" size={18} /></Button></td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <Button onClick={addItem}><Plus className="mr-2" size={16} /> Adicionar Item</Button>
            
            <div className="text-right text-xl font-bold mt-4">
                Total: {totals.total.toFixed(2)} MZN
            </div>

            <Button onClick={() => post(route('documents.store'))} disabled={processing} className="w-full">
                <Save className="mr-2" /> Gravar Rascunho
            </Button>
        </div>
    );
}