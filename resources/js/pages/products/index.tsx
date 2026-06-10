import { Head, usePage, Link } from '@inertiajs/react';
import { 
    Plus, 
    Search, 
    MoreHorizontal, 
    Package, 
    Wrench,
    Tag,
    Layers,
    FileText,
    Trash2,
    Edit,
    PackageOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState } from 'react';
import { toast } from 'sonner';

interface Category {
    id: number;
    name: string;
}

interface Unit {
    id: number;
    short_name: string;
}

interface Brand {
    id: number;
    name: string;
}

interface Product {
    id: number;
    name: string;
    sku: string | null;
    barcode: string | null;
    type: 'product' | 'service';
    price: string;
    cost: string;
    status: string;
    image_path: string | null;
    tax_rate: string;
    tax_is_exempt: boolean;
    category: Category | null;
    unit: Unit | null;
    brand: Brand | null;
}

export default function ProductsIndex() {
    const { products } = usePage<{ products: Product[] }>().props;
    const [search, setSearch] = useState('');

    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase()) || 
        p.sku?.toLowerCase().includes(search.toLowerCase())
    );

    const deleteProduct = (id: number) => {
        if (confirm('Tem certeza que deseja remover este item do catálogo?')) {
            import('@inertiajs/react').then(({ router }) => {
                router.delete(`/products/${id}`, {
                    onSuccess: () => toast.success('Item removido com sucesso!'),
                });
            });
        }
    };

    // Formatador de Moeda localizado (MZN)
    const formatCurrency = (value: string) => {
        const numeric = parseFloat(value) || 0;
        return new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(numeric);
    };

    return (
        <>
            <Head title="Catálogo de Itens" />

            <div className="p-6 space-y-6  mx-auto">
                
                {/* HEADER */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                            Catálogo de Itens
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Gerencie seus produtos, mercadorias e serviços prestados.
                        </p>
                    </div>

                    <Button className="gap-2 self-start sm:self-auto" asChild>
                        <Link href="/products/create">
                            <Plus className="h-4 w-4" />
                            Novo Item
                        </Link>
                    </Button>
                </div>

                {/* FILTERS BAR */}
                <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input 
                            placeholder="Pesquisar por nome ou SKU..." 
                            className="pl-9 bg-white dark:bg-zinc-900 shadow-xs"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* DATA TABLE CARD */}
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs">
                    <Table>
                        <TableHeader className="bg-slate-50/75 dark:bg-zinc-800/50">
                            <TableRow>
                                <TableHead className="w-[380px] font-semibold text-slate-700 dark:text-slate-300">Item / SKU</TableHead>
                                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Tipo</TableHead>
                                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Categoria / Marca</TableHead>
                                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Imposto</TableHead>
                                <TableHead className="text-right font-semibold text-slate-700 dark:text-slate-300 w-[180px]">Preço de Venda</TableHead>
                                <TableHead className="font-semibold text-slate-700 dark:text-slate-300 w-[100px]">Status</TableHead>
                                <TableHead className="text-right font-semibold text-slate-700 dark:text-slate-300 w-[80px]">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        
                        <TableBody>
                            {filteredProducts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-48 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center gap-2.5">
                                            <PackageOpen className="h-8 w-8 text-slate-300 dark:text-slate-700" />
                                            <span className="text-sm font-medium">Nenhum item encontrado no catálogo.</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredProducts.map((product) => (
                                    <TableRow key={product.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                                        
                                        {/* ITEM / SKU */}
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-11 w-11 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 shadow-2xs">
                                                    {product.image_path ? (
                                                        <img 
                                                            src={product.image_path} 
                                                            alt={product.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <span className="text-slate-400 dark:text-slate-500">
                                                            {product.type === 'product' ? <Package className="h-5 w-5" /> : <Wrench className="h-5 w-5" />}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-semibold text-slate-900 dark:text-zinc-100 leading-none">
                                                        {product.name}
                                                    </span>
                                                    <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                                                        {product.sku || 'SEM SKU'}
                                                    </span>
                                                </div>
                                            </div>
                                        </TableCell>

                                        {/* TIPO */}
                                        <TableCell>
                                            <Badge 
                                                variant="outline" 
                                                className={`text-[10px] font-semibold px-2 py-0.5 tracking-wide ${
                                                    product.type === 'product' 
                                                        ? 'text-blue-600 border-blue-100 bg-blue-50/40 dark:bg-blue-950/20 dark:border-blue-900' 
                                                        : 'text-purple-600 border-purple-100 bg-purple-50/40 dark:bg-purple-950/20 dark:border-purple-900'
                                                }`}
                                            >
                                                {product.type === 'product' ? 'PRODUTO' : 'SERVIÇO'}
                                            </Badge>
                                        </TableCell>

                                        {/* CATEGORIA / MARCA */}
                                        <TableCell>
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-zinc-400 font-medium">
                                                    <Layers className="h-3.5 w-3.5 text-slate-400" />
                                                    {product.category?.name || 'Sem Categoria'}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                    <Tag className="h-3.5 w-3.5 text-slate-400" />
                                                    {product.brand?.name || 'Sem Marca'}
                                                </div>
                                            </div>
                                        </TableCell>

                                        {/* IVA */}
                                        <TableCell>
                                            {product.tax_is_exempt ? (
                                                <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-950 bg-emerald-50/40 dark:bg-emerald-950/10 text-[10px] font-bold px-1.5 py-0">
                                                    ISENTO
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-950 bg-amber-50/40 dark:bg-amber-950/10 text-[10px] font-bold px-1.5 py-0">
                                                    {parseFloat(product.tax_rate)}% IVA
                                                </Badge>
                                            )}
                                        </TableCell>

                                        {/* PREÇOS */}
                                        <TableCell className="text-right">
                                            <span className="font-bold text-slate-900 dark:text-zinc-100 font-mono text-sm">
                                                {formatCurrency(product.price)}
                                            </span>
                                            <div className="text-[10px] text-muted-foreground font-medium mt-0.5">
                                                Custo: <span className="font-mono">{formatCurrency(product.cost)}</span>
                                            </div>
                                        </TableCell>

                                        {/* STATUS */}
                                        <TableCell>
                                            <Badge 
                                                variant={product.status === 'active' ? 'default' : 'secondary'} 
                                                className={`px-2 py-0.5 text-[10px] font-bold tracking-wide ${
                                                    product.status === 'active' 
                                                        ? 'bg-emerald-600 hover:bg-emerald-600 text-white dark:bg-emerald-500' 
                                                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400'
                                                }`}
                                            >
                                                {product.status === 'active' ? 'ATIVO' : 'INATIVO'}
                                            </Badge>
                                        </TableCell>

                                        {/* AÇÕES (DROPDOWN) */}
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-900 dark:hover:text-white">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-[160px]">
                                                    <DropdownMenuLabel>Ações do Item</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/products/${product.id}`} className="flex items-center gap-2 cursor-pointer w-full">
                                                            <FileText className="h-4 w-4 text-slate-400" /> Ver Detalhes
                                                        </Link>
                                                    </DropdownMenuItem>

                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/products/${product.id}/edit`} className="flex items-center gap-2 cursor-pointer w-full">
                                                            <Edit className="h-4 w-4 text-slate-400" /> Editar Item
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    
                                                    <DropdownMenuSeparator />
                                                    
                                                    <DropdownMenuItem 
                                                        className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20 gap-2 cursor-pointer"
                                                        onClick={() => deleteProduct(product.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" /> Remover Item
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </>
    );
}