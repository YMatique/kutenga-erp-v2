import { useForm, Head, Link } from '@inertiajs/react'
import { PrimaryButton } from '@/components/ui/brand'
import { Input } from '@/components/ui/input'

import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils'

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

            <div className="flex flex-col gap-6 ">

                {/* Header */}
                <div>
                    <h1 className="text-[18px] font-semibold text-slate-900 leading-tight">
                        Editar Armazém
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Atualize as informações do local de armazenamento selecionado
                    </p>
                </div>

                {/* Form Card */}
                <div className="bg-white border border-slate-200 rounded-[4px] shadow-xs">

                    {/* Card section heading */}
                    <div className="px-6 py-4 border-b border-slate-100">
                        <h2 className="text-[13px] font-semibold text-slate-700 uppercase tracking-wide">
                            Dados do Armazém
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">{warehouse.name}</p>
                    </div>

                    <div className="p-6">
                        <form onSubmit={submit} className="space-y-5">

                            {/* Nome + Código */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                {/* Nome */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="name" className="text-sm font-medium text-slate-700">
                                        Nome <span className="text-red-400">*</span>
                                    </Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className="border border-slate-200 rounded-[4px] focus:ring-1 focus:ring-[#2DB8A0] focus:border-[#2DB8A0] h-10"
                                    />
                                    {errors.name && (
                                        <p className="text-xs font-medium text-red-500">{errors.name}</p>
                                    )}
                                </div>

                                {/* Código */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="code" className="text-sm font-medium text-slate-700">
                                        Código
                                    </Label>
                                    <Input
                                        id="code"
                                        value={data.code}
                                        onChange={(e) => setData('code', e.target.value)}
                                        className="border border-slate-200 rounded-[4px] focus:ring-1 focus:ring-[#2DB8A0] focus:border-[#2DB8A0] h-10"
                                    />
                                    {errors.code && (
                                        <p className="text-xs font-medium text-red-500">{errors.code}</p>
                                    )}
                                </div>

                            </div>

                            {/* Endereço */}
                            <div className="space-y-1.5">
                                <Label htmlFor="address" className="text-sm font-medium text-slate-700">
                                    Endereço
                                </Label>
                                <Input
                                    id="address"
                                    value={data.address}
                                    onChange={(e) => setData('address', e.target.value)}
                                    placeholder="Rua, Bairro, Cidade..."
                                    className="border border-slate-200 rounded-[4px] focus:ring-1 focus:ring-[#2DB8A0] focus:border-[#2DB8A0] h-10"
                                />
                                {errors.address && (
                                    <p className="text-xs font-medium text-red-500">{errors.address}</p>
                                )}
                            </div>

                            {/* Descrição */}
                            <div className="space-y-1.5">
                                <Label htmlFor="description" className="text-sm font-medium text-slate-700">
                                    Descrição
                                </Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Informações adicionais sobre este armazém..."
                                    className="border border-slate-200 rounded-[4px] focus:ring-1 focus:ring-[#2DB8A0] focus:border-[#2DB8A0] min-h-[80px] text-sm"
                                />
                                {errors.description && (
                                    <p className="text-xs font-medium text-red-500">{errors.description}</p>
                                )}
                            </div>

                            {/* Switches */}
                            <div className="border-t border-slate-100 pt-4 space-y-3">

                                {/* Armazém padrão */}
                                <div className="flex items-center justify-between py-2 px-3 rounded-[4px] bg-slate-50 border border-slate-100">
                                    <div>
                                        <p className="text-sm font-medium text-slate-800">Armazém padrão</p>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Usado como principal no sistema
                                        </p>
                                    </div>
                                    <Switch
                                        checked={data.is_default}
                                        onCheckedChange={(val) => setData('is_default', val)}
                                    />
                                </div>

                                {/* Ativo */}
                                <div className="flex items-center justify-between py-2 px-3 rounded-[4px] bg-slate-50 border border-slate-100">
                                    <div>
                                        <p className="text-sm font-medium text-slate-800">Ativo</p>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Permite uso no sistema
                                        </p>
                                    </div>
                                    <Switch
                                        checked={data.is_active}
                                        onCheckedChange={(val) => setData('is_active', val)}
                                    />
                                </div>

                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                                <Link
                                    href="/inventory/warehouses"
                                    className={cn(
                                        'inline-flex items-center gap-1.5 h-9 px-3.5 text-sm font-medium',
                                        'border border-slate-200 bg-white text-slate-700 rounded-[4px]',
                                        'hover:bg-slate-50 hover:border-slate-300 transition-colors',
                                    )}
                                >
                                    Cancelar
                                </Link>

                                <PrimaryButton
                                    type="submit"
                                    className={processing ? 'opacity-60 cursor-not-allowed' : ''}
                                >
                                    {processing ? 'A atualizar...' : 'Atualizar'}
                                </PrimaryButton>
                            </div>

                        </form>
                    </div>
                </div>
            </div>
        </>
    )
}

Edit.layout = (page: any) => (
    <AppLayout breadcrumbs={[
        { title: 'Inventário', href: '#' },
        { title: 'Armazéns', href: '/inventory/warehouses' },
        { title: `Editar: ${page.props?.warehouse?.name ?? ''}`, href: '#' },
    ]}>
        {page}
    </AppLayout>
);