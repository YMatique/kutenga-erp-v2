import { Head, Link } from '@inertiajs/react';

interface Warehouse {
    id: number;
    name: string;
}

interface Transfer {
    id: number;
    status: string;
    from_warehouse: Warehouse;
    to_warehouse: Warehouse;
}

interface Props {
    transfers: Transfer[];
}

export default function Index({ transfers }: Props) {
    return (
        <>
            <Head title="Transferências" />

            <div className="flex flex-col gap-6">

                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold">Transferências</h1>
                        <p className="text-sm text-muted-foreground">
                            Movimentação entre armazéns
                        </p>
                    </div>

                    <Link
                        href="/inventory/transfers/create"
                        className="px-4 py-2 bg-black text-white rounded-lg"
                    >
                        Nova Transferência
                    </Link>
                </div>

                <div className="border rounded-xl overflow-hidden bg-white dark:bg-zinc-900">
                    <table className="w-full text-sm">
                        <thead className="bg-zinc-50 dark:bg-zinc-800">
                            <tr>
                                <th className="p-3">ID</th>
                                <th className="p-3">Origem</th>
                                <th className="p-3">Destino</th>
                                <th className="p-3">Status</th>
                                <th className="p-3 text-right">Ação</th>
                            </tr>
                        </thead>

                        <tbody>
                            {transfers.map((t) => (
                                <tr key={t.id} className="border-t">
                                    <td className="p-3">{t.id}</td>
                                    <td className="p-3">{t.from_warehouse.name}</td>
                                    <td className="p-3">{t.to_warehouse.name}</td>
                                    <td className="p-3">{t.status}</td>
                                    <td className="p-3 text-right">
                                        {t.status !== 'completed' && (
                                            <Link
                                                href={`/inventory/transfers/${t.id}/complete`}
                                                method="post"
                                                as="button"
                                                className="text-green-600 hover:underline"
                                            >
                                                Finalizar
                                            </Link>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

            </div>
        </>
    );
}