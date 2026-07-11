import { Head } from '@inertiajs/react';
import { useState, useMemo, useEffect } from 'react';
import { Search, ShoppingCart, Trash2, Plus, Minus, ShoppingBag, LayoutGrid, LogOut, Package } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import PaymentModal from './Components/PaymentModal';

interface Product {
    id: number;
    name: string;
    sale_price: number | string;
    image_url?: string | null;
    category_id: number;
    category?: string;
    unit?: string;
    tax_rate: number;
    sku?: string;
}

interface Category { id: number; name: string; }

interface CartItem extends Product { cart_id: string; quantity: number; }

const genId = () => Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);

function LiveClock() {
    const [t, setT] = useState(new Date());
    useEffect(() => { const i = setInterval(() => setT(new Date()), 1000); return () => clearInterval(i); }, []);
    return (
        <div className="hidden lg:block text-center">
            <p className="font-mono text-xl font-bold text-white leading-none">
                {t.toLocaleTimeString('pt-MZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
            <p className="text-xs text-white/40 capitalize mt-0.5">
                {t.toLocaleDateString('pt-MZ', { weekday: 'short', day: '2-digit', month: 'short' })}
            </p>
        </div>
    );
}

export default function PosIndex({ shift, categories, products, auth }: any) {
    const [search, setSearch] = useState('');
    const [activeCat, setActiveCat] = useState<number | null>(null);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [payOpen, setPayOpen] = useState(false);

    const filtered = useMemo(() =>
        products.filter((p: Product) => {
            const q = search.toLowerCase();
            return (!q || p.name.toLowerCase().includes(q) || (p.sku ?? '').toLowerCase().includes(q))
                && (activeCat === null || p.category_id === activeCat);
        }),
    [products, search, activeCat]);

    const addToCart = (p: Product) => setCart(prev => {
        const ex = prev.find(i => i.id === p.id);
        if (ex) return prev.map(i => i.id === p.id ? { ...i, quantity: i.quantity + 1 } : i);
        return [...prev, { ...p, cart_id: genId(), quantity: 1 }];
    });

    const updateQty = (id: string, d: number) => setCart(prev =>
        prev.map(i => i.cart_id === id ? { ...i, quantity: Math.max(1, i.quantity + d) } : i)
    );

    const remove = (id: string) => setCart(prev => prev.filter(i => i.cart_id !== id));

    const totals = useMemo(() => {
        let sub = 0, tax = 0;
        cart.forEach(i => {
            const p = parseFloat(String(i.sale_price)) || 0;
            const l = p * i.quantity;
            sub += l; tax += l * (i.tax_rate / 100);
        });
        return { sub, tax, total: sub + tax };
    }, [cart]);

    const fmt = (n: number) => n.toLocaleString('pt-MZ', { minimumFractionDigits: 2 });

    return (
        // A página POS ocupa o ecrã completo e usa o design system do app
        <div className="h-screen flex flex-col bg-[#1A2332] overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
            <Head title="POS • Caixa" />

            {/* ── Header (sidebar color = #1A2332) ── */}
            <header className="h-14 flex items-center justify-between px-5 shrink-0 border-b border-white/8">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                        <ShoppingBag className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <p className="text-[11px] text-white/40 leading-none uppercase tracking-wide">Kutenga ERP</p>
                        <p className="text-sm font-semibold text-white leading-tight">Ponto de Venda</p>
                    </div>
                    {shift && (
                        <div className="hidden sm:flex items-center gap-1.5 ml-2 bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-xs font-medium px-3 py-1 rounded-full">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Turno #{shift.id}
                        </div>
                    )}
                </div>

                <LiveClock />

                <div className="flex items-center gap-1">
                    {auth?.user?.name && (
                        <span className="hidden md:block text-xs text-white/40 mr-2">{auth.user.name}</span>
                    )}
                    <Link href="/pos/shifts">
                        <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/10 gap-1.5">
                            <LayoutGrid className="w-4 h-4" />
                            <span className="hidden sm:block">Gestão</span>
                        </Button>
                    </Link>
                    <Link href="/pos/shifts/close">
                        <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-500/15 gap-1.5">
                            <LogOut className="w-4 h-4" />
                            <span className="hidden sm:block">Fechar Turno</span>
                        </Button>
                    </Link>
                </div>
            </header>

            {/* ── Body ── */}
            <div className="flex-1 flex overflow-hidden">

                {/* ════ LEFT: Catálogo ════ */}
                <div className="flex-1 flex flex-col overflow-hidden bg-neutral-50">

                    {/* Search + Categories */}
                    <div className="bg-white border-b border-neutral-200 px-5 py-3 space-y-3 shrink-0">
                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                            <Input
                                placeholder="Pesquisar por nome ou código SKU..."
                                className="pl-10 h-10 bg-neutral-50 border-neutral-200 rounded-xl text-sm"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
                            <button
                                onClick={() => setActiveCat(null)}
                                className={`shrink-0 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                                    activeCat === null
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                        : 'bg-white text-neutral-600 border-neutral-200 hover:border-blue-300 hover:text-blue-600'
                                }`}
                            >
                                Todos
                            </button>
                            {categories.map((c: Category) => (
                                <button
                                    key={c.id}
                                    onClick={() => setActiveCat(c.id)}
                                    className={`shrink-0 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                                        activeCat === c.id
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                            : 'bg-white text-neutral-600 border-neutral-200 hover:border-blue-300 hover:text-blue-600'
                                    }`}
                                >
                                    {c.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Grid */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {filtered.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-neutral-400 gap-3">
                                <Package className="w-12 h-12 opacity-30" />
                                <p className="text-sm">Nenhum produto encontrado</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
                                {filtered.map((p: Product) => {
                                    const price = parseFloat(String(p.sale_price)) || 0;
                                    const inCart = cart.find(i => i.id === p.id);
                                    return (
                                        <button
                                            key={p.id}
                                            onClick={() => addToCart(p)}
                                            className={`relative group bg-white rounded-xl overflow-hidden text-left transition-all duration-150 border ${
                                                inCart
                                                    ? 'border-blue-400 shadow-md ring-1 ring-blue-400/30'
                                                    : 'border-neutral-200 hover:border-blue-300 hover:shadow-md'
                                            }`}
                                        >
                                            <div className="aspect-square bg-neutral-50 overflow-hidden">
                                                {p.image_url ? (
                                                    <img
                                                        src={p.image_url}
                                                        alt={p.name}
                                                        className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                                                        onError={e => { (e.target as HTMLImageElement).parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center"><span class="text-4xl font-black text-neutral-200">${p.name[0]}</span></div>`; }}
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <span className="text-4xl font-black text-neutral-200">{p.name[0]}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-2.5">
                                                <p className="text-[11px] text-neutral-400 truncate">{p.category}</p>
                                                <p className="text-sm font-semibold text-neutral-900 line-clamp-2 mt-0.5 leading-snug min-h-[2.4rem]">{p.name}</p>
                                                <p className="text-sm font-bold text-blue-600 mt-1.5">{fmt(price)} MT</p>
                                            </div>
                                            {inCart && (
                                                <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-[11px] font-bold shadow">
                                                    {inCart.quantity}
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* ════ RIGHT: Carrinho ════ */}
                <div className="w-[360px] xl:w-[400px] shrink-0 flex flex-col bg-[#1e2d3d] border-l border-white/8">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2">
                            <ShoppingCart className="w-4 h-4 text-white/50" />
                            <span className="text-sm font-semibold text-white">
                                Venda em Curso
                                {cart.length > 0 && (
                                    <span className="ml-2 text-xs bg-white/15 text-white/70 rounded-full px-2 py-0.5">
                                        {cart.reduce((s, i) => s + i.quantity, 0)} itens
                                    </span>
                                )}
                            </span>
                        </div>
                        {cart.length > 0 && (
                            <button
                                onClick={() => setCart([])}
                                className="text-xs text-white/30 hover:text-red-400 transition-colors"
                            >
                                Limpar
                            </button>
                        )}
                    </div>

                    {/* Items */}
                    <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-white/20 gap-3 py-10">
                                <ShoppingCart className="w-14 h-14" />
                                <p className="text-sm text-center leading-relaxed">
                                    Clique num produto<br />para adicionar à venda
                                </p>
                            </div>
                        ) : cart.map(item => {
                            const price = parseFloat(String(item.sale_price)) || 0;
                            const lineTotal = price * item.quantity * (1 + item.tax_rate / 100);
                            return (
                                <div key={item.cart_id} className="group bg-white/6 border border-white/6 hover:border-white/12 rounded-xl p-3 transition-colors">
                                    <div className="flex items-start gap-2.5">
                                        <div className="w-9 h-9 rounded-lg bg-white/10 overflow-hidden shrink-0">
                                            {item.image_url ? (
                                                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-white/30 text-xs font-bold">
                                                    {item.name[0]}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-white leading-tight truncate">{item.name}</p>
                                            <p className="text-xs text-white/40">{fmt(price)} MT / un</p>
                                        </div>
                                        <button
                                            onClick={() => remove(item.cart_id)}
                                            className="opacity-0 group-hover:opacity-100 text-white/25 hover:text-red-400 transition-all mt-0.5 shrink-0"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between mt-2.5">
                                        <div className="flex items-center rounded-lg border border-white/10 overflow-hidden">
                                            <button
                                                onClick={() => item.quantity === 1 ? remove(item.cart_id) : updateQty(item.cart_id, -1)}
                                                className="px-2.5 py-1 text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                                            >
                                                <Minus className="w-3 h-3" />
                                            </button>
                                            <span className="px-3 text-sm font-bold text-white border-x border-white/10">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQty(item.cart_id, 1)}
                                                className="px-2.5 py-1 text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                                            >
                                                <Plus className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <span className="text-sm font-bold text-white">{fmt(lineTotal)} MT</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Totals */}
                    <div className="px-4 py-4 border-t border-white/8 space-y-3 shrink-0">
                        <div className="space-y-1.5 text-sm">
                            <div className="flex justify-between text-white/40">
                                <span>Subtotal</span><span>{fmt(totals.sub)} MT</span>
                            </div>
                            <div className="flex justify-between text-white/40">
                                <span>IVA</span><span>{fmt(totals.tax)} MT</span>
                            </div>
                            <div className="flex justify-between items-baseline pt-2 border-t border-white/8">
                                <span className="text-white/70 font-medium text-sm">Total a Pagar</span>
                                <span className="text-xl font-black text-white">{fmt(totals.total)} MT</span>
                            </div>
                        </div>

                        <Button
                            disabled={cart.length === 0}
                            onClick={() => setPayOpen(true)}
                            className="w-full h-12 text-base font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/40 disabled:opacity-30"
                        >
                            PAGAR
                        </Button>
                    </div>
                </div>
            </div>

            <PaymentModal
                isOpen={payOpen}
                onClose={() => setPayOpen(false)}
                total={totals.total}
                cart={cart}
                onSuccess={() => { setCart([]); setPayOpen(false); }}
            />
        </div>
    );
}
