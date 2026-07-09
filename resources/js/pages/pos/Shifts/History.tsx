import { Head, Link } from '@inertiajs/react';
import KutengaLayout from '@/Layouts/kutenga-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

export default function History({ shifts }: any) {
    return (
        <KutengaLayout>
            <Head title="Histórico de Turnos POS" />
            <div className="flex flex-col gap-6 p-6 max-w-6xl mx-auto">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Histórico de Turnos</h1>
                        <p className="text-neutral-500 mt-1">
                            Acompanhe os turnos abertos e fechados no Ponto de Venda.
                        </p>
                    </div>
                    <Link href="/pos">
                        <Button>Aceder ao POS</Button>
                    </Link>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-neutral-50 text-neutral-500 border-b border-neutral-200">
                            <tr>
                                <th className="px-6 py-4 font-medium">ID Turno</th>
                                <th className="px-6 py-4 font-medium">Utilizador</th>
                                <th className="px-6 py-4 font-medium">Estado</th>
                                <th className="px-6 py-4 font-medium">Abertura</th>
                                <th className="px-6 py-4 font-medium">Fecho</th>
                                <th className="px-6 py-4 font-medium text-right">Fundo de Maneio</th>
                                <th className="px-6 py-4 font-medium text-right">Caixa Final</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200">
                            {shifts.data.map((shift: any) => (
                                <tr key={shift.id} className="hover:bg-neutral-50">
                                    <td className="px-6 py-4 font-medium text-neutral-900">#{shift.id}</td>
                                    <td className="px-6 py-4">{shift.user.name}</td>
                                    <td className="px-6 py-4">
                                        <Badge variant={shift.status === 'open' ? 'default' : 'secondary'} className={shift.status === 'open' ? 'bg-green-100 text-green-700 hover:bg-green-100' : ''}>
                                            {shift.status === 'open' ? 'Aberto' : 'Fechado'}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4">
                                        {format(new Date(shift.opened_at), 'dd/MM/yyyy HH:mm')}
                                    </td>
                                    <td className="px-6 py-4">
                                        {shift.closed_at ? format(new Date(shift.closed_at), 'dd/MM/yyyy HH:mm') : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {parseFloat(shift.starting_cash).toLocaleString('pt-MZ', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-6 py-4 text-right font-medium">
                                        {shift.ending_cash ? parseFloat(shift.ending_cash).toLocaleString('pt-MZ', { minimumFractionDigits: 2 }) : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </KutengaLayout>
    );
}
