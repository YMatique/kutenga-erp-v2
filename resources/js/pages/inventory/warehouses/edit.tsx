import { useForm, Head, Link } from '@inertiajs/react'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// 1. Definição da interface para garantir a tipagem estrita do modelo
interface Warehouse {
    id: number
    name: string
    code?: string
    address?: string
    description?: string
    is_default: boolean
    is_active: boolean
}

interface EditProps {
    warehouse: Warehouse
}

export default function Edit({ warehouse }: EditProps) {
    // 2. Estado inicial mapeado com base nas propriedades recebidas
    const { data, setData, put, processing, errors } = useForm({
        name: warehouse.name || '',
        code: warehouse.code || '',
        address: warehouse.address || '',
        description: warehouse.description || '',
        is_default: warehouse.is_default || false,
        is_active: warehouse.is_active ?? true,
    })

    function submit(e: React.FormEvent) {
        e.preventDefault()
        put(`/inventory/warehouses/${warehouse.id}`)
    }

    return (
        <>
            <Head title={`Editar Armazém - ${warehouse.name}`} />

            <div className="p-6 space-y-6 mx-auto">

                {/* HEADER */}
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                        Editar Armazém
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Atualize as informações do local de armazenamento selecionado
                    </p>
                </div>

                {/* FORM CARD */}
                <Card>
                    <CardHeader>
                        <CardTitle>Dados do Armazém</CardTitle>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={submit} className="space-y-5">

                            {/* GRID PRINCIPAL */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                {/* Nome */}
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nome *</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                    />
                                    {errors.name && (
                                        <p className="text-sm font-medium text-red-500">
                                            {errors.name}
                                        </p>
                                    )}
                                </div>

                                {/* Código */}
                                <div className="space-y-2">
                                    <Label htmlFor="code">Código</Label>
                                    <Input
                                        id="code"
                                        value={data.code}
                                        onChange={(e) => setData('code', e.target.value)}
                                    />
                                    {errors.code && (
                                        <p className="text-sm font-medium text-red-500">
                                            {errors.code}
                                        </p>
                                    )}
                                </div>

                            </div>

                            {/* ENDEREÇO */}
                            <div className="space-y-2">
                                <Label htmlFor="address">Endereço</Label>
                                <Input
                                    id="address"
                                    value={data.address}
                                    onChange={(e) => setData('address', e.target.value)}
                                />
                                {errors.address && (
                                    <p className="text-sm font-medium text-red-500">
                                        {errors.address}
                                    </p>
                                )}
                            </div>

                            {/* DESCRIÇÃO */}
                            <div className="space-y-2">
                                <Label htmlFor="description">Descrição</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                />
                                {errors.description && (
                                    <p className="text-sm font-medium text-red-500">
                                        {errors.description}
                                    </p>
                                )}
                            </div>

                            {/* SWITCHES */}
                            <div className="flex flex-col gap-4 pt-2">

                                <div className="flex items-center justify-between border-b pb-4">
                                    <div>
                                        <p className="font-medium text-sm">Armazém padrão</p>
                                        <p className="text-xs text-muted-foreground">
                                            Usado como principal no sistema
                                        </p>
                                    </div>

                                    <Switch
                                        checked={data.is_default}
                                        onCheckedChange={(val) => setData('is_default', val)}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-sm">Ativo</p>
                                        <p className="text-xs text-muted-foreground">
                                            Permite uso no sistema
                                        </p>
                                    </div>

                                    <Switch
                                        checked={data.is_active}
                                        onCheckedChange={(val) => setData('is_active', val)}
                                    />
                                </div>

                            </div>

                            {/* ACTIONS */}
                            <div className="flex justify-end gap-3 pt-4 border-t">

                                <Button
                                    type="button"
                                    variant="outline"
                                    asChild
                                >
                                    <Link href="/inventory/warehouses">
                                        Cancelar
                                    </Link>
                                </Button>

                                <Button
                                    type="submit"
                                    disabled={processing}
                                >
                                    {processing ? 'A atualizar...' : 'Atualizar'}
                                </Button>

                            </div>

                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    )
}