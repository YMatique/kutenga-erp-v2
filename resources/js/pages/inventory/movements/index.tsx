import { Head, usePage } from '@inertiajs/react';

interface Movement {
    id: number;
    type: 'in' | 'out' | 'adjustment';
    quantity: number;
    notes: string | null;
    created_at: string;

    product: {
        name: string;
        sku: string | null;
    };

    warehouse: {
        name: string;
    };

    user: {
        name: string;
    };
}

export default function MovementsIndex() {
    const { movements } = usePage<{ movements: any }>().props;

    return (
        <>
            <Head title="Movimentos de Stock" />

            <div className="p-6 space-y-6">

                {/* Header */}
                <div>
                    <h1 className="text-xl font-bold">
                        Movimentos de Stock
                    </h1>

                    <p className="text-sm text-gray-500">
                        Histórico completo de entradas, saídas e ajustes.
                    </p>
                </div>

                {/* Table */}
                <div className="border rounded-lg overflow-hidden bg-white">

                    <table className="w-full text-sm">

                        <thead className="bg-gray-50 text-left">
                            <tr>
                                <th className="p-3">Produto</th>
                                <th className="p-3">Armazém</th>
                                <th className="p-3">Tipo</th>
                                <th className="p-3">Qtd</th>
                                <th className="p-3">Utilizador</th>
                                <th className="p-3">Data</th>
                            </tr>
                        </thead>

                        <tbody>

                            {movements.data.map((m: Movement) => (
                                <tr key={m.id} className="border-t">

                                    {/* Produto */}
                                    <td className="p-3">
                                        <div>
                                            <p className="font-medium">
                                                {m.product.name}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {m.product.sku || 'SEM SKU'}
                                            </p>
                                        </div>
                                    </td>

                                    {/* Warehouse */}
                                    <td className="p-3">
                                        {m.warehouse?.name}
                                    </td>

                                    {/* Type */}
                                    <td className="p-3">
                                        <span className={`
                                            px-2 py-1 text-xs rounded
                                            ${m.type === 'in' && 'bg-green-100 text-green-700'}
                                            ${m.type === 'out' && 'bg-red-100 text-red-700'}
                                            ${m.type === 'adjustment' && 'bg-yellow-100 text-yellow-700'}
                                        `}>
                                            {m.type}
                                        </span>
                                    </td>

                                    {/* Quantity */}
                                    <td className="p-3 font-medium">
                                        {m.quantity}
                                    </td>

                                    {/* User */}
                                    <td className="p-3">
                                        {m.user?.name}
                                    </td>

                                    {/* Date */}
                                    <td className="p-3 text-gray-500 text-xs">
                                        {new Date(m.created_at).toLocaleString()}
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