import { router } from '@inertiajs/react';
import { Head } from '@inertiajs/react';
import { Package2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { CameraScanButton } from '@/components/camera-scanner';
import { PageHeader } from '@/components/ui/brand';
import { Label } from '@/components/ui/label';
import { useBarcodeScanner } from '@/hooks/use-barcode-scanner';
import AppLayout from '@/layouts/app-layout';
import { matchesCode } from '@/lib/product-lookup';
import { beepError, beepSuccess } from '@/lib/scan-feedback';

interface Product {
    id: number;
    name: string;
    sku?: string | null;
    barcode?: string | null;
}

interface Warehouse {
    id: number;
    name: string;
}

interface OpeningForm {
    product_id: string;
    warehouse_id: string;
    quantity: number | string;
    notes: string;
}

export default function Index({
    products,
    warehouses,
}: {
    products: Product[];
    warehouses: Warehouse[];
}) {
    const [form, setForm] = useState<OpeningForm>({
        product_id: '',
        warehouse_id: '',
        quantity: 0,
        notes: '',
    });

    const [loading, setLoading] = useState(false);
    const quantityRef = useRef<HTMLInputElement>(null);

    // Ler um código seleciona o produto e passa para a quantidade
    const handleScan = (code: string) => {
        const product = products.find((p) => matchesCode(p, code));

        if (!product) {
            beepError();
            toast.error(`Código ${code} não encontrado entre os produtos com controlo de stock.`);

            return;
        }

        setForm((f) => ({ ...f, product_id: String(product.id) }));
        beepSuccess();
        toast.success(product.name, { duration: 1200 });
        quantityRef.current?.focus();
        quantityRef.current?.select();
    };

    useBarcodeScanner({ onScan: handleScan });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        router.post('/inventory/opening', form as any, {
            preserveScroll: true,
            onSuccess: () => {
                setForm({ product_id: '', warehouse_id: '', quantity: 0, notes: '' });
            },
            onFinish: () => setLoading(false),
        });
    }

    return (
        <>
            <Head title="Inventário Inicial" />
            <div className=" space-y-4">
                <PageHeader
                    title="Inventário Inicial"
                    subtitle="Registe o stock de abertura para os seus produtos"
                />

                <div className="bg-white border border-slate-200 rounded-[4px] shadow-xs max-w-2xl">
                    <div className="px-6 py-4 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-[4px] bg-[#2DB8A0]/10 flex items-center justify-center">
                                <Package2 className="h-4 w-4 text-[#2DB8A0]" />
                            </div>
                            <div>
                                <h2 className="text-sm font-semibold text-slate-900">Definir Stock Inicial</h2>
                                <p className="text-xs text-slate-500">Preencha os campos abaixo para registar o saldo de abertura</p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={submit} className="p-6 space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            {/* Produto */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium text-slate-700">Produto *</Label>
                                    <CameraScanButton onScan={handleScan} size="sm" className="h-7 gap-1 px-2 text-xs" />
                                </div>
                                <select
                                    value={form.product_id}
                                    onChange={(e) => setForm({ ...form, product_id: e.target.value })}
                                    required
                                    className="w-full h-9 border border-slate-200 rounded-[4px] px-3 text-sm text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-[#2DB8A0] focus:border-[#2DB8A0] transition-colors"
                                >
                                    <option value="">Selecione um produto</option>
                                    {products.map((p) => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Armazém */}
                            <div className="space-y-1.5">
                                <Label className="text-sm font-medium text-slate-700">Armazém *</Label>
                                <select
                                    value={form.warehouse_id}
                                    onChange={(e) => setForm({ ...form, warehouse_id: e.target.value })}
                                    required
                                    className="w-full h-9 border border-slate-200 rounded-[4px] px-3 text-sm text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-[#2DB8A0] focus:border-[#2DB8A0] transition-colors"
                                >
                                    <option value="">Selecione um armazém</option>
                                    {warehouses.map((w) => (
                                        <option key={w.id} value={w.id}>{w.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Quantidade */}
                            <div className="space-y-1.5">
                                <Label className="text-sm font-medium text-slate-700">Quantidade *</Label>
                                <input
                                    ref={quantityRef}
                                    type="number"
                                    min="0"
                                    step="0.001"
                                    value={form.quantity}
                                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                                    required
                                    className="w-full h-9 border border-slate-200 rounded-[4px] px-3 text-sm text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-[#2DB8A0] focus:border-[#2DB8A0] transition-colors"
                                />
                            </div>
                        </div>

                        {/* Notas */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-medium text-slate-700">Notas (opcional)</Label>
                            <textarea
                                value={form.notes}
                                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                rows={3}
                                placeholder="Adicione uma nota sobre este registo..."
                                className="w-full border border-slate-200 rounded-[4px] px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-[#2DB8A0] focus:border-[#2DB8A0] transition-colors resize-none"
                            />
                        </div>

                        <div className="flex items-center gap-3 pt-1">
                            <button
                                type="submit"
                                disabled={loading}
                                className="inline-flex items-center gap-2 h-9 px-4 text-sm font-semibold bg-[#E8A020] text-white rounded-[4px] hover:bg-[#d49218] disabled:opacity-60 transition-colors"
                            >
                                {loading ? 'A processar...' : 'Definir Stock Inicial'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}

Index.layout = (page: any) => (
    <AppLayout breadcrumbs={[
        { title: 'Inventário', href: '#' },
        { title: 'Stock Inicial', href: '/inventory/opening' },
    ]}>
        {page}
    </AppLayout>
);