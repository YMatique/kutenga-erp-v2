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
    Edit
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

    return (
        <>
            <Head title="Catálogo de Itens" />

            <div className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-white italic">Catálogo de Itens</h1>
                        <p className="text-muted-foreground text-sm">
                            Gerencie seus produtos, mercadorias e serviços prestados.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link href="/products/create">
                            <Button className="gap-2">
                                <Plus className="h-4 w-4" />
                                Novo Item
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                        <Input 
                            placeholder="Pesquisar por nome ou SKU..." 
                            className="pl-9 bg-white dark:bg-zinc-900"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    {/* Add Filter buttons here later */}
                </div>

                <div className="rounded-xl border border-zinc-200/50 bg-white/70 backdrop-blur-md dark:bg-zinc-900/70 overflow-hidden shadow-xs">
                    <Table>
                        <TableHeader className="bg-zinc-50/50 dark:bg-zinc-800/30">
                            <TableRow>
                                <TableHead className="w-[400px]">Item / SKU</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Categoria / Marca</TableHead>
                                <TableHead className="text-right">Preço de Venda</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredProducts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center gap-2">
                                            <Package className="h-8 w-8 opacity-20" />
                                            <span>Nenhum item encontrado no catálogo.</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredProducts.map((product) => (
                                    <TableRow key={product.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                                                    {product.type === 'product' ? <Package className="h-5 w-5" /> : <Wrench className="h-5 w-5" />}
                                                </div>
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-semibold text-zinc-900 dark:text-zinc-100 italic leading-none">{product.name}</span>
                                                    <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                                                        {product.sku || 'SEM SKU'}
                                                    </span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge 
                                                variant="outline" 
                                                className={product.type === 'product' ? 'text-blue-600 border-blue-200 bg-blue-50/50' : 'text-purple-600 border-purple-200 bg-purple-50/50'}
                                            >
                                                {product.type === 'product' ? 'PRODUTO' : 'SERVIÇO'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                                                    <Layers className="h-3 w-3" />
                                                    {product.category?.name || 'Sem Categoria'}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                                                    <Tag className="h-3 w-3" />
                                                    {product.brand?.name || 'Sem Marca'}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-semibold text-zinc-900 dark:text-zinc-100">
                                            {new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(parseFloat(product.price))}
                                            <div className="text-[10px] text-muted-foreground font-normal">
                                                Custo: {new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(parseFloat(product.cost))}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={product.status === 'active' ? 'default' : 'secondary'} className="px-1.5 py-0 text-[10px] font-bold">
                                                {product.status.toUpperCase()}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Opções</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="gap-2">
                                                        <Edit className="h-4 w-4" /> Editar Item
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="gap-2">
                                                        <FileText className="h-4 w-4" /> Ver Detalhes
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem 
                                                        className="gap-2 text-red-600 focus:text-red-600"
                                                        onClick={() => deleteProduct(product.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" /> Remover
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
