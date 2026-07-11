import { Head, useForm } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout';
import { Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

export default function Create({
    warehouses,
    products,
}: any) {

    const { data, setData, post, processing } = useForm({
        warehouse_id: '',
        reason: '',
        notes: '',
        items: [],
    })

    const addItem = () => {
        setData('items', [
            ...data.items,
            {
                product_id: '',
                old_quantity: 0,
                new_quantity: 0,
            },
        ])
    }

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

                            <Button
                                type="button"
                                variant="outline"
                                onClick={addItem}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Adicionar
                            </Button>

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

                                        <Select
                                            value={item.product_id}
                                            onValueChange={(v) =>
                                                updateItem(
                                                    index,
                                                    'product_id',
                                                    v
                                                )
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Produto" />
                                            </SelectTrigger>

                                            <SelectContent>

                                                {products.map(
                                                    (p: any) => (
                                                        <SelectItem
                                                            key={p.id}
                                                            value={String(
                                                                p.id
                                                            )}
                                                        >
                                                            {p.name}
                                                        </SelectItem>
                                                    )
                                                )}

                                            </SelectContent>

                                        </Select>

                                    </div>

                                    <div className="col-span-3">

                                        <Label>
                                            Novo Stock
                                        </Label>

                                        <Input
                                            type="number"
                                            min="0"
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