import { Head, usePage, Link } from '@inertiajs/react';

export default function InventoryDashboard() {
    const { stats, lowStockProducts, outOfStockProducts, recentMovements }: any =
        usePage().props;

    return (
        <>
            <Head title="Inventário" />

            <div className="p-6 space-y-6">

                {/* HEADER */}
                <div>
                    <h1 className="text-xl font-bold">
                        Dashboard de Inventário
                    </h1>

                    <p className="text-sm text-gray-500">
                        Visão geral do stock e movimentações.
                    </p>
                </div>

                {/* STATS */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

                    <div className="border p-4 rounded bg-white">
                        <p className="text-sm text-gray-500">Produtos</p>
                        <p className="text-xl font-bold">{stats.total_products}</p>
                    </div>

                    <div className="border p-4 rounded bg-white">
                        <p className="text-sm text-gray-500">Stock Baixo</p>
                        <p className="text-xl font-bold text-yellow-600">
                            {stats.low_stock}
                        </p>
                    </div>

                    <div className="border p-4 rounded bg-white">
                        <p className="text-sm text-gray-500">Sem Stock</p>
                        <p className="text-xl font-bold text-red-600">
                            {stats.out_of_stock}
                        </p>
                    </div>

                    <div className="border p-4 rounded bg-white">
                        <p className="text-sm text-gray-500">Armazéns</p>
                        <p className="text-xl font-bold">
                            {stats.total_warehouses}
                        </p>
                    </div>

                </div>

                {/* LOW STOCK */}
                <div className="border rounded p-4 bg-white">
                    <h2 className="font-semibold mb-3">
                        ⚠️ Stock Baixo
                    </h2>

                    <div className="space-y-2">
                        {lowStockProducts.map((p: any) => (
                            <div key={p.id} className="flex justify-between border-b py-2">
                                <span>{p.name}</span>
                                <span className="text-yellow-600 text-sm">
                                    Atenção
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* OUT OF STOCK */}
                <div className="border rounded p-4 bg-white">
                    <h2 className="font-semibold mb-3">
                        ❌ Sem Stock
                    </h2>

                    <div className="space-y-2">
                        {outOfStockProducts.map((p: any) => (
                            <div key={p.id} className="flex justify-between border-b py-2">
                                <span>{p.name}</span>
                                <span className="text-red-600 text-sm">
                                    Esgotado
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RECENT MOVEMENTS */}
                <div className="border rounded p-4 bg-white">
                    <h2 className="font-semibold mb-3">
                        🔁 Movimentos Recentes
                    </h2>

                    <div className="space-y-2">
                        {recentMovements.map((m: any) => (
                            <div key={m.id} className="flex justify-between border-b py-2 text-sm">

                                <div>
                                    <p className="font-medium">
                                        {m.product.name}
                                    </p>
                                    <p className="text-gray-500">
                                        {m.warehouse.name}
                                    </p>
                                </div>

                                <div className="text-right">
                                    <p>
                                        {m.type} ({m.quantity})
                                    </p>
                                </div>

                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </>
    );
}