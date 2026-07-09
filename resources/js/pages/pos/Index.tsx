import { Head, router } from '@inertiajs/react';
import PosLayout from '@/Layouts/pos-layout';
import { useState, useMemo } from 'react';
import { Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, Banknote, Landmark } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import PaymentModal from './Components/PaymentModal';

interface Product {
    id: number;
    name: string;
    sale_price: number;
    image_url?: string;
    category_id: number;
    tax_rate: number;
    stock: number;
}

interface Category {
    id: number;
    name: string;
}

interface CartItem extends Product {
    cart_id: string;
    quantity: number;
}

export default function PosIndex({ shift, categories, products }: any) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    const filteredProducts = useMemo(() => {
        return products.filter((p: Product) => {
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === null || p.category_id === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [products, searchQuery, selectedCategory]);

    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item => 
                    item.id === product.id 
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { ...product, cart_id: Math.random().toString(36).substr(2, 9), quantity: 1 }];
        });
    };

    const updateQuantity = (cartId: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.cart_id === cartId) {
                const newQty = item.quantity + delta;
                return newQty > 0 ? { ...item, quantity: newQty } : item;
            }
            return item;
        }));
    };

    const removeFromCart = (cartId: string) => {
        setCart(prev => prev.filter(item => item.cart_id !== cartId));
    };

    const totals = useMemo(() => {
        let subtotal = 0;
        let tax = 0;
        cart.forEach(item => {
            const lineTotal = item.sale_price * item.quantity;
            subtotal += lineTotal;
            tax += lineTotal * (item.tax_rate / 100);
        });
        return { subtotal, tax, total: subtotal + tax };
    }, [cart]);

    const handleCheckout = () => {
        if (cart.length === 0) return;
        setIsPaymentModalOpen(true);
    };

    return (
        <PosLayout title="Ponto de Venda">
            <div className="flex-1 flex overflow-hidden">
                {/* Left Side: Products Catalog */}
                <div className="flex-1 flex flex-col bg-white">
                    {/* Header / Search / Filters */}
                    <div className="p-4 border-b border-neutral-200 space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
                            <Input
                                placeholder="Pesquisar produtos (Nome ou Código de Barras)..."
                                className="pl-10 h-12 text-lg bg-neutral-100 border-transparent focus-visible:ring-blue-500"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <ScrollArea className="w-full whitespace-nowrap">
                            <div className="flex w-max space-x-2 p-1">
                                <Button
                                    variant={selectedCategory === null ? 'default' : 'outline'}
                                    className="rounded-full"
                                    onClick={() => setSelectedCategory(null)}
                                >
                                    Todos
                                </Button>
                                {categories.map((cat: Category) => (
                                    <Button
                                        key={cat.id}
                                        variant={selectedCategory === cat.id ? 'default' : 'outline'}
                                        className="rounded-full"
                                        onClick={() => setSelectedCategory(cat.id)}
                                    >
                                        {cat.name}
                                    </Button>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Products Grid */}
                    <ScrollArea className="flex-1 p-4 bg-neutral-50">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {filteredProducts.map((product: Product) => (
                                <div
                                    key={product.id}
                                    className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden cursor-pointer hover:shadow-md hover:border-blue-400 transition-all flex flex-col group"
                                    onClick={() => addToCart(product)}
                                >
                                    <div className="h-32 bg-neutral-100 relative flex items-center justify-center p-4">
                                        {product.image_url ? (
                                            <img src={product.image_url} alt={product.name} className="max-h-full object-contain mix-blend-multiply" />
                                        ) : (
                                            <div className="text-neutral-300 font-bold text-4xl uppercase opacity-20">
                                                {product.name.substring(0, 2)}
                                            </div>
                                        )}
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Badge variant="secondary" className="bg-white shadow-sm font-bold text-blue-600">
                                                +{product.tax_rate}% IVA
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="p-3 flex-1 flex flex-col justify-between">
                                        <h3 className="font-medium text-neutral-900 line-clamp-2 text-sm" title={product.name}>
                                            {product.name}
                                        </h3>
                                        <div className="mt-2 text-lg font-bold text-blue-600">
                                            {parseFloat(product.sale_price.toString()).toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {filteredProducts.length === 0 && (
                                <div className="col-span-full py-20 text-center text-neutral-500">
                                    Nenhum produto encontrado.
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>

                {/* Right Side: Cart */}
                <div className="w-[400px] border-l border-neutral-200 bg-white flex flex-col shrink-0 shadow-[-10px_0_15px_-10px_rgba(0,0,0,0.05)] z-10">
                    <div className="p-4 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
                        <div className="flex items-center gap-2 font-semibold text-neutral-800">
                            <ShoppingCart className="w-5 h-5 text-blue-600" />
                            <span>Venda Atual</span>
                        </div>
                        <Badge variant="outline" className="bg-white">
                            Turno: {shift.id}
                        </Badge>
                    </div>

                    <ScrollArea className="flex-1 p-2">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-neutral-400 py-20">
                                <ShoppingCart className="w-16 h-16 mb-4 opacity-20" />
                                <p>Carrinho Vazio</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {cart.map((item, index) => (
                                    <div key={item.cart_id} className="bg-white border border-neutral-100 rounded-lg p-3 shadow-sm flex flex-col gap-2 relative group hover:border-neutral-300">
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="flex-1 font-medium text-sm text-neutral-900 leading-tight">
                                                {item.name}
                                            </div>
                                            <div className="font-bold text-sm shrink-0">
                                                {((item.sale_price + (item.sale_price * item.tax_rate / 100)) * item.quantity).toLocaleString('pt-MZ', { minimumFractionDigits: 2 })}
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="text-xs text-neutral-500">
                                                {parseFloat(item.sale_price.toString()).toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} / un
                                            </div>
                                            <div className="flex items-center gap-1 bg-neutral-100 rounded-md p-0.5">
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-neutral-600 hover:bg-white hover:shadow-sm" onClick={() => updateQuantity(item.cart_id, -1)}>
                                                    <Minus className="w-3 h-3" />
                                                </Button>
                                                <div className="w-8 text-center font-medium text-sm">{item.quantity}</div>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-neutral-600 hover:bg-white hover:shadow-sm" onClick={() => updateQuantity(item.cart_id, 1)}>
                                                    <Plus className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => removeFromCart(item.cart_id)}
                                            className="absolute -top-2 -right-2 bg-red-100 text-red-600 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white shadow-sm"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>

                    {/* Totals & Checkout */}
                    <div className="border-t border-neutral-200 bg-neutral-50 p-4 space-y-4">
                        <div className="space-y-1.5 text-sm">
                            <div className="flex justify-between text-neutral-500">
                                <span>Subtotal</span>
                                <span>{totals.subtotal.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between text-neutral-500">
                                <span>Impostos (IVA)</span>
                                <span>{totals.tax.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between font-bold text-xl text-neutral-900 pt-2 border-t border-neutral-200">
                                <span>Total (MT)</span>
                                <span>{totals.total.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>

                        <Button 
                            className="w-full h-14 text-lg font-bold shadow-lg" 
                            disabled={cart.length === 0}
                            onClick={handleCheckout}
                        >
                            PAGAR
                        </Button>
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
        </PosLayout>
    );
}
