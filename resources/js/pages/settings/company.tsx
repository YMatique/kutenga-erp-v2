import { Head, useForm } from '@inertiajs/react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import InputError from '@/components/input-error';
import SettingsLayout from '@/layouts/settings/layout';
import { Loader2 } from 'lucide-react';

export default function CompanySettings({ company }: { company: any }) {
    const { data, setData, post, processing, errors, recentlySuccessful } = useForm({
        name: company.name || '',
        nuit: company.nuit || '',
        email: company.email || '',
        phone: company.phone || '',
        address: company.address || '',
        default_tax_rate: company.default_tax_rate || '',
        smtp_host: company.smtp_host || '',
        smtp_port: company.smtp_port || '',
        smtp_username: company.smtp_username || '',
        smtp_password: company.smtp_password || '',
        smtp_encryption: company.smtp_encryption || '',
        logo: null as File | null,
        stamp: null as File | null,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        // Since we have files, we must use POST to send FormData. Inertia transforms it.
        post('/settings/company', {
            preserveScroll: true,
            forceFormData: true,
        });
    };

    const { post: postSmtp, processing: testingSmtp } = useForm({
        smtp_host: data.smtp_host,
        smtp_port: data.smtp_port,
        smtp_username: data.smtp_username,
        smtp_password: data.smtp_password,
        smtp_encryption: data.smtp_encryption,
    });

    const handleTestSmtp = () => {
        postSmtp('/settings/company/test-smtp', {
            preserveScroll: true,
        });
    };

    return (
        <SettingsLayout>
            <Head title="Configurações da Empresa" />

            <div className="space-y-10">
                <form onSubmit={submit} className="space-y-8">
                    {/* General Info */}
                    <div className="space-y-6">
                        <Heading
                            variant="small"
                            title="Dados da Empresa"
                            description="Informações gerais que aparecerão nos documentos fiscais."
                        />

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2 sm:col-span-2">
                                <Label htmlFor="name">Nome da Empresa</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Ex: Kutenga Lda"
                                    required
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="nuit">NUIT</Label>
                                <Input
                                    id="nuit"
                                    value={data.nuit}
                                    onChange={(e) => setData('nuit', e.target.value)}
                                    placeholder="Ex: 400000000"
                                />
                                <InputError message={errors.nuit} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">E-mail Comercial</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="Ex: comercial@empresa.com"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="phone">Telefone</Label>
                                <Input
                                    id="phone"
                                    value={data.phone}
                                    onChange={(e) => setData('phone', e.target.value)}
                                    placeholder="Ex: +258 84 000 0000"
                                />
                                <InputError message={errors.phone} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="default_tax_rate">Taxa de Imposto Padrão (%)</Label>
                                <Input
                                    id="default_tax_rate"
                                    type="number"
                                    step="0.01"
                                    value={data.default_tax_rate}
                                    onChange={(e) => setData('default_tax_rate', e.target.value)}
                                    placeholder="Ex: 16"
                                />
                                <InputError message={errors.default_tax_rate} />
                            </div>

                            <div className="grid gap-2 sm:col-span-2">
                                <Label htmlFor="address">Morada Completa</Label>
                                <Textarea
                                    id="address"
                                    value={data.address}
                                    onChange={(e) => setData('address', e.target.value)}
                                    placeholder="Morada da Sede"
                                />
                                <InputError message={errors.address} />
                            </div>
                        </div>
                    </div>

                    <div className="w-full h-px bg-slate-200" />

                    {/* Branding */}
                    <div className="space-y-6">
                        <Heading
                            variant="small"
                            title="Identidade Visual"
                            description="Logotipo e Carimbo/Assinatura."
                        />

                        <div className="grid gap-6 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="logo">Logotipo</Label>
                                {company.logo_path && (
                                    <img src={`/storage/${company.logo_path}`} alt="Logo" className="h-16 object-contain mb-2 border p-1 rounded bg-white" />
                                )}
                                <Input
                                    id="logo"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setData('logo', e.target.files?.[0] || null)}
                                />
                                <InputError message={errors.logo} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="stamp">Carimbo / Assinatura</Label>
                                {company.stamp_path && (
                                    <img src={`/storage/${company.stamp_path}`} alt="Stamp" className="h-16 object-contain mb-2 border p-1 rounded bg-white" />
                                )}
                                <Input
                                    id="stamp"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setData('stamp', e.target.files?.[0] || null)}
                                />
                                <InputError message={errors.stamp} />
                            </div>
                        </div>
                    </div>

                    <div className="w-full h-px bg-slate-200" />

                    {/* SMTP Settings */}
                    <div className="space-y-6">
                        <Heading
                            variant="small"
                            title="Servidor de Email (SMTP)"
                            description="Configura as credenciais para enviar faturas diretamente com o domínio da tua empresa."
                        />

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="smtp_host">Host</Label>
                                <Input
                                    id="smtp_host"
                                    value={data.smtp_host}
                                    onChange={(e) => setData('smtp_host', e.target.value)}
                                    placeholder="Ex: smtp.mailtrap.io"
                                />
                                <InputError message={errors.smtp_host} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="smtp_port">Porta</Label>
                                <Input
                                    id="smtp_port"
                                    type="number"
                                    value={data.smtp_port}
                                    onChange={(e) => setData('smtp_port', e.target.value)}
                                    placeholder="Ex: 587"
                                />
                                <InputError message={errors.smtp_port} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="smtp_username">Utilizador</Label>
                                <Input
                                    id="smtp_username"
                                    value={data.smtp_username}
                                    onChange={(e) => setData('smtp_username', e.target.value)}
                                />
                                <InputError message={errors.smtp_username} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="smtp_password">Password</Label>
                                <Input
                                    id="smtp_password"
                                    type="password"
                                    value={data.smtp_password}
                                    onChange={(e) => setData('smtp_password', e.target.value)}
                                />
                                <InputError message={errors.smtp_password} />
                            </div>

                            <div className="grid gap-2 sm:col-span-2">
                                <Label htmlFor="smtp_encryption">Criptografia (tls, ssl)</Label>
                                <Input
                                    id="smtp_encryption"
                                    value={data.smtp_encryption}
                                    onChange={(e) => setData('smtp_encryption', e.target.value)}
                                    placeholder="Ex: tls"
                                />
                                <InputError message={errors.smtp_encryption} />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-200">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleTestSmtp}
                            disabled={testingSmtp}
                            className="gap-2 text-[#2DB8A0] border-[#2DB8A0] hover:bg-[#2DB8A0] hover:text-white transition-colors"
                        >
                            {testingSmtp && <Loader2 className="h-4 w-4 animate-spin" />}
                            Testar Conexão SMTP
                        </Button>

                        <div className="flex items-center gap-4">
                            {recentlySuccessful && (
                                <span className="text-sm text-emerald-600 font-medium">Gravado com sucesso!</span>
                            )}
                            <Button type="submit" disabled={processing} className="bg-[#2DB8A0] hover:bg-[#239B86]">
                                Gravar Alterações
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </SettingsLayout>
    );
}
