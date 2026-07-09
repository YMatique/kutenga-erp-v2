import { Head } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, History } from 'lucide-react';
export interface PaginatedData<T> {
    data: T[];
    current_page: number;
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
}

export interface Activity {
    id: number;
    log_name: string;
    description: string;
    subject_type: string;
    subject_id: number;
    causer_name: string;
    causer_email: string;
    properties: any;
    created_at: string;
    created_at_human: string;
}

export default function Audits({ activities }: { activities: PaginatedData<Activity> }) {
    
    const getActionBadge = (description: string) => {
        switch (description) {
            case 'created':
                return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Criado</Badge>;
            case 'updated':
                return <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200">Atualizado</Badge>;
            case 'deleted':
                return <Badge variant="destructive">Eliminado</Badge>;
            default:
                return <Badge variant="outline">{description}</Badge>;
        }
    };

    const getSubjectName = (type: string) => {
        switch (type) {
            case 'User': return 'Utilizador';
            case 'Customer': return 'Cliente';
            case 'Product': return 'Produto';
            case 'Document': return 'Documento';
            case 'Invoice': return 'Fatura';
            default: return type;
        }
    };

    return (
        <div className="flex flex-col gap-8 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <Head title="Auditoria e Logs" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <History className="h-6 w-6 text-[#2DB8A0]" />
                        Auditoria de Sistema
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Histórico completo de todas as ações realizadas pelos utilizadores no sistema.
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Últimas Atividades</CardTitle>
                    <CardDescription>
                        A visualizar os logs mais recentes da tua empresa.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Data / Hora</TableHead>
                                    <TableHead>Utilizador</TableHead>
                                    <TableHead>Ação</TableHead>
                                    <TableHead>Registo</TableHead>
                                    <TableHead>Detalhes</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {activities.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                                            Nenhuma atividade registada ainda.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    activities.data.map((log: Activity) => (
                                        <TableRow key={log.id}>
                                            <TableCell>
                                                <div className="font-medium">{log.created_at}</div>
                                                <div className="text-xs text-slate-500">{log.created_at_human}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">{log.causer_name}</div>
                                                {log.causer_email && <div className="text-xs text-slate-500">{log.causer_email}</div>}
                                            </TableCell>
                                            <TableCell>
                                                {getActionBadge(log.description)}
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-medium text-slate-700">
                                                    {getSubjectName(log.subject_type)}
                                                </span>
                                                <span className="text-xs text-slate-500 ml-1">#{log.subject_id}</span>
                                            </TableCell>
                                            <TableCell className="text-xs text-slate-500">
                                                {/* Se tiver dados antigos/novos, mostramos um resumo */}
                                                {log.properties?.old && Object.keys(log.properties.old).length > 0 && (
                                                    <span>Alterou {Object.keys(log.properties.old).length} campos</span>
                                                )}
                                                {log.description === 'created' && <span>Criação original</span>}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Paginação */}
                    {activities.total > activities.per_page && (
                        <div className="flex items-center justify-between mt-4">
                            <div className="text-sm text-slate-500">
                                A mostrar <span className="font-medium">{activities.from}</span> a <span className="font-medium">{activities.to}</span> de <span className="font-medium">{activities.total}</span> resultados
                            </div>
                            <div className="flex items-center gap-2">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    disabled={!activities.prev_page_url}
                                    onClick={() => window.location.href = activities.prev_page_url || '#'}
                                >
                                    <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
                                </Button>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    disabled={!activities.next_page_url}
                                    onClick={() => window.location.href = activities.next_page_url || '#'}
                                >
                                    Seguinte <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
