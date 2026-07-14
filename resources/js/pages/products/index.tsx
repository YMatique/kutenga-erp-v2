import { Head, usePage, Link, router } from '@inertiajs/react';
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
    PackageOpen,
    AlertCircle,
    ShoppingBag,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { PageHeader, TableCard, PrimaryButton, StockBadge, KpiCard } from '@/components/ui/brand';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useConfirmDelete } from '@/contexts/confirm-delete-context';
import { cn } from '@/lib/utils';

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

interface PaginatedProducts {
    data: Product[];
    current_page: number;
    last_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

export default function ProductsIndex() {
    const { products, stats, filters } = usePage<{ products: PaginatedProducts; stats: any; filters: any }>().props;
    const [search, setSearch] = useState(filters?.search || '');

    // Debounced search to query backend
    useEffect(() => {
        if (search === (filters?.search || '')) {
return;
}

        const t = setTimeout(() => {
            router.get('/products', { search }, { preserveState: true, replace: true });
        }, 400);

        return () => clearTimeout(t);
    }, [search, filters?.search]);

    const { confirmDelete } = useConfirmDelete();

    const deleteProduct = (id: number) => {
        confirmDelete({
            url: `/products/${id}`,
            title: 'Remover Item',
            description: 'Tem certeza que deseja remover este item do catálogo?',
            onSuccess: () => toast.success('Item removido com sucesso!'),
        });
    };

    const formatCurrency = (value: string) => {
        const numeric = parseFloat(value) || 0;

        return new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(numeric);
    };

    return (
        <>
            <Head title="Catálogo de Itens" />

            <div className="space-y-4 bg-slate-50">
                {/* PAGE HEADER */}
                <PageHeader
                    title="Catálogo de Itens"
                    subtitle="Gerencie seus produtos, mercadorias e serviços prestados."
                    actions={
                        <Link href="/products/create">
                            <PrimaryButton>
                                <Plus className="h-4 w-4" />
                                Novo Item
                            </PrimaryButton>
                        </Link>
                    }
                />

                {/* STATS CARDS */}
                {stats && (
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                        <KpiCard
                            label="Total de Itens"
                            value={stats.total_items}
                            icon={<ShoppingBag className="h-4 w-4" />}
                            accent="slate"
                        />
                        <KpiCard
                            label="Produtos Físicos"
                            value={stats.total_products}
                            icon={<Package className="h-4 w-4" />}
                            accent="teal"
                        />
                        <KpiCard
                            label="Serviços"
                            value={stats.total_services}
                            icon={<Wrench className="h-4 w-4" />}
                            accent="slate"
                        />
                        <KpiCard
                            label="Stock Baixo"
                            value={stats.low_stock}
                            icon={<AlertCircle className="h-4 w-4" />}
                            accent="gold"
                            description="precisam de reposição"
                        />
                        <KpiCard
                            label="Stock Zerado"
                            value={stats.out_of_stock}
                            icon={<AlertCircle className="h-4 w-4" />}
                            accent="red"
                            description="estoque esgotado"
                        />
                    </div>
                )}

                {/* SEARCH BAR */}
                <div className="flex items-center gap-3">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Pesquisar por nome ou SKU..."
                            className="pl-9 bg-white border-slate-200 rounded-[4px] h-9 text-sm focus-visible:ring-[#2DB8A0]/30"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <span className="text-xs text-slate-400 font-medium">
                        {products.total} ite{products.total !== 1 ? 'ns' : 'm'}
                    </span>
                </div>

                {/* TABLE CARD */}
                <TableCard>
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50 border-b border-slate-100 hover:bg-slate-50">
                                <TableHead className="uppercase text-[10px] tracking-wider text-slate-400 font-semibold w-[360px]">
                                    Item / SKU
                                </TableHead>
                                <TableHead className="uppercase text-[10px] tracking-wider text-slate-400 font-semibold">
                                    Tipo
                                </TableHead>
                                <TableHead className="uppercase text-[10px] tracking-wider text-slate-400 font-semibold">
                                    Categoria / Marca
                                </TableHead>
                                <TableHead className="uppercase text-[10px] tracking-wider text-slate-400 font-semibold">
                                    Imposto
                                </TableHead>
                                <TableHead className="uppercase text-[10px] tracking-wider text-slate-400 font-semibold text-right w-[180px]">
                                    Preço de Venda
                                </TableHead>
                                <TableHead className="uppercase text-[10px] tracking-wider text-slate-400 font-semibold w-[100px]">
                                    Status
                                </TableHead>
                                <TableHead className="uppercase text-[10px] tracking-wider text-slate-400 font-semibold text-right w-[80px]">
                                    Acções
                                </TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {products.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-52 text-center">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="h-12 w-12 rounded-[4px] bg-slate-100 flex items-center justify-center">
                                                <PackageOpen className="h-6 w-6 text-slate-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-600">Nenhum item encontrado</p>
                                                <p className="text-xs text-slate-400 mt-0.5">Adicione produtos ou ajuste o filtro de pesquisa.</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                products.data.map((product) => (
                                    <TableRow
                                        key={product.id}
                                        className="hover:bg-slate-50/50 transition-colors border-b border-slate-100"
                                    >
                                        {/* ITEM / SKU */}
                                        <TableCell className="py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-[4px] border border-slate-200 bg-slate-50 flex items-center justify-center flex-shrink-0">
                                                    {product.image_path ? (
                                                        <img
                                                            src={product.image_path}
                                                            alt={product.name}
                                                            className="w-full h-full object-cover rounded-[4px]"
                                                        />
                                                    ) : (
                                                        <span className="text-slate-400">
                                                            {product.type === 'product'
                                                                ? <Package className="h-4 w-4" />
                                                                : <Wrench className="h-4 w-4" />}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-semibold text-slate-900 text-sm leading-none">
                                                        {product.name}
                                                    </span>
                                                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                                                        {product.sku || '— sem sku'}
                                                    </span>
                                                </div>
                                            </div>
                                        </TableCell>

                                        {/* TIPO */}
                                        <TableCell>
                                            <span
                                                className={cn(
                                                    'inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1 rounded-[4px] uppercase tracking-wide',
                                                    product.type === 'product'
                                                        ? 'bg-blue-50 text-blue-600'
                                                        : 'bg-violet-50 text-violet-600'
                                                )}
                                            >
                                                {product.type === 'product'
                                                    ? <><Package className="h-3 w-3" /> Produto</>
                                                    : <><Wrench className="h-3 w-3" /> Serviço</>}
                                            </span>
                                        </TableCell>

                                        {/* CATEGORIA / MARCA */}
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                                                    <Layers className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                                                    {product.category?.name || <span className="text-slate-400 italic">Sem categoria</span>}
                                                </div>
                                                {product.type === 'product' && (
                                                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                                        <Tag className="h-3.5 w-3.5 flex-shrink-0" />
                                                        {product.brand?.name || <span className="italic">Sem marca</span>}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>

                                        {/* IMPOSTO */}
                                        <TableCell>
                                            {product.tax_is_exempt ? (
                                                <span className="inline-flex items-center text-[10px] font-semibold px-2 py-1 rounded-[4px] bg-[#2DB8A0]/10 text-[#2DB8A0] uppercase tracking-wide">
                                                    Isento
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center text-[10px] font-semibold px-2 py-1 rounded-[4px] bg-[#E8A020]/10 text-[#E8A020] uppercase tracking-wide">
                                                    {parseFloat(product.tax_rate)}% IVA
                                                </span>
                                            )}
                                        </TableCell>

                                        {/* PREÇO DE VENDA */}
                                        <TableCell className="text-right">
                                            <span className="font-bold text-slate-900 font-mono text-sm">
                                                {formatCurrency(product.price)}
                                            </span>
                                            <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                                                Custo: <span className="font-mono">{formatCurrency(product.cost)}</span>
                                            </div>
                                        </TableCell>

                                        {/* STATUS */}
                                        <TableCell>
                                            <StockBadge status={product.status === 'active' ? 'active' : 'inactive'} />
                                        </TableCell>

                                        {/* ACÇÕES */}
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-[4px]"
                                                    >
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-[160px] rounded-[4px]">
                                                    <DropdownMenuLabel className="text-xs text-slate-500">Acções do Item</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />

                                                    <DropdownMenuItem asChild>
                                                        <Link
                                                            href={`/products/${product.id}`}
                                                            className="flex items-center gap-2 cursor-pointer w-full text-sm"
                                                        >
                                                            <FileText className="h-3.5 w-3.5 text-slate-400" />
                                                            Ver Detalhes
                                                        </Link>
                                                    </DropdownMenuItem>

                                                    <DropdownMenuItem asChild>
                                                        <Link
                                                            href={`/products/${product.id}/edit`}
                                                            className="flex items-center gap-2 cursor-pointer w-full text-sm"
                                                        >
                                                            <Edit className="h-3.5 w-3.5 text-slate-400" />
                                                            Editar Item
                                                        </Link>
                                                    </DropdownMenuItem>

                                                    <DropdownMenuSeparator />

                                                    <DropdownMenuItem
                                                        className="text-red-600 focus:text-red-600 focus:bg-red-50 gap-2 cursor-pointer text-sm"
                                                        onClick={() => deleteProduct(product.id)}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                        Remover Item
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    {/* Pagination */}
                    {products.last_page > 1 && (
                        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-white">
                            <p className="text-xs text-slate-500">
                                Página {products.current_page} de {products.last_page} · {products.total} registos
                            </p>
                            <div className="flex gap-1">
                                {products.links.map((link, i) => (
                                    <button
                                        key={i}
                                        disabled={!link.url}
                                        onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                        className={cn(
                                            'px-3 py-1.5 text-xs rounded-[4px] border transition-colors',
                                            link.active
                                                ? 'bg-[#2DB8A0] text-white border-transparent font-medium'
                                                : !link.url
                                                ? 'text-slate-300 border-transparent cursor-not-allowed'
                                                : 'border-slate-200 text-slate-600 hover:bg-slate-50',
                                        )}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </TableCard>
            </div>
        </>
    );
}

ProductsIndex.layout = {
    breadcrumbs: [
        { title: 'Catálogo', href: '#' },
        { title: 'Produtos e Serviços', href: '/products' },
    ],
};