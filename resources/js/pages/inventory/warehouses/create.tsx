import { useForm, Link } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout';

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { PrimaryButton, OutlineButton } from '@/components/ui/brand'
import { cn } from '@/lib/utils'

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
        <div className="flex flex-col gap-6 p-6">

            {/* Header */}
            <div>
                <h1 className="text-[18px] font-semibold text-slate-900 leading-tight">
                    Criar Armazém
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">
                    Registe um novo local de armazenamento
                </p>
            </div>

            {/* Form Card */}
            <div className="bg-white border border-slate-200 rounded-[4px] shadow-xs">

                {/* Card section heading */}
                <div className="px-6 py-4 border-b border-slate-100">
                    <h2 className="text-[13px] font-semibold text-slate-700 uppercase tracking-wide">
                        Dados do Armazém
                    </h2>
                </div>

                <div className="p-6">
                    <form onSubmit={submit} className="space-y-5">

                        {/* Nome + Código */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                            <div className="space-y-1.5">
                                <Label htmlFor="name" className="text-sm font-medium text-slate-700">
                                    Nome <span className="text-red-400">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Ex: Armazém Central"
                                    className="border border-slate-200 rounded-[4px] focus:ring-1 focus:ring-[#2DB8A0] focus:border-[#2DB8A0] h-10"
                                />
                                {errors.name && (
                                    <p className="text-xs text-red-500">{errors.name}</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="code" className="text-sm font-medium text-slate-700">
                                    Código
                                </Label>
                                <Input
                                    id="code"
                                    value={data.code}
                                    onChange={(e) => setData('code', e.target.value)}
                                    placeholder="Ex: ARM-001"
                                    className="border border-slate-200 rounded-[4px] focus:ring-1 focus:ring-[#2DB8A0] focus:border-[#2DB8A0] h-10"
                                />
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
                        </div>

                        {/* Divider */}
                        <div className="border-t border-slate-100 pt-4 space-y-4">

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
                                {processing ? 'A guardar...' : 'Guardar'}
                            </PrimaryButton>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    )
}

Create.layout = (page: any) => (
    <AppLayout breadcrumbs={[
        { title: 'Inventário', href: '#' },
        { title: 'Armazéns', href: '/inventory/warehouses' },
        { title: 'Criar Armazém', href: '#' },
    ]}>
        {page}
    </AppLayout>
);