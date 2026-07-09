import { Badge } from '@/components/ui/badge';

interface Product {
    id: number;
    name: string;
    sale_price: number | string;
    image_url?: string;
    category_id: number;
    tax_rate: number;
    stock: number;
}

interface ProductCardProps {
    product: Product;
    onClick: (product: Product) => void;
}

export default function ProductCard({ product, onClick }: ProductCardProps) {
    const salePrice = typeof product.sale_price === 'number' 
        ? product.sale_price 
        : parseFloat(product.sale_price || '0');

    return (
        <div
            className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden cursor-pointer hover:shadow-md hover:border-blue-400 transition-all flex flex-col group"
            onClick={() => onClick(product)}
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
                    {salePrice.toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' })}
                </div>
            </div>
        </div>
    );
}
