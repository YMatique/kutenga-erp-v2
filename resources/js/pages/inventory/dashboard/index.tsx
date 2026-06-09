import { Head, usePage } from "@inertiajs/react";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export default function InventoryDashboard() {
    const {
        stats,
        lowStockProducts,
        outOfStockProducts,
        warehouseSummary,
        recentMovements,
    }: any = usePage().props;

    const attentionProducts = [
        ...outOfStockProducts.map((p: any) => ({
            ...p,
            status: "out",
        })),
        ...lowStockProducts.map((p: any) => ({
            ...p,
            status: "low",
        })),
    ];

    const movementLabels: any = {
        opening: "Stock Inicial",
        in: "Entrada",
        out: "Saída",
        adjustment: "Ajuste",
    };

    return (
        <>
            <Head title="Inventário" />

            <div className="space-y-6 p-6">

                {/* HEADER */}

                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Inventário
                    </h1>

                    <p className="text-muted-foreground">
                        Visão geral do stock e movimentações.
                    </p>
                </div>

                {/* KPI CARDS */}

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">
                                Produtos
                            </CardTitle>
                        </CardHeader>

                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.products}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">
                                Armazéns
                            </CardTitle>
                        </CardHeader>

                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.warehouses}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">
                                Total em Stock
                            </CardTitle>
                        </CardHeader>

                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.total_stock}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">
                                Valor Inventário
                            </CardTitle>
                        </CardHeader>

                        <CardContent>
                            <div className="text-2xl font-bold">
                                {Number(stats.inventory_value).toLocaleString()}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">
                                Stock Baixo
                            </CardTitle>
                        </CardHeader>

                        <CardContent>
                            <div className="text-2xl font-bold text-amber-600">
                                {stats.low_stock}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">
                                Sem Stock
                            </CardTitle>
                        </CardHeader>

                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">
                                {stats.out_of_stock}
                            </div>
                        </CardContent>
                    </Card>

                </div>

                {/* PRODUTOS QUE REQUEREM ATENÇÃO */}

                <Card>
                    <CardHeader>
                        <CardTitle>
                            Produtos que Requerem Atenção
                        </CardTitle>
                    </CardHeader>

                    <CardContent>

                        <Table>

                            <TableHeader>
                                <TableRow>
                                    <TableHead>Produto</TableHead>
                                    <TableHead>Categoria</TableHead>
                                    <TableHead>Estado</TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>

                                {attentionProducts.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={3}
                                            className="text-center"
                                        >
                                            Nenhum produto requer atenção.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    attentionProducts.map((product: any) => (
                                        <TableRow key={`${product.status}-${product.id}`}>

                                            <TableCell className="font-medium">
                                                {product.name}
                                            </TableCell>

                                            <TableCell>
                                                {product.category?.name}
                                            </TableCell>

                                            <TableCell>
                                                {product.status === "out" ? (
                                                    <Badge variant="destructive">
                                                        Esgotado
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary">
                                                        Stock Baixo
                                                    </Badge>
                                                )}
                                            </TableCell>

                                        </TableRow>
                                    ))
                                )}

                            </TableBody>

                        </Table>

                    </CardContent>
                </Card>

                {/* GRID INFERIOR */}

                <div className="grid gap-6 xl:grid-cols-2">

                    {/* ARMAZÉNS */}

                    <Card>

                        <CardHeader>
                            <CardTitle>
                                Stock por Armazém
                            </CardTitle>
                        </CardHeader>

                        <CardContent>

                            <div className="grid gap-4">

                                {warehouseSummary.map((warehouse: any) => (
                                    <div
                                        key={warehouse.id}
                                        className="rounded-lg border p-4"
                                    >
                                        <div className="flex items-center justify-between">

                                            <div>

                                                <div className="font-semibold">
                                                    {warehouse.name}
                                                </div>

                                                <div className="text-sm text-muted-foreground">
                                                    {warehouse.products} produtos
                                                </div>

                                            </div>

                                            <div className="text-right">

                                                <div className="font-bold">
                                                    {warehouse.quantity}
                                                </div>

                                                <div className="text-xs text-muted-foreground">
                                                    unidades
                                                </div>

                                            </div>

                                        </div>
                                    </div>
                                ))}

                            </div>

                        </CardContent>

                    </Card>

                    {/* MOVIMENTOS */}

                    <Card>

                        <CardHeader>
                            <CardTitle>
                                Movimentos Recentes
                            </CardTitle>
                        </CardHeader>

                        <CardContent>

                            <div className="space-y-4">

                                {recentMovements.map((movement: any) => (

                                    <div
                                        key={movement.id}
                                        className="flex items-center justify-between border-b pb-3"
                                    >
                                        <div>

                                            <div className="font-medium">
                                                {movement.product?.name}
                                            </div>

                                            <div className="text-sm text-muted-foreground">
                                                {movement.warehouse?.name}
                                            </div>

                                        </div>

                                        <div className="text-right">

                                            <Badge variant="outline">
                                                {movementLabels[movement.type]}
                                            </Badge>

                                            <div className="mt-1 text-sm">
                                                {movement.quantity}
                                            </div>

                                        </div>

                                    </div>
                                ))}

                            </div>

                        </CardContent>

                    </Card>

                </div>

            </div>
        </>
    );
}