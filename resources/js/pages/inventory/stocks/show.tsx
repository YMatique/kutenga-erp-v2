import { Head, Link } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { ArrowLeft, Box, Landmark, PackageCheck } from 'lucide-react'

// Interfaces mantidas e tipadas corretamente
interface Warehouse {
    id: number
    name: string
}

interface Stock {
    id: number
    quantity: number
    warehouse: Warehouse
}

interface Product {
    id: number
    name: string
}

interface Props {
    product: Product
    stocks: Stock[]
}

export default function Show({ product, stocks }: Props) {
    const totalStock = stocks.reduce((sum, s) => sum + s.quantity, 0)

    return (
        <>
            <Head title={`Stock - ${product.name}`} />

            <div className="p-6 space-y-6  mx-auto">
                
                {/* HEADER */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-5">
                    <div>
                        <div className="flex items-center gap-2">
                            <Box className="h-6 w-6 text-slate-700" />
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                                {product.name}
                            </h1>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            Disponibilidade e distribuição de stock por armazém
                        </p>
                    </div>

                    <Button variant="outline" size="sm" asChild>
                        <Link href="/inventory/stocks" className="gap-1.5">
                            <ArrowLeft className="h-4 w-4" />
                            Voltar ao Stock Geral
                        </Link>
                    </Button>
                </div>

                {/* SUMMARY METRIC CARD */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card className="flex items-center p-4 gap-4 shadow-sm">
                        <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                            <PackageCheck className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                Stock Total Acumulado
                            </p>
                            <p className="text-2xl font-bold text-slate-900 font-mono">
                                {totalStock} <span className="text-sm font-normal text-muted-foreground font-sans">unidades</span>
                            </p>
                        </div>
                    </Card>
                </div>

                {/* TABLE CARD */}
                <Card className="shadow-sm overflow-hidden">
                    <CardHeader className="bg-slate-50/75 border-b py-4">
                        <CardTitle className="text-base font-semibold text-slate-800">
                            Posição por Local de Armazenamento
                        </CardTitle>
                    </CardHeader>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <th className="h-10 px-4 text-left align-middle font-semibold text-slate-700">
                                    <div className="flex items-center gap-1.5">
                                        <Landmark className="h-3.5 w-3.5 text-muted-foreground" />
                                        Armazém
                                    </div>
                                </th>
                                <TableHead className="text-right font-semibold text-slate-700 w-[200px]">
                                    Quantidade em Stock
</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {stocks.length === 0 ? (
                                <TableRow>
                                    <TableCell 
                                        colSpan={2} 
                                        className="h-32 text-center text-muted-foreground text-sm"
                                    >
                                        Este produto não possui registo de quantidades em nenhum armazém.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                stocks.map((stock) => (
                                    <TableRow 
                                        key={stock.id} 
                                        className="hover:bg-slate-50/50 transition-colors"
                                    >
                                        {/* Nome do Armazém */}
                                        <TableCell className="font-medium text-slate-800 py-3.5">
                                            {stock.warehouse.name}
                                        </TableCell>

                                        {/* Quantidade */}
                                        <TableCell className="text-right font-semibold font-mono text-slate-900 text-base">
                                            {stock.quantity}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </Card>

            </div>
        </>
    )
}

Show.layout = (page: any) => (
    <AppLayout breadcrumbs={[
        { title: 'Inventário', href: '#' },
        { title: 'Stock Geral', href: '/inventory/stocks' },
        { title: page.props?.product?.name ?? 'Detalhes', href: '#' },
    ]}>
        {page}
    </AppLayout>
);