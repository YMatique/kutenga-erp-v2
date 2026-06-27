import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Plus, FileText, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Nota: A função route() é injetada globalmente pelo Ziggy no Laravel.
// Certifique-se de que o pacote ziggy-js está instalado.

export default function DocumentIndex({ documents }) {
    return (
        <div className="p-6 space-y-6">
            <Head title="Documentos de Faturação" />
            
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <FileText /> Documentos
                </h1>
                <Link href={route('documents.create')}>
                    <Button><Plus className="mr-2" size={16} /> Novo Documento</Button>
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Histórico de Documentos</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableCell>Número</TableCell>
                                <TableCell>Data</TableCell>
                                <TableCell>Cliente</TableCell>
                                <TableCell>Total</TableCell>
                                <TableCell>Estado</TableCell>
                                <TableCell className="text-right">Ações</TableCell>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {documents.data.map((doc) => (
                                <TableRow key={doc.id}>
                                    <TableCell className="font-medium">{doc.document_number || 'Rascunho'}</TableCell>
                                    <TableCell>{doc.issue_date}</TableCell>
                                    <TableCell>{doc.customer_name}</TableCell>
                                    <TableCell>{Number(doc.grand_total).toFixed(2)} MZN</TableCell>
                                    <TableCell>
                                        <Badge variant={doc.status === 'confirmed' ? 'default' : 'secondary'}>
                                            {doc.status.toUpperCase()}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Link href={route('documents.show', doc.id)}>
                                            <Button variant="ghost" size="sm"><Eye size={16} /></Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}