import { Head, Link } from '@inertiajs/react';
import {
    ShoppingCart,
    Package,
    FileText,
    BarChart3,
    ArrowRight,
    CheckCircle2,
    TrendingUp,
    Sparkles,
    Building2,
    Zap,
    Check,
    Plus,
    Trash2,
    ArrowRightLeft,
    DollarSign,
    Layers,
    Receipt,
    Percent
} from 'lucide-react';
import { useState } from 'react';
import { useAppearance } from '@/hooks/use-appearance';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// --- MOCK DATA FOR SIMULATORS ---
const initialPOSProducts = [
    { id: 1, name: 'Coca-Cola 330ml', price: 450, stock: 42, category: 'Bebidas' },
    { id: 2, name: 'Hambúrguer Clássico', price: 3200, stock: 15, category: 'Alimentação' },
    { id: 3, name: 'Café Expresso', price: 250, stock: 120, category: 'Cafetaria' },
    { id: 4, name: 'Água Mineral 1.5L', price: 300, stock: 60, category: 'Bebidas' },
];

const initialStockItems = [
    { id: 1, name: 'Arroz Agulha 1kg', warehouse: 'Armazém Central', qty: 250, status: 'in_stock' as const },
    { id: 2, name: 'Óleo Alimentar 1L', warehouse: 'Armazém Sul', qty: 8, status: 'low' as const },
    { id: 3, name: 'Açúcar Branco 1kg', warehouse: 'Armazém Central', qty: 0, status: 'out_of_stock' as const },
];

