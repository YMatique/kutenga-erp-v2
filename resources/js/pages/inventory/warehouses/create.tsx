import { useForm, Link } from '@inertiajs/react';

export default function Create() {
    const { data, setData, post } = useForm({
        name: '',
        code: '',
        address: '',
        description: '',
        is_default: false,
        is_active: true,
    });

    function submit(e: any) {
        e.preventDefault();
        post('/inventory/warehouses');
    }

    return (
        <div className="p-6">

            <h1 className="text-xl font-bold mb-4">
                Criar Armazém
            </h1>

            <form onSubmit={submit} className="space-y-3">

                <input
                    placeholder="Nome"
                    value={data.name}
                    onChange={e => setData('name', e.target.value)}
                    className="border p-2 w-full"
                />

                <input
                    placeholder="Código"
                    value={data.code}
                    onChange={e => setData('code', e.target.value)}
                    className="border p-2 w-full"
                />

                <input
                    placeholder="Endereço"
                    value={data.address}
                    onChange={e => setData('address', e.target.value)}
                    className="border p-2 w-full"
                />

                <textarea
                    placeholder="Descrição"
                    value={data.description}
                    onChange={e => setData('description', e.target.value)}
                    className="border p-2 w-full"
                />

                <button className="px-4 py-2 bg-black text-white">
                    Guardar
                </button>

            </form>
        </div>
    );
}