import { useState } from "react";
import { router } from "@inertiajs/react";

export default function Index({ products, warehouses }) {
    const [form, setForm] = useState({
        product_id: "",
        warehouse_id: "",
        quantity: 0,
        notes: "",
    });

    const [loading, setLoading] = useState(false);

    function submit(e) {
        e.preventDefault();
        setLoading(true);

        router.post("/inventory/opening", form, {
            preserveScroll: true,
            onSuccess: () => {
                setForm({
                    product_id: "",
                    warehouse_id: "",
                    quantity: 0,
                    notes: "",
                });
            },
            onFinish: () => setLoading(false),
        });
    }

    return (
        <div className="p-6">
            <h1 className="text-xl font-bold mb-4">
                Inventário Inicial
            </h1>

            <form onSubmit={submit} className="bg-white p-4 rounded shadow">

                <div className="grid grid-cols-3 gap-4">

                    {/* Produto */}
                    <div>
                        <label className="block text-sm font-medium">
                            Produto
                        </label>
                        <select
                            value={form.product_id}
                            onChange={(e) =>
                                setForm({ ...form, product_id: e.target.value })
                            }
                            className="w-full border p-2 rounded"
                        >
                            <option value="">Selecione</option>
                            {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Warehouse */}
                    <div>
                        <label className="block text-sm font-medium">
                            Armazém
                        </label>
                        <select
                            value={form.warehouse_id}
                            onChange={(e) =>
                                setForm({ ...form, warehouse_id: e.target.value })
                            }
                            className="w-full border p-2 rounded"
                        >
                            <option value="">Selecione</option>
                            {warehouses.map((w) => (
                                <option key={w.id} value={w.id}>
                                    {w.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Quantidade */}
                    <div>
                        <label className="block text-sm font-medium">
                            Quantidade
                        </label>
                        <input
                            type="number"
                            value={form.quantity}
                            onChange={(e) =>
                                setForm({ ...form, quantity: e.target.value })
                            }
                            className="w-full border p-2 rounded"
                        />
                    </div>

                </div>

                {/* Notas */}
                <div className="mt-4">
                    <label className="block text-sm font-medium">
                        Notas
                    </label>
                    <textarea
                        value={form.notes}
                        onChange={(e) =>
                            setForm({ ...form, notes: e.target.value })
                        }
                        className="w-full border p-2 rounded"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
                >
                    {loading ? "A processar..." : "Definir Stock Inicial"}
                </button>
            </form>
        </div>
    );
}