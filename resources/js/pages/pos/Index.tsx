import { Head, usePage } from '@inertiajs/react';
import { useState, useMemo, useEffect } from 'react';
import { Search, ShoppingCart, Trash2, Plus, Minus, ShoppingBag, LayoutGrid, LogOut, Package } from 'lucide-react';
import PaymentModal from './Components/PaymentModal';
import { Link } from '@inertiajs/react';

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

interface Category {
    id: number;
    name: string;
}

interface CartItem extends Product {
    cart_id: string;
    quantity: number;
}

function LiveClock() {
    const [t, setT] = useState(new Date());
    useEffect(() => { const i = setInterval(() => setT(new Date()), 1000); return () => clearInterval(i); }, []);
    return (
        <div className="text-center hidden lg:block">
            <div className="font-mono text-2xl font-bold text-white tracking-widest">
                {t.toLocaleTimeString('pt-MZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div className="text-xs text-white/40 capitalize">
                {t.toLocaleDateString('pt-MZ', { weekday: 'short', day: '2-digit', month: 'short' })}
            </div>
        </div>
    );
}

export default function PosIndex({ shift, categories, products, auth }: any) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    const filteredProducts = useMemo(() => {
        return products.filter((p: Product) => {
            const q = searchQuery.toLowerCase();
            const matchSearch = !q
                || p.name.toLowerCase().includes(q)
                || (p.sku ?? '').toLowerCase().includes(q);
            const matchCat = selectedCategory === null || p.category_id === selectedCategory;
            return matchSearch && matchCat;
        });
    }, [products, searchQuery, selectedCategory]);

    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(i => i.id === product.id);
            if (existing) return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
            return [...prev, { ...product, cart_id: crypto.randomUUID(), quantity: 1 }];
        });
    };

    const updateQty = (cartId: string, delta: number) => {
        setCart(prev => prev.map(i => {
            if (i.cart_id !== cartId) return i;
            const q = i.quantity + delta;
            return q > 0 ? { ...i, quantity: q } : i;
        }));
    };

    const remove = (cartId: string) => setCart(prev => prev.filter(i => i.cart_id !== cartId));

    const totals = useMemo(() => {
        let subtotal = 0, tax = 0;
        cart.forEach(item => {
            const price = parseFloat(String(item.sale_price)) || 0;
            const line = price * item.quantity;
            subtotal += line;
            tax += line * (item.tax_rate / 100);
        });
        return { subtotal, tax, total: subtotal + tax };
    }, [cart]);

    const fmt = (n: number) => n.toLocaleString('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return (
        <div className="h-screen flex flex-col overflow-hidden" style={{ background: '#0f172a', fontFamily: "'Inter', sans-serif" }}>
            <Head title="POS • Caixa" />

            {/* ─── Top Bar ─── */}
            <header className="h-16 flex items-center justify-between px-5 shrink-0 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/60">
                        <ShoppingBag className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <p className="text-xs text-white/40 leading-none">Kutenga</p>
                        <p className="text-sm font-semibold text-white leading-tight">Ponto de Venda</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-1.5 ml-3 bg-green-500/15 border border-green-500/25 text-green-400 text-xs font-medium px-3 py-1 rounded-full">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        Turno #{shift?.id}
                    </div>
                </div>
                <LiveClock />
                <div className="flex items-center gap-1">
                    <div className="hidden sm:block text-sm text-white/50 mr-3">{auth?.user?.name}</div>
                    <Link href="/pos/shifts" className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/8 transition-all text-sm">
                        <LayoutGrid className="w-4 h-4" />
                        <span className="hidden sm:block">Gestão</span>
                    </Link>
                    <Link href="/pos/shifts/close" className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/15 transition-all text-sm font-medium">
                        <LogOut className="w-4 h-4" />
                        <span className="hidden sm:block">Fechar</span>
                    </Link>
                </div>
            </header>

            {/* ─── Main ─── */}
            <div className="flex-1 flex overflow-hidden">

                {/* ════ LEFT: Products ════ */}
                <div className="flex-1 flex flex-col overflow-hidden bg-[#f8fafc]">
                    {/* Search + Categories */}
                    <div className="bg-white border-b border-neutral-200 px-5 py-4 space-y-3 shrink-0">
                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                            <input
                                type="text"
                                placeholder="Pesquisar produto por nome ou código..."
                                className="w-full pl-10 pr-4 h-11 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-neutral-400"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-0.5 no-scrollbar">
                            <button
                                onClick={() => setSelectedCategory(null)}
                                className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                                    selectedCategory === null
                                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                                }`}
                            >Todos</button>
                            {categories.map((c: Category) => (
                                <button
                                    key={c.id}
                                    onClick={() => setSelectedCategory(c.id)}
                                    className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                                        selectedCategory === c.id
                                            ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                                            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                                    }`}
                                >{c.name}</button>
                            ))}
                        </div>
                    </div>

                    {/* Products Grid */}
                    <div className="flex-1 overflow-y-auto p-5">
                        {filteredProducts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-neutral-400 gap-3">
                                <Package className="w-14 h-14 opacity-20" />
                                <p className="text-sm">Nenhum produto encontrado</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
                                {filteredProducts.map((product: Product) => {
                                    const price = parseFloat(String(product.sale_price)) || 0;
                                    const inCart = cart.find(i => i.id === product.id);
                                    return (
                                        <button
                                            key={product.id}
                                            onClick={() => addToCart(product)}
                                            className={`relative group bg-white rounded-2xl overflow-hidden text-left transition-all duration-150 border ${
                                                inCart
                                                    ? 'border-blue-300 shadow-md shadow-blue-100 ring-2 ring-blue-500/20'
                                                    : 'border-neutral-200 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-50'
                                            }`}
                                        >
                                            {/* Image */}
                                            <div className="aspect-square bg-gradient-to-br from-neutral-50 to-neutral-100 overflow-hidden">
                                                {product.image_url ? (
                                                    <img
                                                        src={product.image_url}
                                                        alt={product.name}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).style.display = 'none';
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <span className="text-3xl font-black text-neutral-200">
                                                            {product.name.substring(0, 1)}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="p-3">
                                                <p className="text-xs text-neutral-400 mb-0.5 truncate">{product.category ?? '—'}</p>
                                                <p className="text-sm font-semibold text-neutral-900 leading-tight line-clamp-2 min-h-[2.5rem]">{product.name}</p>
                                                <p className="text-base font-bold text-blue-600 mt-2">{fmt(price)} MT</p>
                                            </div>

                                            {/* Badge if in cart */}
                                            {inCart && (
                                                <div className="absolute top-2 right-2 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg">
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

                {/* ════ RIGHT: Cart ════ */}
                <div className="w-[360px] xl:w-[400px] shrink-0 flex flex-col border-l border-white/8">
                    {/* Cart Header */}
                    <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2">
                            <ShoppingCart className="w-5 h-5 text-white/60" />
                            <span className="font-semibold text-white text-sm">Venda em Curso</span>
                        </div>
                        {cart.length > 0 && (
                            <button
                                onClick={() => setCart([])}
                                className="text-xs text-white/30 hover:text-red-400 transition-colors"
                            >
                                Limpar tudo
                            </button>
                        )}
                    </div>

                    {/* Cart Items */}
                    <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-white/20 gap-4">
                                <ShoppingCart className="w-16 h-16" />
                                <p className="text-sm text-center leading-relaxed">
                                    Clique num produto para<br />o adicionar à venda
                                </p>
                            </div>
                        ) : (
                            cart.map(item => {
                                const price = parseFloat(String(item.sale_price)) || 0;
                                const lineTotal = price * item.quantity * (1 + item.tax_rate / 100);
                                return (
                                    <div key={item.cart_id} className="bg-white/6 rounded-xl p-3 group border border-white/5 hover:border-white/10 transition-colors">
                                        <div className="flex items-start gap-3">
                                            {/* Thumb */}
                                            <div className="w-10 h-10 rounded-lg bg-white/10 overflow-hidden shrink-0">
                                                {item.image_url ? (
                                                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-white/30 text-sm font-bold">
                                                        {item.name[0]}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-white leading-tight truncate">{item.name}</p>
                                                <p className="text-xs text-white/40 mt-0.5">{fmt(price)} MT / un</p>
                                            </div>
                                            <button
                                                onClick={() => remove(item.cart_id)}
                                                className="text-white/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 shrink-0 mt-0.5"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between mt-3">
                                            <div className="flex items-center gap-1 bg-white/8 rounded-lg p-1">
                                                <button
                                                    onClick={() => item.quantity === 1 ? remove(item.cart_id) : updateQty(item.cart_id, -1)}
                                                    className="w-7 h-7 flex items-center justify-center rounded-md text-white/60 hover:bg-white/10 hover:text-white transition-all"
                                                >
                                                    <Minus className="w-3.5 h-3.5" />
                                                </button>
                                                <span className="w-8 text-center text-sm font-bold text-white">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQty(item.cart_id, 1)}
                                                    className="w-7 h-7 flex items-center justify-center rounded-md text-white/60 hover:bg-white/10 hover:text-white transition-all"
                                                >
                                                    <Plus className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                            <span className="text-sm font-bold text-white">{fmt(lineTotal)} MT</span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Totals + Pay */}
                    <div className="px-5 py-4 border-t border-white/8 space-y-4 shrink-0">
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between text-white/50">
                                <span>Subtotal</span>
                                <span>{fmt(totals.subtotal)} MT</span>
                            </div>
                            <div className="flex justify-between text-white/50">
                                <span>IVA</span>
                                <span>{fmt(totals.tax)} MT</span>
                            </div>
                            <div className="flex justify-between items-baseline pt-2 border-t border-white/8">
                                <span className="text-white/70 font-medium">Total</span>
                                <span className="text-2xl font-black text-white">{fmt(totals.total)} MT</span>
                            </div>
                        </div>

                        <button
                            disabled={cart.length === 0}
                            onClick={() => setIsPaymentModalOpen(true)}
                            className="w-full h-14 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold text-lg rounded-xl transition-all duration-150 shadow-lg shadow-blue-900/40 hover:shadow-blue-500/30 active:scale-[0.98]"
                        >
                            PAGAR
                        </button>
                    </div>
                </div>
            </div>

            <PaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                total={totals.total}
                cart={cart}
                onSuccess={() => {
                    setCart([]);
                    setIsPaymentModalOpen(false);
                }}
            />
        </div>
    );
}
