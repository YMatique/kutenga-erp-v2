import { Button } from '@/components/ui/button';
import { Minus, Plus, Trash2 } from 'lucide-react';

interface CartItemData {
    cart_id: string;
    id: number;
    name: string;
    sale_price: number | string;
    tax_rate: number;
    quantity: number;
}

interface CartItemRowProps {
    item: CartItemData;
    onUpdateQuantity: (cartId: string, delta: number) => void;
    onRemove: (cartId: string) => void;
}

export default function CartItemRow({ item, onUpdateQuantity, onRemove }: CartItemRowProps) {
    const salePrice = typeof item.sale_price === 'number' 
        ? item.sale_price 
        : parseFloat(item.sale_price || '0');
        
    const lineTotal = (salePrice + (salePrice * item.tax_rate / 100)) * item.quantity;

    return (
        <div className="bg-white border border-neutral-100 rounded-lg p-3 shadow-sm flex flex-col gap-2 relative group hover:border-neutral-300">
            <div className="flex justify-between items-start gap-2">
                <div className="flex-1 font-medium text-sm text-neutral-900 leading-tight">
                    {item.name}
                </div>
                <div className="font-bold text-sm shrink-0">
                    {lineTotal.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })}
                </div>
            </div>
            <div className="flex items-center justify-between">
                <div className="text-xs text-neutral-500">
                    {salePrice.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} / un
                </div>
                <div className="flex items-center gap-1 bg-neutral-100 rounded-md p-0.5">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-neutral-600 hover:bg-white hover:shadow-sm" onClick={() => onUpdateQuantity(item.cart_id, -1)}>
                        <Minus className="w-3 h-3" />
                    </Button>
                    <div className="w-8 text-center font-medium text-sm">{item.quantity}</div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-neutral-600 hover:bg-white hover:shadow-sm" onClick={() => onUpdateQuantity(item.cart_id, 1)}>
                        <Plus className="w-3 h-3" />
                    </Button>
                </div>
            </div>
            <button 
                onClick={() => onRemove(item.cart_id)}
                className="absolute -top-2 -right-2 bg-red-100 text-red-600 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white shadow-sm"
            >
                <Trash2 className="w-3 h-3" />
            </button>
        </div>
    );
}
