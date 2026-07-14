import { Head, useForm } from '@inertiajs/react';
import { Loader2, Plus, Trash2, ImagePlus } from 'lucide-react';
import { useState } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { BellRing } from 'lucide-react';

export default function CompanySettings({ company }: { company: any }) {
    const [logoPreview, setLogoPreview] = useState<string | null>(company.logo_path ? `/storage/${company.logo_path}` : null);
    const [stampPreview, setStampPreview] = useState<string | null>(company.stamp_path ? `/storage/${company.stamp_path}` : null);

    const { data, setData, post, processing, errors, recentlySuccessful } = useForm({
        name: company.name || '',
        nuit: company.nuit || '',
        email: company.email || '',
        phone: company.phone || '',
        address: company.address || '',
        default_tax_rate: company.default_tax_rate || '',
        default_currency: company.default_currency || 'MZN',
        default_due_days: company.default_due_days || 30,
        invoice_prefix: company.invoice_prefix || 'FT',
        quote_prefix: company.quote_prefix || 'CT',
        receipt_prefix: company.receipt_prefix || 'FR',
        bank_accounts: company.bank_accounts || [],
        smtp_host: company.smtp_host || '',
        smtp_port: company.smtp_port || '',
        smtp_username: company.smtp_username || '',
        smtp_password: company.smtp_password || '',
        smtp_encryption: company.smtp_encryption || '',
        logo: null as File | null,
        stamp: null as File | null,
        notify_low_stock_email: company.notify_low_stock_email ?? true,
        notify_subscription_email: company.notify_subscription_email ?? true,
        notify_document_emission_email: company.notify_document_emission_email ?? true,
        notify_payment_received_email: company.notify_payment_received_email ?? true,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
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

    const addBankAccount = () => {
        setData('bank_accounts', [...data.bank_accounts, { bank_name: '', account_number: '', iban: '' }]);
    };

    const removeBankAccount = (index: number) => {
        const newBanks = [...data.bank_accounts];
        newBanks.splice(index, 1);
        setData('bank_accounts', newBanks);
    };

    const updateBankAccount = (index: number, field: string, value: string) => {
        const newBanks = [...data.bank_accounts];
        newBanks[index] = { ...newBanks[index], [field]: value };
        setData('bank_accounts', newBanks);
    };

    return (
        <>
            <Head title="Configurações da Empresa" />

            <div className="space-y-4">
                <form onSubmit={submit} className="space-y-8">
                    <Tabs defaultValue="geral" className="w-full">
                        <TabsList className="grid w-full grid-cols-4 mb-8">
                            <TabsTrigger value="geral">Geral & Identidade</TabsTrigger>
                            <TabsTrigger value="faturacao">Faturação & Pagamentos</TabsTrigger>
                            <TabsTrigger value="smtp">Servidor de Email</TabsTrigger>
                            <TabsTrigger value="notificacoes">Notificações</TabsTrigger>
                        </TabsList>

                        <TabsContent value="geral" className="space-y-6">
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

                                <div className="grid gap-2 sm:col-span-2">
                                    <Label htmlFor="phone">Telefone</Label>
                                    <Input
                                        id="phone"
                                        value={data.phone}
                                        onChange={(e) => setData('phone', e.target.value)}
                                        placeholder="Ex: +258 84 000 0000"
                                    />
                                    <InputError message={errors.phone} />
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

                            <div className="w-full h-px bg-slate-200 my-6" />

                            <Heading
                                variant="small"
                                title="Identidade Visual"
                                description="Logotipo e Carimbo/Assinatura."
                            />

                            <div className="grid gap-8 sm:grid-cols-2">
                                <div className="flex items-start gap-4">
                                    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center group hover:border-[#2DB8A0] hover:bg-[#2DB8A0]/5 transition-all">
                                        {logoPreview ? (
                                            <img src={logoPreview} alt="Logo" className="h-full w-full object-contain p-2" />
                                        ) : (
                                            <ImagePlus className="h-8 w-8 text-slate-400 group-hover:text-[#2DB8A0] transition-colors" />
                                        )}
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-white text-xs font-medium">Alterar</span>
                                        </div>
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];

                                                if (file) {
                                                    setData('logo', file);
                                                    setLogoPreview(URL.createObjectURL(file));
                                                }
                                            }}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-base">Logotipo da Empresa</Label>
                                        <p className="text-sm text-slate-500">Recomendado: Fundo transparente, formato PNG. Máximo 2MB.</p>
                                        <InputError message={errors.logo} />
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center group hover:border-[#2DB8A0] hover:bg-[#2DB8A0]/5 transition-all">
                                        {stampPreview ? (
                                            <img src={stampPreview} alt="Stamp" className="h-full w-full object-contain p-2" />
                                        ) : (
                                            <ImagePlus className="h-8 w-8 text-slate-400 group-hover:text-[#2DB8A0] transition-colors" />
                                        )}
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-white text-xs font-medium">Alterar</span>
                                        </div>
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];

                                                if (file) {
                                                    setData('stamp', file);
                                                    setStampPreview(URL.createObjectURL(file));
                                                }
                                            }}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-base">Carimbo / Assinatura</Label>
                                        <p className="text-sm text-slate-500">Usado para assinar faturas digitalmente. Fundo transparente, PNG. Máximo 2MB.</p>
                                        <InputError message={errors.stamp} />
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="faturacao" className="space-y-6">
                            <Heading
                                variant="small"
                                title="Configurações de Faturação"
                                description="Moeda, impostos e prefixos dos documentos comerciais."
                            />

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="default_currency">Moeda Padrão</Label>
                                    <Input
                                        id="default_currency"
                                        value={data.default_currency}
                                        onChange={(e) => setData('default_currency', e.target.value)}
                                        placeholder="Ex: MZN"
                                        maxLength={3}
                                    />
                                    <InputError message={errors.default_currency} />
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

                                <div className="grid gap-2">
                                    <Label htmlFor="default_due_days">Prazo de Vencimento (Dias)</Label>
                                    <Input
                                        id="default_due_days"
                                        type="number"
                                        value={data.default_due_days}
                                        onChange={(e) => setData('default_due_days', e.target.value)}
                                        placeholder="Ex: 30"
                                    />
                                    <InputError message={errors.default_due_days} />
                                </div>
                            </div>

                            <div className="w-full h-px bg-slate-200 my-6" />

                            <Heading
                                variant="small"
                                title="Prefixos de Documentos"
                                description="Usados para gerar a numeração (Ex: se prefixo for FT, fatura será FT-2026/01)."
                            />
                            
                            <div className="grid gap-4 sm:grid-cols-3">
                                <div className="grid gap-2">
                                    <Label htmlFor="invoice_prefix">Faturas</Label>
                                    <Input
                                        id="invoice_prefix"
                                        value={data.invoice_prefix}
                                        onChange={(e) => setData('invoice_prefix', e.target.value)}
                                        placeholder="FT"
                                    />
                                    <InputError message={errors.invoice_prefix} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="quote_prefix">Cotações</Label>
                                    <Input
                                        id="quote_prefix"
                                        value={data.quote_prefix}
                                        onChange={(e) => setData('quote_prefix', e.target.value)}
                                        placeholder="CT"
                                    />
                                    <InputError message={errors.quote_prefix} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="receipt_prefix">Recibos</Label>
                                    <Input
                                        id="receipt_prefix"
                                        value={data.receipt_prefix}
                                        onChange={(e) => setData('receipt_prefix', e.target.value)}
                                        placeholder="FR"
                                    />
                                    <InputError message={errors.receipt_prefix} />
                                </div>
                            </div>

                            <div className="w-full h-px bg-slate-200 my-6" />

                            <div className="flex items-center justify-between">
                                <Heading
                                    variant="small"
                                    title="Contas Bancárias"
                                    description="Contas que irão aparecer no rodapé das faturas."
                                />
                                <Button type="button" variant="outline" size="sm" onClick={addBankAccount} className="gap-2">
                                    <Plus className="h-4 w-4" />
                                    Adicionar Conta
                                </Button>
                            </div>

                            <div className="space-y-4">
                                {data.bank_accounts.length === 0 && (
                                    <p className="text-sm text-slate-500 italic">Nenhuma conta bancária adicionada.</p>
                                )}
                                
                                {data.bank_accounts.map((bank: any, index: number) => (
                                    <div key={index} className="flex items-start gap-4 p-4 border rounded-lg bg-slate-50">
                                        <div className="grid gap-4 flex-1 sm:grid-cols-3">
                                            <div className="grid gap-2">
                                                <Label>Banco</Label>
                                                <Input 
                                                    value={bank.bank_name} 
                                                    onChange={(e) => updateBankAccount(index, 'bank_name', e.target.value)}
                                                    placeholder="Ex: BCI" 
                                                    required
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Número da Conta</Label>
                                                <Input 
                                                    value={bank.account_number} 
                                                    onChange={(e) => updateBankAccount(index, 'account_number', e.target.value)}
                                                    placeholder="Ex: 00000000001"
                                                    required
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>IBAN / NIB (Opcional)</Label>
                                                <Input 
                                                    value={bank.iban} 
                                                    onChange={(e) => updateBankAccount(index, 'iban', e.target.value)}
                                                    placeholder="Ex: MZ59 0008..." 
                                                />
                                            </div>
                                        </div>
                                        <Button 
                                            type="button" 
                                            variant="ghost" 
                                            size="icon" 
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 mt-6"
                                            onClick={() => removeBankAccount(index)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>

                        <TabsContent value="smtp" className="space-y-6">
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

                            <div className="flex items-center justify-start mt-4">
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
                            </div>
                        </TabsContent>

                        <TabsContent value="notificacoes" className="space-y-6">
                            <Heading
                                variant="small"
                                title="Configurações de Notificações"
                                description="Escolha os canais e eventos para receber notificações por email."
                            />

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/30">
                                    <div className="space-y-0.5">
                                        <Label className="text-base flex items-center gap-2">
                                            <BellRing className="h-4 w-4 text-[#2DB8A0]" />
                                            Alertas de Stock Baixo por Email
                                        </Label>
                                        <p className="text-sm text-muted-foreground">
                                            Receba um email automático diariamente ou sempre que um produto atingir o limite mínimo de stock.
                                        </p>
                                    </div>
                                    <Switch
                                        checked={data.notify_low_stock_email}
                                        onCheckedChange={(checked) => setData('notify_low_stock_email', checked)}
                                    />
                                </div>

                                <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/30">
                                    <div className="space-y-0.5">
                                        <Label className="text-base flex items-center gap-2">
                                            <BellRing className="h-4 w-4 text-amber-500" />
                                            Notificações de Subscrição e Limites
                                        </Label>
                                        <p className="text-sm text-muted-foreground">
                                            Receba alertas de faturamento, expiração de planos e avisos sobre limites de uso atingidos.
                                        </p>
                                    </div>
                                    <Switch
                                        checked={data.notify_subscription_email}
                                        onCheckedChange={(checked) => setData('notify_subscription_email', checked)}
                                    />
                                </div>

                                <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/30">
                                    <div className="space-y-0.5">
                                        <Label className="text-base flex items-center gap-2">
                                            <BellRing className="h-4 w-4 text-blue-500" />
                                            Envio Automático de Documentos ao Cliente
                                        </Label>
                                        <p className="text-sm text-muted-foreground">
                                            Envie automaticamente um email com o PDF da fatura ou recibo ao cliente assim que for confirmada.
                                        </p>
                                    </div>
                                    <Switch
                                        checked={data.notify_document_emission_email}
                                        onCheckedChange={(checked) => setData('notify_document_emission_email', checked)}
                                    />
                                </div>

                                <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/30">
                                    <div className="space-y-0.5">
                                        <Label className="text-base flex items-center gap-2">
                                            <BellRing className="h-4 w-4 text-emerald-500" />
                                            Envio Automático de Confirmação de Pagamento
                                        </Label>
                                        <p className="text-sm text-muted-foreground">
                                            Envie automaticamente uma confirmação de liquidação ao cliente sempre que uma fatura for paga.
                                        </p>
                                    </div>
                                    <Switch
                                        checked={data.notify_payment_received_email}
                                        onCheckedChange={(checked) => setData('notify_payment_received_email', checked)}
                                    />
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>

                    <div className="flex items-center justify-end mt-8 pt-4 border-t border-slate-200">
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
        </>
    );
}
