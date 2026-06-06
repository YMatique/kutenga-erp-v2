import { Head } from '@inertiajs/react';

interface Warehouse {
    id: number;
    name: string;
}

interface Stock {
    id: number;
    quantity: number;
    warehouse: Warehouse;
}

interface Product {
    id: number;
    name: string;
}

interface Props {
    product: Product;
    stocks: Stock[];
}

export default function Show({ product, stocks }: Props) {
    const totalStock = stocks.reduce((sum, s) => sum + s.quantity, 0);

    return (
        <>
            <Head title={`Stock - ${product.name}`} />

            <div className="flex flex-col gap-6">
                {/* HEADER */}
                <div>
                    <h1 className="text-2xl font-bold">
                        {product.name}
                    </h1>

                    <p className="text-muted-foreground text-sm">
                        Stock distribuído por armazém
                    </p>
                </div>

                {/* SUMMARY CARD */}
                <div className="p-4 border rounded-xl bg-white dark:bg-zinc-900">
                    <div className="text-sm text-muted-foreground">
                        Stock total
                    </div>
                    <div className="text-2xl font-bold">
                        {totalStock}
                    </div>
                </div>

                {/* TABLE */}
                <div className="border rounded-xl overflow-hidden bg-white dark:bg-zinc-900">
                    <table className="w-full text-sm">
                        <thead className="bg-zinc-50 dark:bg-zinc-800">
                            <tr>
                                <th className="p-3 text-left">Armazém</th>
                                <th className="p-3 text-right">Quantidade</th>
                            </tr>
                        </thead>

                        <tbody>
                            {stocks.map((stock) => (
                                <tr key={stock.id} className="border-t">
                                    <td className="p-3">
                                        {stock.warehouse.name}
                                    </td>

                                    <td className="p-3 text-right font-semibold">
                                        {stock.quantity}
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