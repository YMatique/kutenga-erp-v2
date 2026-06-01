import { useForm, Head, Link } from '@inertiajs/react';

export default function Edit({ warehouse }: any) {
    const { data, setData, put, processing, errors } = useForm({
        name: warehouse.name || '',
        code: warehouse.code || '',
        address: warehouse.address || '',
        description: warehouse.description || '',
        is_default: warehouse.is_default || false,
        is_active: warehouse.is_active ?? true,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        put(`/inventory/warehouses/${warehouse.id}`);
    }

    return (
        <>
            <Head title="Editar Armazém" />

            <div className="max-w-2xl mx-auto p-6 space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold">
                        Editar Armazém
                    </h1>

                    <Link
                        href="/warehouses"
                        className="text-sm text-gray-500 hover:text-black"
                    >
                        Voltar
                    </Link>
                </div>

                {/* Form */}
                <form onSubmit={submit} className="space-y-4 border p-6 rounded-lg bg-white">

                    {/* Nome */}
                    <div>
                        <label className="text-sm font-medium">
                            Nome
                        </label>
                        <input
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className="w-full border p-2 rounded mt-1"
                        />
                        {errors.name && (
                            <p className="text-red-500 text-xs mt-1">
                                {errors.name}
                            </p>
                        )}
                    </div>

                    {/* Código */}
                    <div>
                        <label className="text-sm font-medium">
                            Código
                        </label>
                        <input
                            type="text"
                            value={data.code}
                            onChange={(e) => setData('code', e.target.value)}
                            className="w-full border p-2 rounded mt-1"
                        />
                    </div>

                    {/* Endereço */}
                    <div>
                        <label className="text-sm font-medium">
                            Endereço
                        </label>
                        <input
                            type="text"
                            value={data.address}
                            onChange={(e) => setData('address', e.target.value)}
                            className="w-full border p-2 rounded mt-1"
                        />
                    </div>

                    {/* Descrição */}
                    <div>
                        <label className="text-sm font-medium">
                            Descrição
                        </label>
                        <textarea
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            className="w-full border p-2 rounded mt-1"
                        />
                    </div>

                    {/* Checkboxes */}
                    <div className="flex items-center gap-6">

                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={data.is_default}
                                onChange={(e) =>
                                    setData('is_default', e.target.checked)
                                }
                            />
                            Padrão
                        </label>

                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={data.is_active}
                                onChange={(e) =>
                                    setData('is_active', e.target.checked)
                                }
                            />
                            Ativo
                        </label>

                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4">

                        <Link
                            href="/inventory/warehouses"
                            className="px-4 py-2 border rounded"
                        >
                            Cancelar
                        </Link>

                        <button
                            type="submit"
                            disabled={processing}
                            className="px-4 py-2 bg-black text-white rounded"
                        >
                            {processing ? 'Salvando...' : 'Atualizar'}
                        </button>

                    </div>

                </form>
            </div>
        </>
    );
}