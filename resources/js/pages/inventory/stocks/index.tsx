import { Head, Link } from '@inertiajs/react'

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
import { Eye, Layers } from 'lucide-react'

// Mantendo suas interfaces limpas e bem tipadas
interface Product {
    id: number
    name: string
}

interface Warehouse {
    id: number
    name: string
}

interface Stock {
    id: number
    quantity: number
    product: Product
    warehouse: Warehouse
}

interface Props {
    stocks: Stock[]
}

export default function Index({ stocks }: Props) {
    return (
        <>
            <Head title="Stock Geral" />

            <div className="p-6 space-y-6  mx-auto">
                
                {/* HEADER */}
                <div className="flex flex-col gap-1 border-b pb-5">
                    <div className="flex items-center gap-2">
                        <Layers className="h-6 w-6 text-slate-700" />
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                            Stock Geral
                        </h1>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Visão consolidada de inventário distribuído por produto e armazém
                    </p>
                </div>

                {/* TABLE CARD */}
                <Card className="shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-50/75">
                            <TableRow>
                                <TableHead className="font-semibold text-slate-700">Produto</TableHead>
                                <TableHead className="font-semibold text-slate-700">Armazém</TableHead>
                                <TableHead className="text-right font-semibold text-slate-700 w-[150px]">Stock</TableHead>
                                <TableHead className="text-right font-semibold text-slate-700 w-[120px]">Ações</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {stocks.length === 0 ? (
                                <TableRow>
                                    <TableCell 
                                        colSpan={4} 
                                        className="h-32 text-center text-muted-foreground text-sm"
                                    >
                                        Nenhum registo de stock encontrado no sistema.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                stocks.map((stock) => (
                                    <TableRow 
                                        key={stock.id} 
                                        className="hover:bg-slate-50/50 transition-colors"
                                    >
                                        {/* Nome do Produto */}
                                        <TableCell className="font-medium text-slate-900 py-3.5">
                                            {stock.product.name}
                                        </TableCell>

                                        {/* Nome do Armazém */}
                                        <TableCell className="text-slate-600">
                                            {stock.warehouse.name}
                                        </TableCell>

                                        {/* Quantidade */}
                                        <TableCell className="text-right font-semibold font-mono text-slate-900">
                                            {stock.quantity}
                                        </TableCell>

                                        {/* Botão de Ação */}
                                        <TableCell className="text-right">
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="h-8 gap-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                asChild
                                            >
                                                <Link href={`/inventory/stocks/${stock.product.id}`}>
                                                    <Eye className="h-3.5 w-3.5" />
                                                    Detalhes
                                                </Link>
                                            </Button>
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