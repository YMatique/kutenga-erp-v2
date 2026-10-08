import { Head } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import { Search, ShoppingCart, Trash2, Plus, Minus, LayoutGrid, LogOut, Package, Barcode } from 'lucide-react';
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { CameraScanButton } from '@/components/camera-scanner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Toaster } from '@/components/ui/sonner';
import { useAppearance } from '@/hooks/use-appearance';
import { useBarcodeScanner } from '@/hooks/use-barcode-scanner';
import { matchesCode } from '@/lib/product-lookup';
import { beepError, beepSuccess } from '@/lib/scan-feedback';
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
    barcode?: string;
}

interface Category { id: number; name: string; }
interface CartItem extends Product { cart_id: string; quantity: number; }

const genId = () => Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);

function LiveClock({ dark }: { dark: boolean }) {
    const [t, setT] = useState(new Date());
    useEffect(() => {
        const i = setInterval(() => setT(new Date()), 1000);

        return () => clearInterval(i);
    }, []);

    return (
        <div className="hidden lg:block text-center">
            <p className={`font-mono text-xl font-bold leading-none ${dark ? 'text-white' : 'text-slate-800'}`}>
                {t.toLocaleTimeString('pt-MZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
            <p className={`text-xs capitalize mt-0.5 ${dark ? 'text-white/40' : 'text-slate-400'}`}>
                {t.toLocaleDateString('pt-MZ', { weekday: 'short', day: '2-digit', month: 'short' })}
            </p>
        </div>
    );
}

export default function PosIndex({ shift, categories, products: initialProducts, has_more: initialHasMore, auth }: any) {
    const { resolvedAppearance } = useAppearance();
    const dark = resolvedAppearance === 'dark';

    const [search, setSearch] = useState('');
    const [activeCat, setActiveCat] = useState<number | null>(null);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [payOpen, setPayOpen] = useState(false);

    const searchRef = useRef<HTMLInputElement>(null);

    // ── Catálogo paginado no servidor (não carrega a empresa inteira no browser) ──
    const [catalog, setCatalog] = useState<Product[]>(initialProducts);
    const [hasMore, setHasMore] = useState<boolean>(initialHasMore);
    const [loadingCatalog, setLoadingCatalog] = useState(false);
    const catalogPage = useRef(1);
    const catalogRequest = useRef(0);
    const firstRun = useRef(true);

    const fetchProducts = useCallback(async (params: Record<string, string>): Promise<{ data: Product[]; has_more: boolean }> => {
        const response = await fetch(`/pos/products?${new URLSearchParams(params)}`, {
            headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            credentials: 'same-origin',
        });

        if (!response.ok) {
            throw new Error(`Falha ao carregar produtos (${response.status})`);
        }

        return response.json();
    }, []);

    const loadCatalog = useCallback(async (page: number) => {
        const request = ++catalogRequest.current;
        const params: Record<string, string> = { page: String(page) };

        if (search.trim()) {
            params.search = search.trim();
        }

        if (activeCat !== null) {
            params.category_id = String(activeCat);
        }

        setLoadingCatalog(true);

        try {
            const result = await fetchProducts(params);

            if (request !== catalogRequest.current) {
                return; // chegou uma resposta mais recente
            }

            catalogPage.current = page;
            setCatalog(prev => page === 1 ? result.data : [...prev, ...result.data]);
            setHasMore(result.has_more);
        } catch {
            toast.error('Não foi possível carregar os produtos.');
        } finally {
            if (request === catalogRequest.current) {
                setLoadingCatalog(false);
            }
        }
    }, [search, activeCat, fetchProducts]);

    useEffect(() => {
        if (firstRun.current) {
            firstRun.current = false;

            return;
        }

        const t = setTimeout(() => loadCatalog(1), 250);

        return () => clearTimeout(t);
    }, [loadCatalog]);

    const addToCart = useCallback((p: Product) => setCart(prev => {
        const ex = prev.find(i => i.id === p.id);

        if (ex) {
return prev.map(i => i.id === p.id ? { ...i, quantity: i.quantity + 1 } : i);
}

        return [...prev, { ...p, cart_id: genId(), quantity: 1 }];
    }), []);

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

    // ── Auto-focus no campo de pesquisa ao montar ──
    useEffect(() => {
        searchRef.current?.focus();
    }, []);

    // ── Leitor de código de barras ──
    // O hook detecta a rajada rápida de teclas + Enter e remove o texto do campo de pesquisa.
    const handleScan = async (code: string) => {
        // Primeiro o que já está em memória (grelha/carrinho); senão pergunta ao servidor
        let product: Product | undefined = [...catalog, ...cart].find((p: Product) => matchesCode(p, code));

        if (!product) {
            try {
                product = (await fetchProducts({ code })).data[0];
            } catch {
                toast.error('Falha ao consultar o código. Verifique a ligação.');

                return;
            }
        }

        if (!product) {
            beepError();
            toast.error(`Código ${code} não encontrado.`);

            return;
        }

        addToCart(product);
        setSearch('');
        beepSuccess();
        toast.success(`${product.name} adicionado`, { duration: 1200 });
    };

    useBarcodeScanner({ enabled: !payOpen, onScan: handleScan });

    // ── Atalhos e foco automático na pesquisa ──
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'F2') {
                e.preventDefault();

                if (cart.length > 0) {
                    setPayOpen(true);
                }

                return;
            }

            if (e.key === 'Escape') {
                e.preventDefault();

                if (payOpen) {
                    setPayOpen(false);
                } else if (cart.length > 0) {
                    setCart([]);
                }

                return;
            }

            // Escrita solta (ou 1.º carácter de uma leitura) vai para o campo de pesquisa
            const target = e.target as HTMLElement;
            const inField = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable;

            if (!payOpen && !inField && e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
                searchRef.current?.focus();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [cart.length, payOpen]);

    // ── Classes condicionais por tema ──
    const d = dark; // alias curto

    const catActive = 'bg-[#2DB8A0] text-white border-[#2DB8A0] shadow-sm';
    const catInactive = d
        ? 'bg-white/5 text-white/60 border-white/10 hover:border-[#2DB8A0]/50 hover:text-[#2DB8A0]'
        : 'bg-white text-slate-600 border-slate-200 hover:border-[#2DB8A0]/50 hover:text-[#2DB8A0]';

    return (
        <div
            className={`h-screen flex flex-col overflow-hidden ${d ? 'bg-[#0f1923]' : 'bg-slate-100'}`}
            style={{ fontFamily: "'Inter', sans-serif" }}
        >
            <Head title="POS • Caixa" />

            {/* ── Header ── */}
            <header className={`h-14 flex items-center justify-between px-5 shrink-0 border-b ${
                d ? 'bg-[#1A2332] border-white/8' : 'bg-white border-slate-200 shadow-xs'
            }`}>
                {/* Esquerda: Logo + info turno */}
                <div className="flex items-center gap-3">
                    <img
                        src="/kutenga-logo.png"
                        alt="Kutenga ERP"
                        className="h-7 w-auto object-contain"
                        onError={e => {
 (e.target as HTMLImageElement).style.display = 'none'; 
}}
                    />
                    <div className={`hidden sm:block w-px h-5 ${d ? 'bg-white/15' : 'bg-slate-200'}`} />
                    <div>
                        <p className={`text-[11px] uppercase tracking-wide leading-none ${d ? 'text-white/40' : 'text-slate-400'}`}>
                            Ponto de Venda
                        </p>
                        {shift && (
                            <p className={`text-sm font-semibold leading-tight ${d ? 'text-white' : 'text-slate-800'}`}>
                                Turno #{shift.id}
                            </p>
                        )}
                    </div>
                    {shift && (
                        <div className={`hidden sm:flex items-center gap-1.5 border text-xs font-medium px-3 py-1 rounded-full ${
                            d ? 'bg-emerald-500/15 border-emerald-500/25 text-emerald-400'
                              : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        }`}>
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Aberto
                        </div>
                    )}
                </div>

                {/* Centro: relógio */}
                <LiveClock dark={d} />

                {/* Direita: utilizador + nav */}
                <div className="flex items-center gap-1">
                    {auth?.user?.name && (
                        <span className={`hidden md:block text-xs mr-2 ${d ? 'text-white/40' : 'text-slate-400'}`}>
                            {auth.user.name}
                        </span>
                    )}
                    <Link href="/pos/shifts">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`gap-1.5 rounded-[4px] ${
                                d ? 'text-white/60 hover:text-white hover:bg-white/10'
                                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                            }`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                            <span className="hidden sm:block">Gestão</span>
                        </Button>
                    </Link>
                    <Link href="/pos/shifts/close">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-400 hover:bg-red-500/10 gap-1.5 rounded-[4px]"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="hidden sm:block">Fechar Turno</span>
                        </Button>
                    </Link>
                </div>
            </header>

            {/* ── Body ── */}
            <div className="flex-1 flex overflow-hidden">

                {/* ════ LEFT: Catálogo ════ */}
                <div className={`flex-1 flex flex-col overflow-hidden ${d ? 'bg-[#0f1923]' : 'bg-slate-50'}`}>

                    {/* Pesquisa + Categorias */}
                    <div className={`px-5 py-3 space-y-3 shrink-0 border-b ${
                        d ? 'bg-[#1A2332] border-white/8' : 'bg-white border-slate-200'
                    }`}>
                        {/* Campo de pesquisa com ícone de barcode */}
                        <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${d ? 'text-white/30' : 'text-slate-400'}`} />
                            <Input
                                ref={searchRef}
                                placeholder="Pesquisar por nome, SKU ou código de barras..."
                                className={`pl-10 pr-10 h-10 rounded-[4px] text-sm ${
                                    d ? 'bg-[#0f1923] border-white/10 text-white placeholder:text-white/25 focus-visible:ring-[#2DB8A0]/30'
                                      : 'bg-slate-50 border-slate-200 focus-visible:ring-[#2DB8A0]/30'
                                }`}
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && catalog.length === 1) {
                                        e.preventDefault();
                                        addToCart(catalog[0]);
                                        setSearch('');
                                    }
                                }}
                            />
                            <Barcode className={`absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${d ? 'text-white/15' : 'text-slate-300'}`} />
                        </div>
                        <CameraScanButton
                            continuous
                            onScan={handleScan}
                            className={`h-10 w-10 rounded-[4px] ${d ? 'bg-transparent border-white/10 text-white/70 hover:bg-white/10 hover:text-white' : ''}`}
                        />
                        </div>

                        {/* Filtro de categorias */}
                        <div className="flex gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
                            <button
                                onClick={() => setActiveCat(null)}
                                className={`shrink-0 px-3.5 py-1.5 rounded-[4px] text-sm font-medium transition-all border ${
                                    activeCat === null ? catActive : catInactive
                                }`}
                            >
                                Todos
                            </button>
                            {categories.map((c: Category) => (
                                <button
                                    key={c.id}
                                    onClick={() => setActiveCat(c.id)}
                                    className={`shrink-0 px-3.5 py-1.5 rounded-[4px] text-sm font-medium transition-all border ${
                                        activeCat === c.id ? catActive : catInactive
                                    }`}
                                >
                                    {c.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Grelha de produtos */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {catalog.length === 0 ? (
                            <div className={`h-full flex flex-col items-center justify-center gap-3 ${d ? 'text-white/20' : 'text-slate-300'}`}>
                                <Package className="w-12 h-12" />
                                <p className="text-sm">{loadingCatalog ? 'A pesquisar...' : 'Nenhum produto encontrado'}</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
                                {catalog.map((p: Product) => {
                                    const price = parseFloat(String(p.sale_price)) || 0;
                                    const inCart = cart.find(i => i.id === p.id);

                                    return (
                                        <button
                                            key={p.id}
                                            onClick={() => addToCart(p)}
                                            className={`relative group rounded-[4px] overflow-hidden text-left transition-all duration-150 border ${
                                                d
                                                    ? inCart
                                                        ? 'border-[#2DB8A0] shadow-md ring-1 ring-[#2DB8A0]/30 bg-[#1A2332]'
                                                        : 'border-white/8 hover:border-[#2DB8A0]/50 hover:shadow-md bg-[#1A2332]'
                                                    : inCart
                                                        ? 'border-[#2DB8A0] shadow-md ring-1 ring-[#2DB8A0]/20 bg-white'
                                                        : 'border-slate-200 hover:border-[#2DB8A0]/50 hover:shadow-md bg-white'
                                            }`}
                                        >
                                            {/* Imagem */}
                                            <div className={`aspect-square overflow-hidden ${d ? 'bg-white/5' : 'bg-slate-100'}`}>
                                                {p.image_url ? (
                                                    <img
                                                        src={p.image_url}
                                                        alt={p.name}
                                                        className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                                                        onError={e => {
                                                            (e.target as HTMLImageElement).parentElement!.innerHTML =
                                                                `<div class="w-full h-full flex items-center justify-center"><span class="text-4xl font-black ${d ? 'text-white/10' : 'text-slate-200'}">${p.name[0]}</span></div>`;
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <span className={`text-4xl font-black ${d ? 'text-white/10' : 'text-slate-200'}`}>
                                                            {p.name[0]}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="p-2.5">
                                                <p className={`text-[11px] truncate ${d ? 'text-white/30' : 'text-slate-400'}`}>{p.category}</p>
                                                <p className={`text-sm font-semibold line-clamp-2 mt-0.5 leading-snug min-h-[2.4rem] ${d ? 'text-white' : 'text-slate-900'}`}>
                                                    {p.name}
                                                </p>
                                                <p className="text-sm font-bold text-[#2DB8A0] mt-1.5">{fmt(price)} MT</p>
                                            </div>

                                            {/* Quantidade no carrinho */}
                                            {inCart && (
                                                <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-[#2DB8A0] text-white rounded-full flex items-center justify-center text-[11px] font-bold shadow">
                                                    {inCart.quantity}
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {hasMore && catalog.length > 0 && (
                            <div className="flex justify-center pt-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={loadingCatalog}
                                    onClick={() => loadCatalog(catalogPage.current + 1)}
                                >
                                    {loadingCatalog ? 'A carregar...' : 'Carregar mais produtos'}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* ════ RIGHT: Carrinho ════ */}
                <div className={`w-[360px] xl:w-[400px] shrink-0 flex flex-col border-l ${
                    d ? 'bg-[#1e2d3d] border-white/8' : 'bg-white border-slate-200'
                }`}>
                    {/* Header do carrinho */}
                    <div className={`px-4 py-3 border-b flex items-center justify-between shrink-0 ${
                        d ? 'border-white/8' : 'border-slate-200'
                    }`}>
                        <div className="flex items-center gap-2">
                            <ShoppingCart className={`w-4 h-4 ${d ? 'text-white/50' : 'text-slate-400'}`} />
                            <span className={`text-sm font-semibold ${d ? 'text-white' : 'text-slate-800'}`}>
                                Venda em Curso
                                {cart.length > 0 && (
                                    <span className={`ml-2 text-xs rounded-full px-2 py-0.5 ${
                                        d ? 'bg-white/15 text-white/70' : 'bg-slate-100 text-slate-500'
                                    }`}>
                                        {cart.reduce((s, i) => s + i.quantity, 0)} itens
                                    </span>
                                )}
                            </span>
                        </div>
                        {cart.length > 0 && (
                            <button
                                onClick={() => setCart([])}
                                className={`text-xs transition-colors ${
                                    d ? 'text-white/30 hover:text-red-400' : 'text-slate-400 hover:text-red-500'
                                }`}
                            >
                                Limpar
                            </button>
                        )}
                    </div>

                    {/* Itens do carrinho */}
                    <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
                        {cart.length === 0 ? (
                            <div className={`h-full flex flex-col items-center justify-center gap-3 py-10 ${
                                d ? 'text-white/20' : 'text-slate-300'
                            }`}>
                                <ShoppingCart className="w-14 h-14" />
                                <p className="text-sm text-center leading-relaxed">
                                    Clique num produto<br />para adicionar à venda
                                </p>
                            </div>
                        ) : cart.map(item => {
                            const price = parseFloat(String(item.sale_price)) || 0;
                            const lineTotal = price * item.quantity * (1 + item.tax_rate / 100);

                            return (
                                <div
                                    key={item.cart_id}
                                    className={`group rounded-[4px] p-3 transition-colors border ${
                                        d ? 'bg-white/6 border-white/6 hover:border-white/12'
                                          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                                    }`}
                                >
                                    <div className="flex items-start gap-2.5">
                                        <div className={`w-9 h-9 rounded-[4px] overflow-hidden shrink-0 ${
                                            d ? 'bg-white/10' : 'bg-slate-200'
                                        }`}>
                                            {item.image_url ? (
                                                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className={`w-full h-full flex items-center justify-center text-xs font-bold ${
                                                    d ? 'text-white/30' : 'text-slate-400'
                                                }`}>
                                                    {item.name[0]}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-medium leading-tight truncate ${d ? 'text-white' : 'text-slate-800'}`}>
                                                {item.name}
                                            </p>
                                            <p className={`text-xs ${d ? 'text-white/40' : 'text-slate-400'}`}>
                                                {fmt(price)} MT / un
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => remove(item.cart_id)}
                                            className={`opacity-0 group-hover:opacity-100 transition-all mt-0.5 shrink-0 ${
                                                d ? 'text-white/25 hover:text-red-400' : 'text-slate-300 hover:text-red-500'
                                            }`}
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between mt-2.5">
                                        <div className={`flex items-center rounded-[4px] border overflow-hidden ${
                                            d ? 'border-white/10' : 'border-slate-200'
                                        }`}>
                                            <button
                                                onClick={() => item.quantity === 1 ? remove(item.cart_id) : updateQty(item.cart_id, -1)}
                                                className={`px-2.5 py-1 transition-colors ${
                                                    d ? 'text-white/50 hover:text-white hover:bg-white/10'
                                                      : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                                                }`}
                                            >
                                                <Minus className="w-3 h-3" />
                                            </button>
                                            <span className={`px-3 text-sm font-bold border-x ${
                                                d ? 'text-white border-white/10' : 'text-slate-800 border-slate-200'
                                            }`}>
                                                {item.quantity}
                                            </span>
                                            <button
                                                onClick={() => updateQty(item.cart_id, 1)}
                                                className={`px-2.5 py-1 transition-colors ${
                                                    d ? 'text-white/50 hover:text-white hover:bg-white/10'
                                                      : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                                                }`}
                                            >
                                                <Plus className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <span className={`text-sm font-bold ${d ? 'text-white' : 'text-slate-900'}`}>
                                            {fmt(lineTotal)} MT
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Totais + botão pagar */}
                    <div className={`px-4 py-4 space-y-3 shrink-0 border-t ${
                        d ? 'border-white/8' : 'border-slate-200'
                    }`}>
                        <div className="space-y-1.5 text-sm">
                            <div className={`flex justify-between ${d ? 'text-white/40' : 'text-slate-400'}`}>
                                <span>Subtotal</span><span>{fmt(totals.sub)} MT</span>
                            </div>
                            <div className={`flex justify-between ${d ? 'text-white/40' : 'text-slate-400'}`}>
                                <span>IVA</span><span>{fmt(totals.tax)} MT</span>
                            </div>
                            <div className={`flex justify-between items-baseline pt-2 border-t ${
                                d ? 'border-white/8' : 'border-slate-200'
                            }`}>
                                <span className={`font-medium text-sm ${d ? 'text-white/70' : 'text-slate-600'}`}>
                                    Total a Pagar
                                </span>
                                <span className={`text-xl font-black ${d ? 'text-white' : 'text-slate-900'}`}>
                                    {fmt(totals.total)} MT
                                </span>
                            </div>
                        </div>

                        <Button
                            disabled={cart.length === 0}
                            onClick={() => setPayOpen(true)}
                            className="w-full h-12 text-base font-bold bg-[#E8A020] hover:bg-[#d49218] text-white shadow-lg shadow-amber-900/20 disabled:opacity-30 rounded-[4px] transition-colors"
                        >
                            PAGAR
                        </Button>
                    </div>
                </div>
            </div>

            <Toaster richColors position="top-center" />

            <PaymentModal
                isOpen={payOpen}
                onClose={() => setPayOpen(false)}
                total={totals.total}
                cart={cart}
                onSuccess={() => {
 setCart([]); setPayOpen(false); 
}}
            />
        </div>
    );
}
