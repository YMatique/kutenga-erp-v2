import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Nota: A função route() é injetada globalmente pelo Ziggy no Laravel.
// Certifique-se de que o pacote ziggy-js está configurado no seu projeto.

export default function DocumentShow({ document, warehouses }) {
    const { post, setData, processing } = useForm({
        warehouse_id: warehouses[0]?.id || ''
    });

    const handleConfirm = () => {
        post(route('documents.confirm', document.id));
    };

    return (
        <div className="p-6 space-y-6">
            <Head title={`Documento ${document.document_number || 'Rascunho'}`} />
            
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Detalhe do Documento</h1>
                {document.status === 'draft' && (
                    <div className="flex gap-2">
                        <Select onValueChange={(v) => setData('warehouse_id', v)}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Armazém de Saída" />
                            </SelectTrigger>
                            <SelectContent>
                                {warehouses.map(w => <SelectItem key={w.id} value={w.id.toString()}>{w.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Button onClick={handleConfirm} disabled={processing}>Confirmar e Emitir</Button>
                    </div>
                )}
            </div>

            <Card>
                <CardHeader><CardTitle>Informações do Cliente</CardTitle></CardHeader>
                <CardContent>
                    <p><strong>Nome:</strong> {document.customer_name}</p>
                    <p><strong>NUIT:</strong> {document.customer_nuit}</p>
                </CardContent>
            </Card>
            
            {/* Secção de itens da fatura a adicionar conforme necessário */}
        </div>
    );
}