const initialInvoices = [
    { id: 'FT 2026/0012', customer: 'Manuel Silva Lda', total: 45000, status: 'Paga', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    { id: 'FT 2026/0013', customer: 'Kudissanga Lda', total: 120500, status: 'Pendente', color: 'bg-amber-100 text-amber-800 border-amber-200' },
    { id: 'FT 2026/0014', customer: 'Clínica do Sol', total: 35000, status: 'Cancelada', color: 'bg-rose-100 text-rose-800 border-rose-200' },
];

export default function Landing() {
    // Tab switching for interactive demo
    const [activeTab, setActiveTab] = useState<'pos' | 'stock' | 'billing'>('pos');

    // POS simulator state
    const [posProducts, setPosProducts] = useState(initialPOSProducts);
    const [cart, setCart] = useState<{ product: typeof initialPOSProducts[0]; qty: number }[]>([]);
    const [receipt, setReceipt] = useState<{ id: string; items: any[]; total: number; timestamp: string } | null>(null);

    // Stock simulator state
    const [stockItems, setStockItems] = useState(initialStockItems);
    const [selectedStockId, setSelectedStockId] = useState<number>(1);
    const [adjustQty, setAdjustQty] = useState<string>('50');
    const [stockMessage, setStockMessage] = useState<string | null>(null);

    // Billing simulator state
    const [invoices, setInvoices] = useState(initialInvoices);
    const [filterStatus, setFilterStatus] = useState<string>('Todos');
    const [newInvCustomer, setNewInvCustomer] = useState('');
    const [newInvTotal, setNewInvTotal] = useState('');
    const [billingMessage, setBillingMessage] = useState<string | null>(null);

    // POS logic
    const addToCart = (product: typeof initialPOSProducts[0]) => {
        if (product.stock <= 0) {
return;
}

        setCart(prev => {
            const existing = prev.find(item => item.product.id === product.id);

            if (existing) {
                if (existing.qty >= product.stock) {
return prev;
}

                return prev.map(item => item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item);
            }

            return [...prev, { product, qty: 1 }];
        });
        setReceipt(null);
    };

    const removeFromCart = (productId: number) => {
        setCart(prev => prev.filter(item => item.product.id !== productId));
    };

    const handleCheckout = () => {
        if (cart.length === 0) {
return;
}

        // Deduct stock
        setPosProducts(prev => prev.map(p => {
            const cartItem = cart.find(c => c.product.id === p.id);

            if (cartItem) {
                return { ...p, stock: Math.max(0, p.stock - cartItem.qty) };
            }

            return p;
        }));

        const subtotal = cart.reduce((acc, item) => acc + (item.product.price * item.qty), 0);
        const tax = subtotal * 0.14; // 14% IVA
        const total = subtotal + tax;

        const invoiceNum = `FT KUT2026/${Math.floor(1000 + Math.random() * 9000)}`;
        setReceipt({
            id: invoiceNum,
            items: [...cart],
            total,
            timestamp: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        });

        // Add to main invoices list
        setInvoices(prev => [
            {
                id: invoiceNum,
                customer: 'Consumidor Final',
                total,
                status: 'Paga',
                color: 'bg-emerald-100 text-emerald-800 border-emerald-200'
            },
            ...prev
        ]);

        setCart([]);
    };

    // Stock logic
    const handleStockAdjust = () => {
        const qty = parseInt(adjustQty, 10);

        if (isNaN(qty)) {
return;
}

        setStockItems(prev => prev.map(item => {
            if (item.id === selectedStockId) {
                const newQty = Math.max(0, item.qty + qty);
                let status: 'in_stock' | 'low' | 'out_of_stock' = 'in_stock';

                if (newQty === 0) {
status = 'out_of_stock';
} else if (newQty < 15) {
status = 'low';
}

                return { ...item, qty: newQty, status };
            }

            return item;
        }));

        const targetItem = stockItems.find(i => i.id === selectedStockId);
        setStockMessage(`Stock do item "${targetItem?.name}" atualizado com sucesso!`);
        setTimeout(() => setStockMessage(null), 3000);
    };

    // Billing logic
    const handleAddInvoice = (e: React.FormEvent) => {
        e.preventDefault();

        if (!newInvCustomer || !newInvTotal) {
return;
}

        const totalVal = parseFloat(newInvTotal);

        if (isNaN(totalVal)) {
return;
}

        const newId = `FT 2026/${Math.floor(1015 + Math.random() * 9000)}`;
        const newDoc = {
            id: newId,
            customer: newInvCustomer,
            total: totalVal,
            status: 'Pendente',
            color: 'bg-amber-100 text-amber-800 border-amber-200'
        };

        setInvoices(prev => [newDoc, ...prev]);
        setNewInvCustomer('');
        setNewInvTotal('');
        setBillingMessage(`Fatura ${newId} gerada como Pendente!`);
        setTimeout(() => setBillingMessage(null), 3000);
    };

    const filteredInvoices = invoices.filter(inv => {
        if (filterStatus === 'Todos') {
return true;
}

        return inv.status === filterStatus;
    });

    return (
        <>
            <Head>
                <title>Kutenga ERP - Gestão Inteligente de Empresas</title>
                <meta name="description" content="O ERP modular definitivo para gerir vendas (POS), stock multi-armazém, faturação eletrónica e relatórios em tempo real." />
            </Head>

            <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] font-sans antialiased text-slate-800 dark:text-slate-200 transition-colors duration-300">
                {/* 1. GLASSMORPHIC NAVBAR */}
                <header className="sticky top-0 z-50 backdrop-blur-md bg-white/85 dark:bg-[#0B0F19]/85 border-b border-slate-200/60 dark:border-slate-800/60 shadow-xs transition-all">
                    <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                        <div className="flex items-center gap-2.5 font-bold text-xl text-[#1A2332] dark:text-white">
                            <div className="w-9 h-9 rounded-[4px] bg-[#2DB8A0] flex items-center justify-center text-white font-extrabold text-lg shadow-sm shadow-[#2DB8A0]/20">
                                K
                            </div>
                            <span className="tracking-tight">
                                Kutenga<span className="text-[#2DB8A0]">ERP</span>
                            </span>
                        </div>

                        <nav className="hidden md:flex gap-8 text-sm font-medium text-slate-600 dark:text-slate-300">
                            <a href="#features" className="hover:text-[#2DB8A0] transition-colors">Funcionalidades</a>
                            <a href="#demo" className="hover:text-[#2DB8A0] transition-colors">Demonstração</a>
                            <a href="#flow" className="hover:text-[#2DB8A0] transition-colors">Fluxo</a>
                            <a href="#pricing" className="hover:text-[#2DB8A0] transition-colors">Preços</a>
                        </nav>

                        <div className="flex items-center gap-3">
                            <Link href="/login">
                                <Button variant="outline" className="border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 font-medium bg-transparent">
                                    Entrar
                                </Button>
                            </Link>

                            <Link href="/register">
                                <Button className="bg-[#E8A020] hover:bg-[#d49218] text-white shadow-xs font-semibold rounded-[4px]">
                                    Criar Conta
                                </Button>
                            </Link>
                        </div>
                    </div>
                </header>

                {/* 2. HERO SECTION */}
                <section className="relative overflow-hidden pt-20 pb-28 px-6 bg-radial-[circle_at_top_right] from-[#2DB8A0]/10 via-transparent to-transparent">
                    <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 items-center">
                        {/* Left column info */}
                        <div className="lg:col-span-6 flex flex-col items-start text-left">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2DB8A0]/10 border border-[#2DB8A0]/20 text-[#2DB8A0] text-xs font-semibold mb-6 animate-pulse">
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>ERP Modular de Nova Geração</span>
                            </div>

                            <h1 className="text-4xl md:text-5xl lg:text-[54px] font-extrabold leading-[1.1] text-[#1A2332] dark:text-white tracking-tight">
                                O controlo da sua empresa,
                                <br />
                                <span className="text-[#2DB8A0] bg-clip-text">num único sistema.</span>
                            </h1>

                            <p className="mt-6 text-slate-600 dark:text-slate-300 text-base md:text-lg max-w-xl leading-relaxed">
                                Gerencie cotações, fature em segundos, controle o stock em múltiplos armazéns e simplifique a sua operação de vendas no POS. Feito para empresas modernas de qualquer dimensão.
                            </p>

                            <div className="mt-8 flex flex-wrap gap-4 w-full sm:w-auto">
                                <Link href="/register" className="w-full sm:w-auto">
                                    <Button size="lg" className="w-full sm:w-auto bg-[#2DB8A0] hover:bg-[#259b86] text-white text-base px-8 py-6 rounded-[4px] shadow-md shadow-[#2DB8A0]/20">
                                        Começar Grátis <ArrowRight className="ml-2 w-5 h-5" />
                                    </Button>
                                </Link>

                                <a href="#demo" className="w-full sm:w-auto">
                                    <Button variant="outline" size="lg" className="w-full sm:w-auto border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-900 bg-transparent text-base px-8 py-6 rounded-[4px]">
                                        Testar Demo Interativa
                                    </Button>
                                </a>
                            </div>

                            <div className="mt-10 flex gap-8 items-center border-t border-slate-200 dark:border-slate-800 pt-8 w-full">
                                <div>
                                    <h4 className="text-2xl font-bold text-[#1A2332] dark:text-white">100%</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Faturação Eletrónica</p>
                                </div>
                                <div className="border-l border-slate-200 dark:border-slate-800 h-8"></div>
                                <div>
                                    <h4 className="text-2xl font-bold text-[#1A2332] dark:text-white">Multi</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Armazém & Localização</p>
                                </div>
                                <div className="border-l border-slate-200 dark:border-slate-800 h-8"></div>
                                <div>
                                    <h4 className="text-2xl font-bold text-[#1A2332] dark:text-white">24/7</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Suporte e Atualizações</p>
                                </div>
                            </div>
                        </div>

                        {/* Right column dashboard mock */}
                        <div className="lg:col-span-6 relative">
                            {/* Decorative background glow */}
                            <div className="absolute -inset-4 bg-radial-[circle_at_center] from-[#2DB8A0]/10 via-[#E8A020]/5 to-transparent blur-3xl opacity-75 -z-10" />

                            <Card className="border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-[#111827]/95 rounded-lg shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden backdrop-blur-xs">
                                {/* System Top Bar */}
                                <div className="bg-[#1A2332] dark:bg-[#0B0F19] px-4 py-3 flex items-center justify-between border-b border-[#2DB8A0]/10 dark:border-slate-850">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                        <span className="text-slate-400 text-xs font-mono ml-2">kutenga-erp.co</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge className="bg-[#2DB8A0] text-white text-[10px] font-semibold px-2 py-0.5 rounded-[3px]">
                                            Live Dashboard
                                        </Badge>
                                    </div>
                                </div>

                                {/* Mock Interface Content */}
                                <div className="p-6 bg-slate-50/50 dark:bg-[#0B0F19]/50 space-y-6">
                                    {/* Stats grid */}
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="bg-white dark:bg-[#151B26] border border-slate-200 dark:border-slate-800 p-3.5 rounded-[4px] shadow-xs">
                                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Faturamento</p>
                                            <p className="text-lg font-extrabold text-[#1A2332] dark:text-slate-100 mt-1">1.84M MZN</p>
                                            <span className="text-[9px] text-emerald-600 font-semibold flex items-center mt-1">
                                                ▲ +12% esta semana
                                            </span>
                                        </div>
                                        <div className="bg-white dark:bg-[#151B26] border border-slate-200 dark:border-slate-800 p-3.5 rounded-[4px] shadow-xs">
                                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Artigos em Stock</p>
                                            <p className="text-lg font-extrabold text-[#2DB8A0] mt-1">378</p>
                                            <span className="text-[9px] text-slate-500 font-medium flex items-center mt-1">
                                                4 armazéns ativos
                                            </span>
                                        </div>
                                        <div className="bg-white dark:bg-[#151B26] border border-slate-200 dark:border-slate-800 p-3.5 rounded-[4px] shadow-xs">
                                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Margem Média</p>
                                            <p className="text-lg font-extrabold text-[#E8A020] mt-1">32.8%</p>
                                            <span className="text-[9px] text-emerald-600 font-semibold flex items-center mt-1">
                                                Meta atingida
                                            </span>
                                        </div>
                                    </div>

                                    {/* Chart / List split */}
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="bg-white dark:bg-[#151B26] border border-slate-200 dark:border-slate-800 p-4 rounded-[4px] shadow-xs space-y-3">
                                            <div className="flex justify-between items-center">
                                                <h5 className="text-[11px] font-bold text-[#1A2332] dark:text-slate-300 uppercase tracking-wide">Vendas por Categoria</h5>
                                                <TrendingUp className="w-3.5 h-3.5 text-[#2DB8A0]" />
                                            </div>
                                            {/* Simulated Mini Chart */}
                                            <div className="space-y-2 pt-1">
                                                <div>
                                                    <div className="flex justify-between text-[10px] mb-1 font-semibold">
                                                        <span>Alimentação</span>
                                                        <span>48%</span>
                                                    </div>
                                                    <div className="w-full bg-slate-100 dark:bg-slate-850 h-2 rounded-full overflow-hidden">
                                                        <div className="bg-[#2DB8A0] h-full rounded-full" style={{ width: '48%' }} />
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="flex justify-between text-[10px] mb-1 font-semibold">
                                                        <span>Bebidas</span>
                                                        <span>32%</span>
                                                    </div>
                                                    <div className="w-full bg-slate-100 dark:bg-slate-850 h-2 rounded-full overflow-hidden">
                                                        <div className="bg-[#E8A020] h-full rounded-full" style={{ width: '32%' }} />
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="flex justify-between text-[10px] mb-1 font-semibold">
                                                        <span>Tecnologia</span>
                                                        <span>20%</span>
                                                    </div>
                                                    <div className="w-full bg-slate-100 dark:bg-slate-850 h-2 rounded-full overflow-hidden">
                                                        <div className="bg-[#1A2332] h-full rounded-full" style={{ width: '20%' }} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white dark:bg-[#151B26] border border-slate-200 dark:border-slate-800 p-4 rounded-[4px] shadow-xs space-y-3">
                                            <h5 className="text-[11px] font-bold text-[#1A2332] dark:text-slate-300 uppercase tracking-wide">Últimas Transações</h5>
                                            <div className="space-y-2.5">
                                                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                                    <div>
                                                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Fatura Simplificada</p>
                                                        <p className="text-[9px] text-slate-400">Há 2 mins • FS 2026/0129</p>
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">+12,450 MZN</span>
                                                </div>
                                                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                                    <div>
                                                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Venda Direta POS</p>
                                                        <p className="text-[9px] text-slate-400">Há 15 mins • PDV #8410</p>
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">+3,200 MZN</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Ajuste de Stock</p>
                                                        <p className="text-[9px] text-slate-400">Há 1 hora • Armazém Central</p>
                                                    </div>
                                                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold px-2 py-0.5 bg-amber-50 dark:bg-amber-950/20 rounded">
                                                        -40 Itens
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* Accent graphics */}
                            <div className="absolute -bottom-6 -left-6 bg-[#E8A020] text-white p-4 rounded-lg shadow-lg flex items-center gap-3 hidden sm:flex">
                                <div className="p-2.5 bg-white/20 rounded-[4px]">
                                    <ShoppingCart className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <p className="text-xs text-white/80 font-medium">Venda Rápida</p>
                                    <p className="text-lg font-bold">POS Ativo</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 3. INTERACTIVE SIMULATOR SHOWCASE */}
                <section id="demo" className="py-24 bg-white dark:bg-[#0B0F19] border-y border-slate-200 dark:border-slate-800">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center max-w-3xl mx-auto mb-16">
                            <Badge className="bg-[#2DB8A0]/10 text-[#2DB8A0] border border-[#2DB8A0]/20 hover:bg-[#2DB8A0]/10 px-3 py-1 text-xs font-semibold rounded-full mb-3">
                                Teste você mesmo
                            </Badge>
                            <h2 className="text-3xl md:text-4xl font-extrabold text-[#1A2332] dark:text-white tracking-tight">
                                Experimente a Demonstração Interativa
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 mt-4 text-base">
                                Veja como o Kutenga ERP gere as operações diárias da sua empresa em tempo real. Escolha um módulo e interaja diretamente com o simulador.
                            </p>
                        </div>

                        {/* Interactive tabs controller */}
                        <div className="flex justify-center flex-wrap gap-2 mb-10">
                            <button
                                onClick={() => setActiveTab('pos')}
                                className={`flex items-center gap-2.5 px-6 py-3.5 text-sm font-semibold rounded-[4px] transition-all border ${
                                    activeTab === 'pos'
                                        ? 'bg-[#1A2332] text-white border-[#1A2332] shadow-md'
                                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                }`}
                            >
                                <ShoppingCart className="w-4 h-4" />
                                <span>Caixa Registadora (POS)</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('stock')}
                                className={`flex items-center gap-2.5 px-6 py-3.5 text-sm font-semibold rounded-[4px] transition-all border ${
                                    activeTab === 'stock'
                                        ? 'bg-[#1A2332] text-white border-[#1A2332] shadow-md'
                                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                }`}
                            >
                                <Package className="w-4 h-4" />
                                <span>Inventário & Stock</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('billing')}
                                className={`flex items-center gap-2.5 px-6 py-3.5 text-sm font-semibold rounded-[4px] transition-all border ${
                                    activeTab === 'billing'
                                        ? 'bg-[#1A2332] text-white border-[#1A2332] shadow-md'
                                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                }`}
                            >
                                <FileText className="w-4 h-4" />
                                <span>Faturação Eletrónica</span>
                            </button>
                        </div>

                        {/* Simulator device frame */}
                        <Card className="border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden max-w-5xl mx-auto bg-slate-50 dark:bg-[#111827]">
                            {/* Device top frame */}
                            <div className="bg-slate-900 px-4 py-3 flex items-center justify-between border-b border-slate-800">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-slate-700" />
                                    <div className="w-3 h-3 rounded-full bg-slate-700" />
                                    <div className="w-3 h-3 rounded-full bg-slate-700" />
                                </div>
                                <div className="text-slate-400 text-xs font-mono font-medium">
                                    Simulador: {activeTab === 'pos' ? 'Ponto de Venda (POS)' : activeTab === 'stock' ? 'Gestor de Armazém' : 'Emissor de Faturas'}
                                </div>
                                <div className="w-12"></div>
                            </div>

                            {/* Tab Content 1: POS SIMULATOR */}
                            {activeTab === 'pos' && (
                                <div className="grid lg:grid-cols-12 min-h-[460px]">
                                    {/* Products Grid */}
                                    <div className="lg:col-span-8 p-6 bg-white dark:bg-[#151B26] border-r border-slate-200 dark:border-slate-800">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Catálogo de Vendas</h3>
                                            <Badge className="bg-[#2DB8A0]/10 text-[#2DB8A0] hover:bg-[#2DB8A0]/15">
                                                Terminal #01
                                            </Badge>
                                        </div>

                                        <div className="grid sm:grid-cols-2 gap-4">
                                            {posProducts.map(p => (
                                                <div
                                                    key={p.id}
                                                    onClick={() => addToCart(p)}
                                                    className={`p-4 border rounded-[4px] text-left cursor-pointer transition-all hover:border-[#2DB8A0] hover:shadow-xs group ${
                                                        p.stock === 0 ? 'opacity-50 pointer-events-none bg-slate-50 border-slate-200' : 'bg-white border-slate-200'
                                                    }`}
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <span className="text-xs text-slate-400 font-medium">{p.category}</span>
                                                        <Badge className={`text-[10px] px-1.5 py-0 rounded-[3px] font-bold ${
                                                            p.stock === 0 ? 'bg-rose-100 text-rose-800' : p.stock < 20 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                                                        }`}>
                                                            Stock: {p.stock}
                                                        </Badge>
                                                    </div>
                                                    <h4 className="font-bold text-slate-800 dark:text-slate-200 mt-1.5 group-hover:text-[#2DB8A0] transition-colors">{p.name}</h4>
                                                    <p className="font-extrabold text-[#1A2332] dark:text-[#2DB8A0] text-lg mt-2">{p.price.toLocaleString('pt-PT')} MZN</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Cart Panel */}
                                    <div className="lg:col-span-4 p-6 bg-slate-50/50 dark:bg-[#0B0F19]/50 flex flex-col justify-between border-t lg:border-t-0 border-slate-200 dark:border-slate-800">
                                        <div>
                                            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base border-b border-slate-200 dark:border-slate-800 pb-3 flex justify-between items-center">
                                                <span>Carrinho de Vendas</span>
                                                <span className="text-xs text-[#2DB8A0] font-bold">({cart.length} itens)</span>
                                            </h3>

                                            {cart.length === 0 ? (
                                                <div className="py-12 text-center text-slate-400">
                                                    <ShoppingCart className="w-10 h-10 mx-auto stroke-1 mb-2 text-slate-300" />
                                                    <p className="text-xs font-semibold">Carrinho vazio</p>
                                                    <p className="text-[11px] mt-1 text-slate-400">Clique nos produtos para registar a venda</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-3 pt-3 max-h-[220px] overflow-y-auto">
                                                    {cart.map(item => (
                                                        <div key={item.product.id} className="flex justify-between items-center text-sm border-b border-slate-200/60 pb-2">
                                                            <div className="min-w-0 flex-1">
                                                                <p className="font-bold text-slate-800 dark:text-slate-200 truncate text-xs">{item.product.name}</p>
                                                                <p className="text-[11px] text-slate-500 font-medium">
                                                                    {item.qty}x • {item.product.price.toLocaleString('pt-PT')} MZN
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-extrabold text-[#1A2332] dark:text-white text-xs">
                                                                    {(item.product.price * item.qty).toLocaleString('pt-PT')} MZN
                                                                </span>
                                                                <button
                                                                    onClick={() => removeFromCart(item.product.id)}
                                                                    className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Cart Summary & Checkout */}
                                        <div className="mt-6 border-t border-slate-200 dark:border-slate-800 pt-4 space-y-4">
                                            {cart.length > 0 && (
                                                <div className="space-y-1.5 text-xs">
                                                    <div className="flex justify-between text-slate-500">
                                                        <span>Subtotal</span>
                                                        <span>{cart.reduce((a, b) => a + (b.product.price * b.qty), 0).toLocaleString('pt-PT')} MZN</span>
                                                    </div>
                                                    <div className="flex justify-between text-slate-500">
                                                        <span>IVA (14%)</span>
                                                        <span>{(cart.reduce((a, b) => a + (b.product.price * b.qty), 0) * 0.14).toLocaleString('pt-PT')} MZN</span>
                                                    </div>
                                                    <div className="flex justify-between font-extrabold text-[#1A2332] dark:text-white text-sm pt-1 border-t border-slate-200/50 dark:border-slate-800/50">
                                                        <span>Total Geral</span>
                                                        <span>{Math.round(cart.reduce((a, b) => a + (b.product.price * b.qty), 0) * 1.14).toLocaleString('pt-PT')} MZN</span>
                                                    </div>
                                                </div>
                                            )}

                                            <Button
                                                onClick={handleCheckout}
                                                disabled={cart.length === 0}
                                                className="w-full bg-[#2DB8A0] hover:bg-[#259b86] text-white font-bold py-5 rounded-[4px] shadow-xs"
                                            >
                                                Finalizar & Emitir Fatura
                                            </Button>

                                            {/* Success receipt toast */}
                                            {receipt && (
                                                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 rounded-[4px] p-3 text-left space-y-1">
                                                    <p className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                                        Venda Concluída!
                                                    </p>
                                                    <p className="text-[10px] text-emerald-700 font-semibold">
                                                        Fatura eletrónica emitida: <strong className="font-mono">{receipt.id}</strong>
                                                    </p>
                                                    <p className="text-[9px] text-slate-400">
                                                        Emitida às {receipt.timestamp} • Imposto liquidado
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Tab Content 2: STOCK SIMULATOR */}
                            {activeTab === 'stock' && (
                                <div className="grid lg:grid-cols-12 min-h-[460px]">
                                    {/* Stock list table */}
                                    <div className="lg:col-span-7 p-6 bg-white dark:bg-[#151B26] border-r border-slate-200 dark:border-slate-800">
                                        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg mb-4">Stock Multi-Armazém</h3>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                                                        <th className="pb-3 font-semibold">Artigo</th>
                                                        <th className="pb-3 font-semibold">Localização</th>
                                                        <th className="pb-3 font-semibold text-right">Qtd</th>
                                                        <th className="pb-3 font-semibold text-center">Estado</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-sm">
                                                    {stockItems.map(item => (
                                                        <tr key={item.id} className="hover:bg-slate-50/50">
                                                            <td className="py-3.5 font-bold text-slate-800 dark:text-slate-200">{item.name}</td>
                                                            <td className="py-3.5 text-slate-500 text-xs">{item.warehouse}</td>
                                                            <td className="py-3.5 font-extrabold text-[#1A2332] dark:text-slate-300 text-right">{item.qty}</td>
                                                            <td className="py-3.5 text-center">
                                                                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-[4px] ${
                                                                    item.status === 'in_stock'
                                                                        ? 'bg-emerald-100 text-emerald-800'
                                                                        : item.status === 'low'
                                                                        ? 'bg-amber-100 text-amber-800 animate-pulse'
                                                                        : 'bg-rose-100 text-rose-800'
                                                                }`}>
                                                                    {item.status === 'in_stock' ? 'Em Stock' : item.status === 'low' ? 'Baixo' : 'Esgotado'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Stock Adjustment Controls */}
                                    <div className="lg:col-span-5 p-6 bg-slate-50/50 dark:bg-[#0B0F19]/50 flex flex-col justify-between border-t lg:border-t-0 border-slate-200 dark:border-slate-800">
                                        <div className="space-y-4">
                                            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base border-b border-slate-200 dark:border-slate-800 pb-3">
                                                Lançamento de Ajuste
                                            </h3>

                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Selecionar Artigo</label>
                                                <select
                                                    value={selectedStockId}
                                                    onChange={e => setSelectedStockId(Number(e.target.value))}
                                                    className="w-full bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-[4px] p-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[#2DB8A0]"
                                                >
                                                    {stockItems.map(item => (
                                                        <option key={item.id} value={item.id}>
                                                            {item.name} ({item.warehouse})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Quantidade a Ajustar</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="number"
                                                        value={adjustQty}
                                                        onChange={e => setAdjustQty(e.target.value)}
                                                        className="w-full bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-[4px] p-2.5 text-sm font-extrabold text-[#1A2332] dark:text-white focus:outline-none focus:border-[#2DB8A0]"
                                                        placeholder="Ex: 50 ou -20"
                                                    />
                                                    <Button
                                                        onClick={() => setAdjustQty(prev => String(parseInt(prev || '0') * -1))}
                                                        variant="outline"
                                                        className="border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs px-3 font-semibold bg-transparent"
                                                        title="Inverter Sinal"
                                                    >
                                                        +/-
                                                    </Button>
                                                </div>
                                                <p className="text-[10px] text-slate-400 mt-1">Use números positivos para entrada e negativos para saída.</p>
                                            </div>
                                        </div>

                                        <div className="mt-6 space-y-4">
                                            <Button
                                                onClick={handleStockAdjust}
                                                className="w-full bg-[#E8A020] hover:bg-[#d49218] text-white font-bold py-5 rounded-[4px]"
                                            >
                                                Confirmar Ajuste Físico
                                            </Button>

                                            {stockMessage && (
                                                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 rounded-[4px] p-3 text-left space-y-1">
                                                    <p className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                                        Inventário Atualizado!
                                                    </p>
                                                    <p className="text-[10px] text-emerald-700 font-semibold">
                                                        {stockMessage}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Tab Content 3: BILLING SIMULATOR */}
                            {activeTab === 'billing' && (
                                <div className="grid lg:grid-cols-12 min-h-[460px]">
                                    {/* Invoice lists */}
                                    <div className="lg:col-span-7 p-6 bg-white dark:bg-[#151B26] border-r border-slate-200 dark:border-slate-800">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Histórico de Faturas</h3>
                                            <div className="flex gap-1.5 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-[4px] text-[11px] font-bold">
                                                {['Todos', 'Paga', 'Pendente'].map(status => (
                                                    <button
                                                        key={status}
                                                        onClick={() => setFilterStatus(status)}
                                                        className={`px-2 py-1 rounded-[3px] transition-colors ${
                                                            filterStatus === status ? 'bg-white dark:bg-[#151B26] text-[#1A2332] dark:text-white shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                                        }`}
                                                    >
                                                        {status}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                                                        <th className="pb-3 font-semibold">Fatura</th>
                                                        <th className="pb-3 font-semibold">Cliente</th>
                                                        <th className="pb-3 font-semibold text-right">Valor</th>
                                                        <th className="pb-3 font-semibold text-center">Estado</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-sm">
                                                    {filteredInvoices.map(inv => (
                                                        <tr key={inv.id} className="hover:bg-slate-50/50">
                                                            <td className="py-3.5 font-mono text-xs font-semibold text-[#1A2332] dark:text-slate-300">{inv.id}</td>
                                                            <td className="py-3.5 text-slate-600 dark:text-slate-300 font-semibold">{inv.customer}</td>
                                                            <td className="py-3.5 font-extrabold text-[#1A2332] dark:text-slate-300 text-right">{inv.total.toLocaleString('pt-PT')} MZN</td>
                                                            <td className="py-3.5 text-center">
                                                                <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-[3px] border ${inv.color}`}>
                                                                    {inv.status}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {filteredInvoices.length === 0 && (
                                                        <tr>
                                                            <td colSpan={4} className="py-10 text-center text-slate-400 text-xs">
                                                                Nenhuma fatura encontrada.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Fast Billing controls */}
                                    <div className="lg:col-span-5 p-6 bg-slate-50/50 dark:bg-[#0B0F19]/50 flex flex-col justify-between border-t lg:border-t-0 border-slate-200 dark:border-slate-800">
                                        <form onSubmit={handleAddInvoice} className="space-y-4">
                                            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base border-b border-slate-200 dark:border-slate-800 pb-3">
                                                Criar Nova Fatura
                                            </h3>

                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome do Cliente</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={newInvCustomer}
                                                    onChange={e => setNewInvCustomer(e.target.value)}
                                                    className="w-full bg-white border border-slate-200 rounded-[4px] p-2.5 text-sm text-slate-700 focus:outline-none focus:border-[#2DB8A0]"
                                                    placeholder="Ex: Comercial Kuanza Lda"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Valor Total (MZN)</label>
                                                <input
                                                    type="number"
                                                    required
                                                    value={newInvTotal}
                                                    onChange={e => setNewInvTotal(e.target.value)}
                                                    className="w-full bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-[4px] p-2.5 text-sm font-extrabold text-[#1A2332] dark:text-white focus:outline-none focus:border-[#2DB8A0]"
                                                    placeholder="Ex: 75000"
                                                />
                                            </div>

                                            <Button
                                                type="submit"
                                                className="w-full bg-[#1A2332] hover:bg-slate-800 text-white font-bold py-5 rounded-[4px]"
                                            >
                                                Gerar Fatura Provisória
                                            </Button>
                                        </form>

                                        <div className="mt-4">
                                            {billingMessage && (
                                                <div className="bg-emerald-50 border border-emerald-200 rounded-[4px] p-3 text-left space-y-1 animate-fadeIn">
                                                    <p className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                                        Fatura Registada!
                                                    </p>
                                                    <p className="text-[10px] text-emerald-700 font-semibold">
                                                        {billingMessage}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>
                </section>

                {/* 4. STATISTICS BANNER (SOCIAL PROOF) */}
                <section className="bg-[#1A2332] text-white py-16">
                    <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        <div className="space-y-1">
                            <div className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#2DB8A0]">+500,000</div>
                            <p className="text-xs md:text-sm text-slate-400 font-semibold uppercase tracking-wider">Faturas Emitidas</p>
                        </div>
                        <div className="space-y-1">
                            <div className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#E8A020]">99.99%</div>
                            <p className="text-xs md:text-sm text-slate-400 font-semibold uppercase tracking-wider">Uptime do Servidor</p>
                        </div>
                        <div className="space-y-1">
                            <div className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#2DB8A0]">100%</div>
                            <p className="text-xs md:text-sm text-slate-400 font-semibold uppercase tracking-wider">Certificado AGT</p>
                        </div>
                        <div className="space-y-1">
                            <div className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#E8A020]">&lt; 3ms</div>
                            <p className="text-xs md:text-sm text-slate-400 font-semibold uppercase tracking-wider">Tempo de Sincronia</p>
                        </div>
                    </div>
                </section>

                {/* 5. FEATURES / MODULES SECTION */}
                <section id="features" className="py-24 bg-slate-50 dark:bg-[#0B0F19]">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center max-w-3xl mx-auto mb-16">
                            <Badge className="bg-[#E8A020]/10 text-[#E8A020] border border-[#E8A020]/20 hover:bg-[#E8A020]/10 px-3 py-1 text-xs font-semibold rounded-full mb-3">
                                Funcionalidades
                            </Badge>
                            <h2 className="text-3xl md:text-4xl font-extrabold text-[#1A2332] dark:text-white tracking-tight">
                                Módulos Completos para o seu Negócio
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 mt-4 text-base">
                                O Kutenga ERP integra todas as áreas vitais da sua empresa numa única interface moderna e fácil de usar.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {/* Feature 1 */}
                            <Card className="p-8 bg-white dark:bg-[#151B26] border border-slate-200 dark:border-slate-800 hover:border-[#2DB8A0]/40 dark:hover:border-[#2DB8A0]/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                                <div className="w-12 h-12 rounded-[4px] bg-[#2DB8A0]/10 flex items-center justify-center text-[#2DB8A0] mb-6 group-hover:bg-[#2DB8A0] group-hover:text-white transition-colors duration-300">
                                    <ShoppingCart className="w-6 h-6" />
                                </div>
                                <h3 className="font-bold text-[#1A2332] dark:text-slate-100 text-xl mb-3">Ponto de Venda (POS)</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                                    Interface otimizada para computadores ou tablets. Registe vendas rapidamente, escolha métodos de pagamento e emita talões instantâneos.
                                </p>
                            </Card>

                            {/* Feature 2 */}
                            <Card className="p-8 bg-white dark:bg-[#151B26] border border-slate-200 dark:border-slate-800 hover:border-[#2DB8A0]/40 dark:hover:border-[#2DB8A0]/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                                <div className="w-12 h-12 rounded-[4px] bg-[#2DB8A0]/10 flex items-center justify-center text-[#2DB8A0] mb-6 group-hover:bg-[#2DB8A0] group-hover:text-white transition-colors duration-300">
                                    <Package className="w-6 h-6" />
                                </div>
                                <h3 className="font-bold text-[#1A2332] dark:text-slate-100 text-xl mb-3">Gestão de Inventário</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                                    Rastreie stock por lote, controle validades e faça a movimentação ou transferência automatizada de produtos entre os seus armazéns.
                                </p>
                            </Card>

                            {/* Feature 3 */}
                            <Card className="p-8 bg-white dark:bg-[#151B26] border border-slate-200 dark:border-slate-800 hover:border-[#2DB8A0]/40 dark:hover:border-[#2DB8A0]/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                                <div className="w-12 h-12 rounded-[4px] bg-[#2DB8A0]/10 flex items-center justify-center text-[#2DB8A0] mb-6 group-hover:bg-[#2DB8A0] group-hover:text-white transition-colors duration-300">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <h3 className="font-bold text-[#1A2332] dark:text-slate-100 text-xl mb-3">Faturação Eletrónica</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                                    Emita faturas, cotações, notas de crédito e faturas-recibo em total conformidade legal e com envio automático aos clientes por e-mail.
                                </p>
                            </Card>

                            {/* Feature 4 */}
                            <Card className="p-8 bg-white dark:bg-[#151B26] border border-slate-200 dark:border-slate-800 hover:border-[#2DB8A0]/40 dark:hover:border-[#2DB8A0]/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                                <div className="w-12 h-12 rounded-[4px] bg-[#2DB8A0]/10 flex items-center justify-center text-[#2DB8A0] mb-6 group-hover:bg-[#2DB8A0] group-hover:text-white transition-colors duration-300">
                                    <BarChart3 className="w-6 h-6" />
                                </div>
                                <h3 className="font-bold text-[#1A2332] dark:text-slate-100 text-xl mb-3">Relatórios Dinâmicos</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                                    Analise margens de lucro, volume de vendas, performance de vendedores e gráficos de inventário com relatórios exportáveis em PDF ou Excel.
                                </p>
                            </Card>

                            {/* Feature 5 */}
                            <Card className="p-8 bg-white dark:bg-[#151B26] border border-slate-200 dark:border-slate-800 hover:border-[#2DB8A0]/40 dark:hover:border-[#2DB8A0]/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                                <div className="w-12 h-12 rounded-[4px] bg-[#2DB8A0]/10 flex items-center justify-center text-[#2DB8A0] mb-6 group-hover:bg-[#2DB8A0] group-hover:text-white transition-colors duration-300">
                                    <ArrowRightLeft className="w-6 h-6" />
                                </div>
                                <h3 className="font-bold text-[#1A2332] dark:text-slate-100 text-xl mb-3">Ajustes & Transferências</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                                    Corrija quebras de stock e realize transferências de forma segura através de fluxos de aprovação de gerentes antes da efetivação física.
                                </p>
                            </Card>

                            {/* Feature 6 */}
                            <Card className="p-8 bg-white dark:bg-[#151B26] border border-slate-200 dark:border-slate-800 hover:border-[#2DB8A0]/40 dark:hover:border-[#2DB8A0]/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                                <div className="w-12 h-12 rounded-[4px] bg-[#2DB8A0]/10 flex items-center justify-center text-[#2DB8A0] mb-6 group-hover:bg-[#2DB8A0] group-hover:text-white transition-colors duration-300">
                                    <Building2 className="w-6 h-6" />
                                </div>
                                <h3 className="font-bold text-[#1A2332] dark:text-slate-100 text-xl mb-3">Gestão de Filiais</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                                    Centralize as operações de múltiplos estabelecimentos comerciais ou lojas. Alterne de contexto em 1 clique para gerir filiais.
                                </p>
                            </Card>
                        </div>
                    </div>
                </section>

                {/* 6. OPERATIONAL FLOW (STEPPER) */}
                <section id="flow" className="py-24 bg-white dark:bg-[#0B0F19] border-t border-slate-200 dark:border-slate-850">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center max-w-3xl mx-auto mb-20">
                            <Badge className="bg-[#2DB8A0]/10 text-[#2DB8A0] hover:bg-[#2DB8A0]/10 px-3 py-1 text-xs font-semibold rounded-full mb-3">
                                Fluxo Integrado
                            </Badge>
                            <h2 className="text-3xl md:text-4xl font-extrabold text-[#1A2332] dark:text-white tracking-tight">
                                Operação perfeitamente coordenada
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 mt-4 text-base">
                                Compreenda como as ações no Ponto de Venda refletem de forma automatizada em todo o sistema.
                            </p>
                        </div>

                        {/* Stepper design */}
                        <div className="relative">
                            {/* Horizontal connector line for large screens */}
                            <div className="hidden lg:block absolute top-[54px] left-[15%] right-[15%] h-0.5 bg-slate-200 dark:bg-slate-800 -z-10" />

                            <div className="grid lg:grid-cols-4 gap-8">
                                {/* Step 1 */}
                                <div className="text-center space-y-4 group">
                                    <div className="w-16 h-16 rounded-full bg-[#1A2332] dark:bg-zinc-800 border-4 border-slate-100 dark:border-zinc-900 mx-auto flex items-center justify-center text-white text-lg font-bold shadow-md transition-all duration-300 group-hover:scale-110 group-hover:bg-[#2DB8A0] group-hover:shadow-[#2DB8A0]/20">
                                        <ShoppingCart className="w-6 h-6 text-white" />
                                    </div>
                                    <h4 className="font-extrabold text-[#1A2332] dark:text-white text-lg">1. Venda Registada</h4>
                                    <p className="text-slate-500 text-xs px-4 leading-relaxed">
                                        O caixa regista o produto no POS. O pagamento é processado eletronicamente.
                                    </p>
                                </div>

                                {/* Step 2 */}
                                <div className="text-center space-y-4 group">
                                    <div className="w-16 h-16 rounded-full bg-[#1A2332] dark:bg-zinc-800 border-4 border-slate-100 dark:border-zinc-900 mx-auto flex items-center justify-center text-white text-lg font-bold shadow-md transition-all duration-300 group-hover:scale-110 group-hover:bg-[#2DB8A0] group-hover:shadow-[#2DB8A0]/20">
                                        <Package className="w-6 h-6 text-white" />
                                    </div>
                                    <h4 className="font-extrabold text-[#1A2332] dark:text-white text-lg">2. Baixa de Stock</h4>
                                    <p className="text-slate-500 text-xs px-4 leading-relaxed">
                                        O inventário deduz automaticamente os itens do armazém de origem em tempo real.
                                    </p>
                                </div>

                                {/* Step 3 */}
                                <div className="text-center space-y-4 group">
                                    <div className="w-16 h-16 rounded-full bg-[#1A2332] dark:bg-zinc-800 border-4 border-slate-100 dark:border-zinc-900 mx-auto flex items-center justify-center text-white text-lg font-bold shadow-md transition-all duration-300 group-hover:scale-110 group-hover:bg-[#2DB8A0] group-hover:shadow-[#2DB8A0]/20">
                                        <FileText className="w-6 h-6 text-white" />
                                    </div>
                                    <h4 className="font-extrabold text-[#1A2332] dark:text-white text-lg">3. Emissão Eletrónica</h4>
                                    <p className="text-slate-500 text-xs px-4 leading-relaxed">
                                        A fatura eletrónica assinada é gerada legalmente e vinculada à transação do cliente.
                                    </p>
                                </div>

                                {/* Step 4 */}
                                <div className="text-center space-y-4 group">
                                    <div className="w-16 h-16 rounded-full bg-[#1A2332] dark:bg-zinc-800 border-4 border-slate-100 dark:border-zinc-900 mx-auto flex items-center justify-center text-white text-lg font-bold shadow-md transition-all duration-300 group-hover:scale-110 group-hover:bg-[#2DB8A0] group-hover:shadow-[#2DB8A0]/20">
                                        <BarChart3 className="w-6 h-6 text-white" />
                                    </div>
                                    <h4 className="font-extrabold text-[#1A2332] dark:text-white text-lg">4. Relatório Atualizado</h4>
                                    <p className="text-slate-500 text-xs px-4 leading-relaxed">
                                        O dashboard reflete a receita bruta, o lucro e as margens, tudo pronto para análise fiscal.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 7. PRICING PLANS */}
                <section id="pricing" className="py-24 bg-slate-50 dark:bg-[#0B0F19]">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center max-w-3xl mx-auto mb-16">
                            <Badge className="bg-[#2DB8A0]/10 text-[#2DB8A0] border border-[#2DB8A0]/20 hover:bg-[#2DB8A0]/10 px-3 py-1 text-xs font-semibold rounded-full mb-3">
                                Preços Justos
                            </Badge>
                            <h2 className="text-3xl md:text-4xl font-extrabold text-[#1A2332] dark:text-white tracking-tight">
                                Planos Flexíveis para qualquer escala
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 mt-4 text-base">
                                Comece de forma gratuita e faça o upgrade conforme o seu volume de vendas cresce. Sem fidelizações obrigatórias.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                            {/* Plan 1 */}
                            <Card className="p-8 bg-white dark:bg-[#151B26] border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-xs">
                                <div>
                                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Plano Inicial</h3>
                                    <p className="text-slate-400 text-xs mt-1">Para novos empreendedores</p>
                                    <div className="my-6">
                                        <span className="text-3xl font-extrabold text-[#1A2332] dark:text-white">Grátis</span>
                                        <span className="text-slate-400 text-xs font-medium"> / sempre</span>
                                    </div>
                                    <ul className="space-y-3.5 text-slate-600 dark:text-slate-300 text-xs border-t border-slate-100 dark:border-slate-800 pt-6">
                                        <li className="flex items-center gap-2.5">
                                            <Check className="w-4 h-4 text-[#2DB8A0] flex-shrink-0" />
                                            <span>Até 50 faturas eletrónicas / mês</span>
                                        </li>
                                        <li className="flex items-center gap-2.5">
                                            <Check className="w-4 h-4 text-[#2DB8A0] flex-shrink-0" />
                                            <span>Catálogo com limite de 100 artigos</span>
                                        </li>
                                        <li className="flex items-center gap-2.5">
                                            <Check className="w-4 h-4 text-[#2DB8A0] flex-shrink-0" />
                                            <span>Acesso a 1 Armazém / Loja</span>
                                        </li>
                                        <li className="flex items-center gap-2.5">
                                            <Check className="w-4 h-4 text-[#2DB8A0] flex-shrink-0" />
                                            <span>Suporte comunitário</span>
                                        </li>
                                    </ul>
                                </div>
                                <div className="mt-8">
                                    <Link href="/register" className="w-full">
                                        <Button variant="outline" className="w-full border-slate-200 dark:border-slate-800 text-[#1A2332] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold rounded-[4px] bg-transparent">
                                            Começar agora
                                        </Button>
                                    </Link>
                                </div>
                            </Card>

                            {/* Plan 2 - Recommended */}
                            <Card className="p-8 bg-white dark:bg-[#151B26] border-2 border-[#2DB8A0] relative flex flex-col justify-between shadow-md">
                                <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-[#2DB8A0] text-white text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-wider shadow-sm">
                                    Recomendado
                                </div>

                                <div>
                                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg flex items-center gap-2">
                                        <span>Plano Crescimento</span>
                                        <Badge className="bg-[#2DB8A0]/10 text-[#2DB8A0] border border-[#2DB8A0]/20 hover:bg-[#2DB8A0]/10 text-[9px] font-bold">Popular</Badge>
                                    </h3>
                                    <p className="text-slate-400 text-xs mt-1">Para pequenas e médias empresas</p>
                                    <div className="my-6">
                                        <span className="text-3xl font-extrabold text-[#1A2332] dark:text-white">3,500 MZN</span>
                                        <span className="text-slate-400 text-xs font-medium"> / mês</span>
                                    </div>
                                    <ul className="space-y-3.5 text-slate-600 dark:text-slate-300 text-xs border-t border-slate-100 dark:border-slate-800 pt-6">
                                        <li className="flex items-center gap-2.5 font-semibold">
                                            <Check className="w-4 h-4 text-[#2DB8A0] flex-shrink-0" />
                                            <span>Faturação eletrónica ILIMITADA</span>
                                        </li>
                                        <li className="flex items-center gap-2.5">
                                            <Check className="w-4 h-4 text-[#2DB8A0] flex-shrink-0" />
                                            <span>Artigos e categorias ilimitadas</span>
                                        </li>
                                        <li className="flex items-center gap-2.5">
                                            <Check className="w-4 h-4 text-[#2DB8A0] flex-shrink-0" />
                                            <span>Stock Multi-Armazém (até 5)</span>
                                        </li>
                                        <li className="flex items-center gap-2.5">
                                            <Check className="w-4 h-4 text-[#2DB8A0] flex-shrink-0" />
                                            <span>Ponto de Venda (POS) incluído</span>
                                        </li>
                                        <li className="flex items-center gap-2.5 font-semibold">
                                            <Check className="w-4 h-4 text-[#2DB8A0] flex-shrink-0" />
                                            <span>Suporte técnico priorizado 24/7</span>
                                        </li>
                                    </ul>
                                </div>
                                <div className="mt-8">
                                    <Link href="/register" className="w-full">
                                        <Button className="w-full bg-[#2DB8A0] hover:bg-[#259b86] text-white font-bold rounded-[4px] shadow-xs">
                                            Adquirir Plano
                                        </Button>
                                    </Link>
                                </div>
                            </Card>

                            {/* Plan 3 */}
                            <Card className="p-8 bg-white dark:bg-[#151B26] border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-xs">
                                <div>
                                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Plano Empresarial</h3>
                                    <p className="text-slate-400 text-xs mt-1">Para grandes corporações</p>
                                    <div className="my-6">
                                        <span className="text-3xl font-extrabold text-[#1A2332] dark:text-white">Sob Consulta</span>
                                    </div>
                                    <ul className="space-y-3.5 text-slate-600 dark:text-slate-300 text-xs border-t border-slate-100 dark:border-slate-800 pt-6">
                                        <li className="flex items-center gap-2.5">
                                            <Check className="w-4 h-4 text-[#2DB8A0] flex-shrink-0" />
                                            <span>Tudo do Plano Crescimento</span>
                                        </li>
                                        <li className="flex items-center gap-2.5">
                                            <Check className="w-4 h-4 text-[#2DB8A0] flex-shrink-0" />
                                            <span>Armazéns e filiais ILIMITADAS</span>
                                        </li>
                                        <li className="flex items-center gap-2.5 font-semibold">
                                            <Check className="w-4 h-4 text-[#2DB8A0] flex-shrink-0" />
                                            <span>Acesso à API do Kutenga ERP</span>
                                        </li>
                                        <li className="flex items-center gap-2.5">
                                            <Check className="w-4 h-4 text-[#2DB8A0] flex-shrink-0" />
                                            <span>Gestor de conta dedicado</span>
                                        </li>
                                        <li className="flex items-center gap-2.5">
                                            <Check className="w-4 h-4 text-[#2DB8A0] flex-shrink-0" />
                                            <span>Migração de dados grátis</span>
                                        </li>
                                    </ul>
                                </div>
                                <div className="mt-8">
                                    <a href="mailto:suporte@kutenga.co" className="w-full">
                                        <Button variant="outline" className="w-full border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold rounded-[4px] bg-transparent">
                                            Contactar Vendas
                                        </Button>
                                    </a>
                                </div>
                            </Card>
                        </div>
                    </div>
                </section>

                {/* 8. FINAL CTA */}
                <section className="bg-radial-[circle_at_bottom_left] from-[#2DB8A0] to-[#1A2332] dark:to-[#0B0F19] text-white py-24 text-center px-6 relative overflow-hidden">
                    {/* Background pattern layer */}
                    <div className="absolute inset-0 bg-black/10 opacity-30 -z-10" />

                    <div className="max-w-4xl mx-auto space-y-6">
                        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">
                            Pronto para elevar a gestão do seu negócio?
                        </h2>
                        <p className="text-slate-200 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
                            Crie a sua conta hoje mesmo. Não necessita de cartão de crédito. Comece a faturar e a controlar o seu inventário de forma eficiente e em conformidade fiscal.
                        </p>
                        <div className="pt-4">
                            <Link href="/register">
                                <Button size="lg" className="bg-[#E8A020] hover:bg-[#d49218] text-white font-bold text-base px-10 py-6 rounded-[4px] shadow-lg shadow-black/20">
                                    Começar a Usar Agora
                                </Button>
                            </Link>
                        </div>
                    </div>
                </section>

                {/* 9. PREMIUM FOOTER */}
                <footer className="bg-[#1A2332] dark:bg-[#0B0F19] border-t border-slate-800 dark:border-slate-850 text-slate-400 py-16 text-sm">
                    <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div className="space-y-4 col-span-2 md:col-span-1">
                            <div className="flex items-center gap-2 font-bold text-white text-lg">
                                <div className="w-7 h-7 rounded-[4px] bg-[#2DB8A0] flex items-center justify-center text-white font-extrabold text-sm">
                                    K
                                </div>
                                <span>Kutenga ERP</span>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
                                Sistema modular completo para gestão comercial, inventário avançado e faturação eletrónica certificado pela AGT.
                            </p>
                        </div>

                        <div>
                            <h4 className="text-white font-semibold mb-4 text-xs uppercase tracking-wider">Produto</h4>
                            <ul className="space-y-2.5 text-xs text-slate-400 font-medium">
                                <li><a href="#features" className="hover:text-white transition-colors">Funcionalidades</a></li>
                                <li><a href="#demo" className="hover:text-white transition-colors">POS Simulator</a></li>
                                <li><a href="#pricing" className="hover:text-white transition-colors">Tabela de Preços</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Segurança</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-white font-semibold mb-4 text-xs uppercase tracking-wider">Empresa</h4>
                            <ul className="space-y-2.5 text-xs text-slate-400 font-medium">
                                <li><a href="#" className="hover:text-white transition-colors">Sobre Nós</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Termos de Serviço</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Política de Privacidade</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Contacto</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-white font-semibold mb-4 text-xs uppercase tracking-wider">Conformidade</h4>
                            <div className="space-y-3.5">
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    Software certificado nº 342/AGT. Desenvolvido para cumprir as regras fiscais angolanas em vigor.
                                </p>
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-950/45 border border-emerald-900/60 rounded-[3px] text-emerald-400 text-[10px] font-bold">
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Homologado AGT</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="max-w-7xl mx-auto px-6 border-t border-slate-800/80 dark:border-slate-850 mt-12 pt-8 text-center text-xs text-slate-500 dark:text-slate-400 font-medium flex flex-col sm:flex-row justify-between items-center gap-4">
                        <p>© {new Date().getFullYear()} Kutenga ERP. Todos os direitos reservados.</p>
                        <p className="text-slate-600">Desenvolvido com carinho e conformidade.</p>
                    </div>
                </footer>
            </div>
        </>
    );
}
