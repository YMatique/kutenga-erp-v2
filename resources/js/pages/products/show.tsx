import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
    ArrowLeft,
    Package,
    Wrench,
    Pencil,
    Archive,
    Layers,
    Tag,
    Barcode,
    Scale,
    ReceiptText,
    ShieldCheck,
    Info,
    Wallet,
    Boxes,
} from 'lucide-react';

import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PrimaryButton, OutlineButton, KpiCard } from '@/components/ui/brand';

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
    description: string | null;
    type: 'product' | 'service';
    price: string;
    cost: string;
    status: string;
    image_path: string | null;
    tax_rate: string;
    tax_is_exempt: boolean;
    tax_exemption_reason: string | null;
    track_stock: boolean;
    min_stock: number | null;
    weight: string | null;
    internal_notes: string | null;
    category: Category | null;
    unit: Unit | null;
    brand: Brand | null;
}

interface StockByWarehouse {
    warehouse: {
        id: number;
        name: string;
    };
    stock: number;
}

function formatCurrency(value: string | number) {
    return new Intl.NumberFormat('pt-MZ', {
        style: 'currency',
        currency: 'MZN',
    }).format(Number(value));
}

export default function ProductShow() {
    const { product, stockByWarehouse } = usePage<{
        product: Product;
        stockByWarehouse: StockByWarehouse[];
    }>().props;

    const price = Number(product.price);
    const cost = Number(product.cost);

    const margin =
        price > 0 ? (((price - cost) / price) * 100).toFixed(1) : '0';

    return (
        <>
            <Head title={product.name} />

            <div className="flex flex-col gap-6">



                {/* Header */}
                <div className="bg-white border border-slate-200 rounded-[4px] shadow-xs p-6">
                    <div className="flex justify-between gap-6">

                        <div className="flex items-start gap-5">

                            <div className="h-24 w-24 rounded-[4px] overflow-hidden border border-slate-200 bg-zinc-100 flex items-center justify-center">
                                {product.image_path ? (
                                    <img
                                        src={product.image_path}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    product.type === 'product'
                                        ? <Package className="h-10 w-10" />
                                        : <Wrench className="h-10 w-10" />
                                )}
                            </div>

                            <div className="flex flex-col gap-2">

                                <div className="flex items-center gap-2">
                                    <h1 className="text-3xl font-bold">
                                        {product.name}
                                    </h1>

                                    <Badge>
                                        {product.status}
                                    </Badge>
                                </div>

                                <div className="flex gap-3 text-sm text-muted-foreground">
                                    {product.sku && (
                                        <span className="flex items-center gap-1">
                                            <Barcode className="h-4 w-4" />
                                            {product.sku}
                                        </span>
                                    )}

                                    <span className="flex items-center gap-1">
                                        <Layers className="h-4 w-4" />
                                        {product.category?.name || 'Sem categoria'}
                                    </span>

                                    <span className="flex items-center gap-1">
                                        <Tag className="h-4 w-4" />
                                        {product.brand?.name || 'Sem marca'}
                                    </span>
                                </div>

                                {product.description && (
                                    <p className="text-sm text-muted-foreground">
                                        {product.description}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <OutlineButton asChild>
                                <Link href="/products">
                                    <ArrowLeft className="h-4 w-4 mr-1" />
                                    Voltar
                                </Link>
                            </OutlineButton>

                            <PrimaryButton asChild>
                                <Link href={`/products/${product.id}/edit`}>
                                    <Pencil className="h-4 w-4 mr-1" />
                                    Editar
                                </Link>
                            </PrimaryButton>
                        </div>
                    </div>
                </div>

                 {/* Metrics */}
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <KpiCard
                        label="Preço de Venda"
                        value={formatCurrency(product.price)}
                        icon={<Wallet className="h-4 w-4 text-zinc-400" />}
                        accent="teal"
                    />
                    <KpiCard
                        label="Custo"
                        value={formatCurrency(product.cost)}
                        icon={<ReceiptText className="h-4 w-4 text-zinc-400" />}
                        accent="slate"
                    />
                    <KpiCard
                        label="Margem"
                        value={`${margin}%`}
                        icon={<ShieldCheck className="h-4 w-4 text-zinc-400" />}
                        accent="gold"
                        description="Lucro estimado"
                    />
                    <KpiCard
                        label="Controle de Estoque"
                        value={product.track_stock ? 'Ativado' : 'Desativado'}
                        icon={<Boxes className="h-4 w-4 text-zinc-400" />}
                        accent={product.track_stock ? 'teal' : 'slate'}
                        description={`Estoque mínimo: ${product.min_stock || 0}`}
                    />
                </div>

                {/* Tabs */}
                <Tabs defaultValue="overview">

                    <TabsList>
                        <TabsTrigger value="overview">
                            Visão Geral
                        </TabsTrigger>

                        <TabsTrigger value="inventory">
                            Estoque
                        </TabsTrigger>

                        <TabsTrigger value="activity">
                            Atividade
                        </TabsTrigger>
                    </TabsList>

                    {/* OVERVIEW */}
                     {/* Overview */}
                    <TabsContent value="overview" className="mt-6">

                        <div className="grid gap-6 xl:grid-cols-3">

                            {/* Left */}
                            <div className="xl:col-span-2 space-y-6">

                                {/* General */}
                                <div className="bg-white border border-slate-200 rounded-[4px] shadow-xs p-6">
                                    <div className="flex items-center gap-2 mb-5">
                                        <Info className="h-5 w-5 text-zinc-400" />

                                        <h3 className="text-lg font-semibold">
                                            Informações Gerais
                                        </h3>
                                    </div>

                                    <div className="grid gap-5 md:grid-cols-2">

                                        <div>
                                            <p className="text-xs uppercase text-muted-foreground">
                                                Tipo
                                            </p>

                                            <p className="mt-1 font-medium">
                                                {product.type === 'product'
                                                    ? 'Produto'
                                                    : 'Serviço'}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs uppercase text-muted-foreground">
                                                Unidade
                                            </p>

                                            <p className="mt-1 font-medium">
                                                {product.unit?.short_name || '-'}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs uppercase text-muted-foreground">
                                                Código de Barras
                                            </p>

                                            <p className="mt-1 font-medium">
                                                {product.barcode || '-'}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs uppercase text-muted-foreground">
                                                Peso
                                            </p>

                                            <p className="mt-1 font-medium flex items-center gap-1">
                                                <Scale className="h-4 w-4 text-zinc-400" />
                                                {product.weight || '-'}
                                            </p>
                                        </div>

                                    </div>
                                </div>

                                {/* Notes */}
                                <div className="bg-white border border-slate-200 rounded-[4px] shadow-xs p-6">
                                    <h3 className="text-lg font-semibold mb-4">
                                        Observações Internas
                                    </h3>

                                    <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                        {product.internal_notes ||
                                            'Nenhuma observação adicionada.'}
                                    </p>
                                </div>
                            </div>

                            {/* Right */}
                            <div className="space-y-6">

                                {/* Tax */}
                                <div className="bg-white border border-slate-200 rounded-[4px] shadow-xs p-6">
                                    <h3 className="text-lg font-semibold mb-5">
                                        Fiscal
                                    </h3>

                                    <div className="space-y-5">

                                        <div>
                                            <p className="text-xs uppercase text-muted-foreground">
                                                IVA
                                            </p>

                                            <div className="mt-2">
                                                {product.tax_is_exempt ? (
                                                    <Badge
                                                        variant="outline"
                                                        className="rounded-full"
                                                    >
                                                        Isento de IVA
                                                    </Badge>
                                                ) : (
                                                    <Badge
                                                        variant="outline"
                                                        className="rounded-full"
                                                    >
                                                        {product.tax_rate}% IVA
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        {product.tax_is_exempt &&
                                            product.tax_exemption_reason && (
                                                <div>
                                                    <p className="text-xs uppercase text-muted-foreground">
                                                        Motivo da Isenção
                                                    </p>

                                                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                                                        {product.tax_exemption_reason}
                                                    </p>
                                                </div>
                                            )}
                                    </div>
                                </div>

                                {/* Commercial */}
                                <div className="bg-white border border-slate-200 rounded-[4px] shadow-xs p-6">
                                    <h3 className="text-lg font-semibold mb-5">
                                        Comercial
                                    </h3>

                                    <div className="space-y-5">

                                        <div>
                                            <p className="text-xs uppercase text-muted-foreground">
                                                Venda
                                            </p>

                                            <p className="mt-1 text-lg font-semibold">
                                                {formatCurrency(product.price)}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs uppercase text-muted-foreground">
                                                Custo
                                            </p>

                                            <p className="mt-1 text-lg font-semibold">
                                                {formatCurrency(product.cost)}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs uppercase text-muted-foreground">
                                                Margem
                                            </p>

                                            <p className="mt-1 text-lg font-semibold">
                                                {margin}%
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* INVENTORY REAL */}
                    <TabsContent value="inventory">

                        <div className="bg-white border border-slate-200 rounded-[4px] shadow-xs p-6">

                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">
                                    Stock por Armazém
                                </h3>

                                <Boxes className="h-5 w-5 text-zinc-400" />
                            </div>

                            <div className="space-y-3">

                                {stockByWarehouse.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        Nenhum armazém encontrado
                                    </p>
                                ) : (
                                    stockByWarehouse.map((item) => (
                                        <div
                                            key={item.warehouse.id}
                                            className="flex justify-between border border-slate-200 p-4 rounded-[4px]"
                                        >
                                            <div>
                                                <p className="font-medium">
                                                    {item.warehouse.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Armazém
                                                </p>
                                            </div>

                                            <div className="text-right">
                                                <p className="text-xl font-bold">
                                                    {item.stock}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    unidades
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}

                            </div>
                        </div>

                    </TabsContent>

                    {/* ACTIVITY */}
                    <TabsContent value="activity">
                        <div className="bg-white border border-slate-200 rounded-[4px] shadow-xs p-6 text-center text-muted-foreground">
                            Histórico futuro
                        </div>
                    </TabsContent>

                </Tabs>
            </div>
        </>
    );
}

ProductShow.layout = (page: any) => (
    <AppLayout breadcrumbs={[
        { title: 'Catálogo', href: '#' },
        { title: 'Produtos e Serviços', href: '/products' },
        { title: page.props?.product?.name ?? 'Detalhes', href: '#' },
    ]}>
        {page}
    </AppLayout>
);