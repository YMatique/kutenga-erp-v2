import { useForm, Link } from '@inertiajs/react'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function Create() {

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        code: '',
        address: '',
        description: '',
        is_default: false,
        is_active: true,
    })

    function submit(e: any) {
        e.preventDefault()
        post('/inventory/warehouses')
    }

    return (
        <div className="p-6 space-y-6">

            {/* HEADER */}
            <div>
                <h1 className="text-2xl font-semibold">
                    Criar Armazém
                </h1>
                <p className="text-sm text-muted-foreground">
                    Registe um novo local de armazenamento
                </p>
            </div>

            {/* FORM CARD */}
            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle>Dados do Armazém</CardTitle>
                </CardHeader>

                <CardContent>
                    <form onSubmit={submit} className="space-y-5">

                        {/* GRID PRINCIPAL */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                            {/* Nome */}
                            <div className="space-y-2">
                                <Label>Nome *</Label>
                                <Input
                                    value={data.name}
                                    onChange={(e) =>
                                        setData('name', e.target.value)
                                    }
                                />
                                {errors.name && (
                                    <p className="text-sm text-red-500">
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            {/* Código */}
                            <div className="space-y-2">
                                <Label>Código</Label>
                                <Input
                                    value={data.code}
                                    onChange={(e) =>
                                        setData('code', e.target.value)
                                    }
                                />
                            </div>

                        </div>

                        {/* ENDEREÇO */}
                        <div className="space-y-2">
                            <Label>Endereço</Label>
                            <Input
                                value={data.address}
                                onChange={(e) =>
                                    setData('address', e.target.value)
                                }
                            />
                        </div>

                        {/* DESCRIÇÃO */}
                        <div className="space-y-2">
                            <Label>Descrição</Label>
                            <Textarea
                                value={data.description}
                                onChange={(e) =>
                                    setData('description', e.target.value)
                                }
                            />
                        </div>

                        {/* SWITCHES */}
                        <div className="flex flex-col gap-4 pt-2">

                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Armazém padrão</p>
                                    <p className="text-sm text-muted-foreground">
                                        Usado como principal no sistema
                                    </p>
                                </div>

                                <Switch
                                    checked={data.is_default}
                                    onCheckedChange={(val) =>
                                        setData('is_default', val)
                                    }
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Ativo</p>
                                    <p className="text-sm text-muted-foreground">
                                        Permite uso no sistema
                                    </p>
                                </div>

                                <Switch
                                    checked={data.is_active}
                                    onCheckedChange={(val) =>
                                        setData('is_active', val)
                                    }
                                />
                            </div>

                        </div>

                        {/* ACTIONS */}
                        <div className="flex justify-end gap-3 pt-4">

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
                                {processing ? 'A guardar...' : 'Guardar'}
                            </Button>

                        </div>

                    </form>
                </CardContent>
            </Card>
        </div>
    )
}