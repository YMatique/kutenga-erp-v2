import { Head, useForm } from '@inertiajs/react'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { CameraScanButton } from '@/components/camera-scanner'
import { ProductPicker } from '@/components/product-picker'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

import { useBarcodeScanner } from '@/hooks/use-barcode-scanner'
import AppLayout from '@/layouts/app-layout';
import { findProductByCode } from '@/lib/product-search'
import type { PickedProduct } from '@/lib/product-search'
import { beepError, beepSuccess } from '@/lib/scan-feedback'

type Item = {
    product_id: string
    name: string
    old_quantity: number
    new_quantity: number
    // Do produto escolhido: se a unidade aceita decimais e o stock que havia no armazém ao escolhê-lo
    allow_decimals: boolean
    current: number | null
    current_warehouse: string
}

// Os produtos não vêm com a página: o seletor pesquisa-os no servidor, já com o stock do armazém
export default function Create({
    warehouses,
}: any) {

    const { data, setData, post, processing } = useForm({
        warehouse_id: '',
        reason: '',
        notes: '',
        items: [] as Item[],
    })

    const addItem = () => {
        setData('items', [
            ...data.items,
            {
                product_id: '',
                name: '',
                old_quantity: 0,
                new_quantity: 0,
                allow_decimals: true,
                current: null,
                current_warehouse: '',
            },
        ])
    }

    const fromProduct = (product: PickedProduct, warehouseId: string): Partial<Item> => ({
        product_id: String(product.id),
        name: product.name,
        allow_decimals: product.allow_decimals,
        current: product.stock,
        current_warehouse: warehouseId,
    })

    // Cada leitura soma 1 à contagem do produto (cria a linha se ainda não existir)
    const handleScan = async (code: string) => {
        let product: PickedProduct | null = null

        try {
            product = await findProductByCode(code, { warehouseId: data.warehouse_id })
        } catch {
            toast.error('Falha ao consultar o código. Verifique a ligação.')

            return
        }

        if (!product) {
            beepError()
            toast.error(`Código ${code} não encontrado entre os produtos com controlo de stock.`)

            return
        }

        const found = product

        // A leitura é assíncrona: parte do estado mais recente, não do que havia ao ler
        setData((previous: any) => {
            const id = String(found.id)
            const index = previous.items.findIndex((i: any) => i.product_id === id)

            if (index >= 0) {
                const items = [...previous.items]
                items[index] = { ...items[index], new_quantity: (Number(items[index].new_quantity) || 0) + 1 }

                return { ...previous, items }
            }

            return {
                ...previous,
                items: [...previous.items, { old_quantity: 0, new_quantity: 1, ...fromProduct(found, previous.warehouse_id) }],
            }
        })

        beepSuccess()
        toast.success(found.name, { duration: 1200 })
    }

    useBarcodeScanner({ onScan: handleScan })

    const removeItem = (index: number) => {
        setData(
            'items',
            data.items.filter((_: any, i: number) => i !== index)
        )
    }

    const updateItem = (
        index: number,
        field: string,
        value: any
    ) => {
        const items = [...data.items]

        items[index] = {
            ...items[index],
            [field]: value,
        }

        setData('items', items)
    }

    function submit(e: React.FormEvent) {
        e.preventDefault()

        post('/inventory/adjustments')
    }

    return (
        <>
            <Head title="Novo Ajuste" />

            <div className=" space-y-4">

                <div>
                    <h1 className="text-2xl font-semibold">
                        Novo Ajuste de Stock
                    </h1>

                    <p className="text-sm text-muted-foreground">
                        Corrija diferenças de inventário.
                    </p>
                </div>

                <form
                    onSubmit={submit}
                    className="space-y-6"
                >

                    <Card className="p-6 space-y-4">

                        <div>
                            <Label>
                                Armazém
                            </Label>

                            <Select
                                value={data.warehouse_id}
                                onValueChange={(v) =>
                                    setData('warehouse_id', v)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecionar armazém" />
                                </SelectTrigger>

                                <SelectContent>

                                    {warehouses.map((w: any) => (
                                        <SelectItem
                                            key={w.id}
                                            value={String(w.id)}
                                        >
                                            {w.name}
                                        </SelectItem>
                                    ))}

                                </SelectContent>
                            </Select>

                        </div>

                        <div>

                            <Label>
                                Motivo
                            </Label>

                            <Select
                                value={data.reason}
                                onValueChange={(v) =>
                                    setData('reason', v)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Motivo" />
                                </SelectTrigger>

                                <SelectContent>

                                    <SelectItem value="physical_count">
                                        Contagem Física
                                    </SelectItem>

                                    <SelectItem value="damaged">
                                        Produto Danificado
                                    </SelectItem>

                                    <SelectItem value="loss">
                                        Perda
                                    </SelectItem>

                                    <SelectItem value="correction">
                                        Correção
                                    </SelectItem>

                                    <SelectItem value="other">
                                        Outro
                                    </SelectItem>

                                </SelectContent>

                            </Select>

                        </div>

                        <div>

                            <Label>
                                Observações
                            </Label>

                            <Textarea
                                value={data.notes}
                                onChange={(e) =>
                                    setData(
                                        'notes',
                                        e.target.value
                                    )
                                }
                            />

                        </div>

                    </Card>

                    <Card className="p-6 space-y-4">

                        <div className="flex justify-between items-center">

                            <h2 className="font-medium">
                                Produtos
                            </h2>

                            <div className="flex gap-2">
                                <CameraScanButton continuous onScan={handleScan} size="default" />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={addItem}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Adicionar
                                </Button>
                            </div>

                        </div>

                        {data.items.map(
                            (item: any, index: number) => (
                                <div
                                    key={index}
                                    className="grid grid-cols-12 gap-3 border rounded-lg p-4"
                                >

                                    <div className="col-span-5">

                                        <Label>
                                            Produto
                                        </Label>

                                        <ProductPicker
                                            value={item.product_id ? { name: item.name } : null}
                                            warehouseId={data.warehouse_id}
                                            placeholder="Pesquisar produto..."
                                            onSelect={(p) => {
                                                const items = [...data.items]
                                                items[index] = { ...items[index], ...fromProduct(p, data.warehouse_id) }
                                                setData('items', items)
                                            }}
                                        />

                                        {/* O stock que havia no armazém ao escolher o produto, para se ver o que se está a corrigir */}
                                        {item.current !== null && item.current_warehouse === data.warehouse_id && (
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                Stock atual: {Number(item.current).toLocaleString('pt-MZ', { maximumFractionDigits: 3 })}
                                            </p>
                                        )}

                                    </div>

                                    <div className="col-span-3">

                                        <Label>
                                            Novo Stock
                                        </Label>

                                        <Input
                                            type="number"
                                            min="0"
                                            step={item.allow_decimals === false ? '1' : '0.001'}
                                            value={
                                                item.new_quantity
                                            }
                                            onChange={(e) =>
                                                updateItem(
                                                    index,
                                                    'new_quantity',
                                                    e.target.value
                                                )
                                            }
                                        />

                                    </div>

                                    <div className="col-span-2 flex items-end">

                                        <Button
                                            type="button"
                                            variant="destructive"
                                            onClick={() =>
                                                removeItem(index)
                                            }
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>

                                    </div>

                                </div>
                            )
                        )}

                    </Card>

                    <div className="flex justify-end">

                        <Button
                            type="submit"
                            disabled={processing}
                        >
                            Guardar Ajuste
                        </Button>

                    </div>

                </form>

            </div>
        </>
    )
}

Create.layout = (page: any) => (
    <AppLayout breadcrumbs={[
        { title: 'Inventário', href: '#' },
        { title: 'Ajustes de Stock', href: '/inventory/adjustments' },
        { title: 'Criar Ajuste', href: '#' },
    ]}>
        {page}
    </AppLayout>
);