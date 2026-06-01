import { Link, usePage } from '@inertiajs/react';

export default function Index() {
    const { warehouses } = usePage().props;

    return (
        <div className="p-6">

            <div className="flex justify-between mb-4">
                <h1 className="text-xl font-bold">
                    Armazéns
                </h1>

                <Link href="/inventory/warehouses/create">
                    <button className="px-4 py-2 bg-black text-white rounded">
                        Novo
                    </button>
                </Link>
            </div>

            <div className="space-y-2">

                {warehouses.map((w: any) => (
                    <div
                        key={w.id}
                        className="border p-4 rounded flex justify-between"
                    >
                        <div>
                            <p className="font-semibold">{w.name}</p>
                            <p className="text-sm text-gray-500">
                                {w.code}
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <Link href={`/inventory/warehouses/${w.id}/edit`}>
                                Editar
                            </Link>
                        </div>
                    </div>
                ))}

            </div>
        </div>
    );
}