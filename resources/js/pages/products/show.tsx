import { Head, Link, usePage } from '@inertiajs/react';
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

function formatCurrency(value: string | number) {
    return new Intl.NumberFormat('pt-MZ', {
        style: 'currency',
        currency: 'MZN',
    }).format(Number(value));
}

export default function ProductShow() {
    const { product } = usePage<{ product: Product }>().props;

    const price = Number(product.price);
    const cost = Number(product.cost);

    const margin =
        price > 0 ? (((price - cost) / price) * 100).toFixed(1) : '0';

    return (
        <>
            <Head title={product.name} />

            <div className="flex flex-col gap-6">

                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Link
                        href="/products"
                        className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                    >
                        Produtos
                    </Link>

                    <span>/</span>

                    <span className="text-zinc-900 dark:text-zinc-100">
                        {product.name}
                    </span>
                </div>

                {/* Header */}
                <div className="rounded-3xl border border-zinc-200/70 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/70 backdrop-blur-xl p-6 shadow-sm">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">

                        {/* Left */}
                        <div className="flex items-start gap-5">

                            {/* Image */}
                            <div className="h-24 w-24 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                                {product.image_path ? (
                                    <img
                                        src={product.image_path}
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-zinc-400">
                                        {product.type === 'product' ? (
                                            <Package className="h-10 w-10" />
                                        ) : (
                                            <Wrench className="h-10 w-10" />
                                        )}
                                    </span>
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex flex-col gap-3">

                                <div className="flex flex-wrap items-center gap-2">
                                    <h1 className="text-3xl font-bold tracking-tight text-zinc-950 dark:text-white">
                                        {product.name}
                                    </h1>

                                    <Badge
                                        variant={
                                            product.status === 'active'
                                                ? 'default'
                                                : 'secondary'
                                        }
                                        className="rounded-full px-3"
                                    >
                                        {product.status === 'active'
                                            ? 'Ativo'
                                            : 'Inativo'}
                                    </Badge>
                                </div>

                                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">

                                    {product.sku && (
                                        <div className="flex items-center gap-1.5">
                                            <Barcode className="h-4 w-4" />
                                            {product.sku}
                                        </div>
                                    )}

                                    <div className="flex items-center gap-1.5">
                                        <Layers className="h-4 w-4" />
                                        {product.category?.name || 'Sem categoria'}
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                        <Tag className="h-4 w-4" />
                                        {product.brand?.name || 'Sem marca'}
                                    </div>
                                </div>

                                {product.description && (
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-3xl leading-relaxed">
                                        {product.description}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3">

                            <Link href="/products">
                                <Button variant="outline" className="gap-2">
                                    <ArrowLeft className="h-4 w-4" />
                                    Voltar
                                </Button>
                            </Link>

                            <Link href={`/products/${product.id}/edit`}>
                                <Button className="gap-2">
                                    <Pencil className="h-4 w-4" />
                                    Editar
                                </Button>
                            </Link>

                            <Button variant="outline" className="gap-2">
                                <Archive className="h-4 w-4" />
                                Arquivar
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Metrics */}
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

                    <div className="rounded-2xl border bg-white/80 dark:bg-zinc-900/70 backdrop-blur-xl p-5">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                                Preço de Venda
                            </span>

                            <Wallet className="h-4 w-4 text-zinc-400" />
                        </div>

                        <div className="mt-4">
                            <h2 className="text-2xl font-bold tracking-tight">
                                {formatCurrency(product.price)}
                            </h2>
                        </div>
                    </div>

                    <div className="rounded-2xl border bg-white/80 dark:bg-zinc-900/70 backdrop-blur-xl p-5">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                                Custo
                            </span>

                            <ReceiptText className="h-4 w-4 text-zinc-400" />
                        </div>

                        <div className="mt-4">
                            <h2 className="text-2xl font-bold tracking-tight">
                                {formatCurrency(product.cost)}
                            </h2>
                        </div>
                    </div>

                    <div className="rounded-2xl border bg-white/80 dark:bg-zinc-900/70 backdrop-blur-xl p-5">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                                Margem
                            </span>

                            <ShieldCheck className="h-4 w-4 text-zinc-400" />
                        </div>

                        <div className="mt-4">
                            <h2 className="text-2xl font-bold tracking-tight">
                                {margin}%
                            </h2>

                            <p className="text-sm text-muted-foreground mt-1">
                                Lucro estimado
                            </p>
                        </div>
                    </div>

                    <div className="rounded-2xl border bg-white/80 dark:bg-zinc-900/70 backdrop-blur-xl p-5">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                                Controle de Estoque
                            </span>

                            <Boxes className="h-4 w-4 text-zinc-400" />
                        </div>

                        <div className="mt-4">
                            <h2 className="text-2xl font-bold tracking-tight">
                                {product.track_stock ? 'Ativado' : 'Desativado'}
                            </h2>

                            <p className="text-sm text-muted-foreground mt-1">
                                Estoque mínimo:{' '}
                                {product.min_stock || 0}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="overview" className="w-full">

                    <TabsList className="bg-white dark:bg-zinc-900 border rounded-2xl p-1">
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

                    {/* Overview */}
                    <TabsContent value="overview" className="mt-6">

                        <div className="grid gap-6 xl:grid-cols-3">

                            {/* Left */}
                            <div className="xl:col-span-2 space-y-6">

                                {/* General */}
                                <div className="rounded-3xl border bg-white/80 dark:bg-zinc-900/70 backdrop-blur-xl p-6">
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
                                <div className="rounded-3xl border bg-white/80 dark:bg-zinc-900/70 backdrop-blur-xl p-6">
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
                                <div className="rounded-3xl border bg-white/80 dark:bg-zinc-900/70 backdrop-blur-xl p-6">
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
                                <div className="rounded-3xl border bg-white/80 dark:bg-zinc-900/70 backdrop-blur-xl p-6">
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

                    {/* Inventory */}
                    <TabsContent value="inventory" className="mt-6">
                        <div className="rounded-3xl border bg-white/80 dark:bg-zinc-900/70 backdrop-blur-xl p-10 text-center">
                            <Boxes className="h-10 w-10 mx-auto text-zinc-300 mb-4" />

                            <h3 className="text-lg font-semibold">
                                Gestão de Estoque
                            </h3>

                            <p className="text-sm text-muted-foreground mt-2">
                                Movimentações, entradas, saídas e transferências
                                serão exibidas aqui futuramente.
                            </p>
                        </div>
                    </TabsContent>

                    {/* Activity */}
                    <TabsContent value="activity" className="mt-6">
                        <div className="rounded-3xl border bg-white/80 dark:bg-zinc-900/70 backdrop-blur-xl p-10 text-center">
                            <Info className="h-10 w-10 mx-auto text-zinc-300 mb-4" />

                            <h3 className="text-lg font-semibold">
                                Histórico de Atividades
                            </h3>

                            <p className="text-sm text-muted-foreground mt-2">
                                Auditoria e alterações do produto aparecerão aqui.
                            </p>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </>
    );
}