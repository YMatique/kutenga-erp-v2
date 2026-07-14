import { useForm, usePage } from '@inertiajs/react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import AppLayout from '@/layouts/app-layout';

export default function CreateTransfer() {

const { warehouses = [], products = [] }: any = usePage().props

    const { data, setData, post, processing } = useForm({
        from_warehouse_id: '',
        to_warehouse_id: '',
        items: [],
        notes: '',
    })

    const [productId, setProductId] = useState('')
    const [quantity, setQuantity] = useState(1)

    function addItem() {
        if (!productId || quantity <= 0) {
return
}

        const product = products.find((p: any) => p.id == productId)

        setData('items', [
            ...data.items,
            {
                product_id: product.id,
                name: product.name,
                quantity: Number(quantity),
            }
        ])

        setProductId('')
        setQuantity(1)
    }

    function removeItem(index: number) {
        const updated = [...data.items]
        updated.splice(index, 1)
        setData('items', updated)
    }

    function submit(e: any) {
        e.preventDefault()
        post('/inventory/transfers')
    }

    return (
        <div className="space-y-6">

            {/* HEADER */}
            <div>
                <h1 className="text-2xl font-semibold">
                    Nova Transferência
                </h1>
                <p className="text-sm text-muted-foreground">
                    Transferir stock entre armazéns
                </p>
            </div>

            <form onSubmit={submit} className="space-y-6">

                {/* ARMAZÉNS */}
                <Card>
                    <CardHeader>
                        <CardTitle>Armazéns</CardTitle>
                    </CardHeader>

                    <CardContent className="grid md:grid-cols-2 gap-4">

                        <div className="space-y-2">
                            <Label>Origem</Label>
                            <Select
                                onValueChange={(v) =>
                                    setData('from_warehouse_id', v)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecionar origem" />
                                </SelectTrigger>
                                <SelectContent>
                                    {warehouses.map((w: any) => (
                                        <SelectItem key={w.id} value={String(w.id)}>
                                            {w.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Destino</Label>
                            <Select
                                onValueChange={(v) =>
                                    setData('to_warehouse_id', v)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecionar destino" />
                                </SelectTrigger>
                                <SelectContent>
                                    {warehouses.map((w: any) => (
                                        <SelectItem key={w.id} value={String(w.id)}>
                                            {w.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                    </CardContent>
                </Card>

                {/* PRODUTOS */}
                <Card>
                    <CardHeader>
                        <CardTitle>Produtos</CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4">

                        {/* ADD ITEM */}
                        <div className="flex gap-2">

                            <Select value={productId} onValueChange={setProductId}>
                                <SelectTrigger className="w-[300px]">
                                    <SelectValue placeholder="Produto" />
                                </SelectTrigger>
                                <SelectContent>
                                    {products.map((p: any) => (
                                        <SelectItem key={p.id} value={String(p.id)}>
                                            {p.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Input
                                type="number"
                                min={1}
                                value={quantity}
                                onChange={(e) => setQuantity(Number(e.target.value))}
                                className="w-[120px]"
                            />

                            <Button type="button" onClick={addItem}>
                                Adicionar
                            </Button>

                        </div>

                        {/* TABLE */}
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Produto</TableHead>
                                    <TableHead>Quantidade</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {data.items.map((item: any, index: number) => (
                                    <TableRow key={index}>
                                        <TableCell>{item.name}</TableCell>
                                        <TableCell>{item.quantity}</TableCell>
                                        <TableCell>
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                onClick={() => removeItem(index)}
                                            >
                                                Remover
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                    </CardContent>
                </Card>

                {/* OBSERVAÇÕES */}
                <Card>
                    <CardHeader>
                        <CardTitle>Notas</CardTitle>
                    </CardHeader>

                    <CardContent>
                        <Input
                            value={data.notes}
                            onChange={(e) =>
                                setData('notes', e.target.value)
                            }
                            placeholder="Observações da transferência"
                        />
                    </CardContent>
                </Card>

                {/* ACTIONS */}
                <div className="flex justify-end gap-3">

                    <Button
                        type="button"
                        variant="outline"
                    >
                        Cancelar
                    </Button>

                    <Button type="submit" disabled={processing}>
                        {processing ? 'A processar...' : 'Criar Transferência'}
                    </Button>

                </div>

            </form>
        </div>
    )
}

CreateTransfer.layout = (page: any) => (
    <AppLayout breadcrumbs={[
        { title: 'Inventário', href: '#' },
        { title: 'Transferências de Stock', href: '/inventory/transfers' },
        { title: 'Criar Transferência', href: '#' },
    ]}>
        {page}
    </AppLayout>
);