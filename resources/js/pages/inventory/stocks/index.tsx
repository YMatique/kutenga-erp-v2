import { Head, Link } from '@inertiajs/react';

interface Product {
    id: number;
    name: string;
}

interface Warehouse {
    id: number;
    name: string;
}

interface Stock {
    id: number;
    quantity: number;
    product: Product;
    warehouse: Warehouse;
}

interface Props {
    stocks: Stock[];
}

export default function Index({ stocks }: Props) {
    return (
        <>
            <Head title="Stock Geral" />

            <div className="flex flex-col gap-6">
                {/* HEADER */}
                <div>
                    <h1 className="text-2xl font-bold">Stock Geral</h1>
                    <p className="text-sm text-muted-foreground">
                        Visão geral do stock por produto e armazém
                    </p>
                </div>

                {/* TABLE */}
                <div className="border rounded-xl overflow-hidden bg-white dark:bg-zinc-900">
                    <table className="w-full text-sm">
                        <thead className="bg-zinc-50 dark:bg-zinc-800 text-left">
                            <tr>
                                <th className="p-3">Produto</th>
                                <th className="p-3">Armazém</th>
                                <th className="p-3 text-right">Stock</th>
                                <th className="p-3 text-right">Ação</th>
                            </tr>
                        </thead>

                        <tbody>
                            {stocks.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-6 text-center text-muted-foreground">
                                        Nenhum stock encontrado
                                    </td>
                                </tr>
                            ) : (
                                stocks.map((stock) => (
                                    <tr key={stock.id} className="border-t">
                                        <td className="p-3 font-medium">
                                            {stock.product.name}
                                        </td>

                                        <td className="p-3 text-muted-foreground">
                                            {stock.warehouse.name}
                                        </td>

                                        <td className="p-3 text-right font-semibold">
                                            {stock.quantity}
                                        </td>

                                        <td className="p-3 text-right">
                                            <Link
                                                href={`/inventory/stocks/${stock.product.id}`}
                                                className="text-blue-600 hover:underline"
                                            >
                                                Detalhes
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}