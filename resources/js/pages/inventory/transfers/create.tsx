import { useForm, usePage } from '@inertiajs/react'
import { useState } from 'react'
import { toast } from 'sonner'

import { CameraScanButton } from '@/components/camera-scanner'
import { ProductPicker } from '@/components/product-picker'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useBarcodeScanner } from '@/hooks/use-barcode-scanner'
import AppLayout from '@/layouts/app-layout';
import { findProductByCode } from '@/lib/product-search'
import type { PickedProduct } from '@/lib/product-search'
import { beepError, beepSuccess } from '@/lib/scan-feedback'

export default function CreateTransfer() {

    // Os produtos não vêm com a página: o seletor pesquisa-os no servidor, com o stock da origem
    const { warehouses = [] }: any = usePage().props

    const { data, setData, post, processing } = useForm({
        from_warehouse_id: '',
        to_warehouse_id: '',
        items: [] as { product_id: any; name: string; quantity: number }[],
        notes: '',
    })

    const [picked, setPicked] = useState<PickedProduct | null>(null)
    const [quantity, setQuantity] = useState(1)

    function addItem() {
        if (!picked || quantity <= 0) {
            return
        }

        addOrIncrease(picked, Number(quantity))
        setPicked(null)
        setQuantity(1)
    }

    // Soma à linha do produto, se já estiver na transferência, em vez de repetir o produto
    function addOrIncrease(product: PickedProduct, amount: number) {
        setData((previous: any) => {
            const index = previous.items.findIndex((i: any) => i.product_id === product.id)

            if (index >= 0) {
                const items = [...previous.items]
                items[index] = { ...items[index], quantity: Number(items[index].quantity) + amount }

                return { ...previous, items }
            }

            return { ...previous, items: [...previous.items, { product_id: product.id, name: product.name, quantity: amount }] }
        })
    }

    // Cada leitura adiciona 1 unidade do produto à transferência
    const handleScan = async (code: string) => {
        if (!data.from_warehouse_id) {
            beepError()
            toast.error('Escolha primeiro o armazém de origem.')

            return
        }

        let product: PickedProduct | null = null

        try {
            product = await findProductByCode(code, { warehouseId: data.from_warehouse_id, inStock: true })
        } catch {
            toast.error('Falha ao consultar o código. Verifique a ligação.')

            return
        }

        if (!product) {
            beepError()
            toast.error(`Código ${code} não encontrado entre os produtos com stock na origem.`)

            return
        }

        addOrIncrease(product, 1)
        beepSuccess()
        toast.success(product.name, { duration: 1200 })
    }

    useBarcodeScanner({ onScan: handleScan })

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
                                onValueChange={(v) => {
                                    setData('from_warehouse_id', v)
                                    // O stock mostrado era o da origem anterior
                                    setPicked(null)
                                }}
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

                            <ProductPicker
                                className="w-[320px]"
                                value={picked}
                                onSelect={setPicked}
                                warehouseId={data.from_warehouse_id}
                                inStock
                                disabled={!data.from_warehouse_id}
                                placeholder={data.from_warehouse_id ? 'Pesquisar produto com stock...' : 'Escolha primeiro a origem'}
                            />

                            <Input
                                type="number"
                                min={picked && !picked.allow_decimals ? 1 : 0.001}
                                step={picked && !picked.allow_decimals ? '1' : '0.001'}
                                value={quantity}
                                onChange={(e) => setQuantity(Number(e.target.value))}
                                className="w-[120px]"
                            />

                            <Button type="button" onClick={addItem}>
                                Adicionar
                            </Button>

                            <CameraScanButton continuous onScan={handleScan} size="default" />

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