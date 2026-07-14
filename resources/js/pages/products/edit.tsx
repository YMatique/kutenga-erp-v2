import { Head, useForm, Link } from '@inertiajs/react';
import { 
    ArrowLeft, 
    Save, 
    Package, 
    Wrench, 
    Info, 
    DollarSign, 
    Layers,
    Plus,
    Image as ImageIcon,
    Upload,
    Trash2,
    BookOpen,
    Scale,
    BadgePercent,
    Coins
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { PrimaryButton, OutlineButton } from '@/components/ui/brand';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';

interface Category {
    id: number;
    name: string;
}

interface Unit {
    id: number;
    short_name: string;
    name: string;
}

interface Brand {
    id: number;
    name: string;
}

interface Product {
    id: number;
    name: string;
    category_id: number | null;
    unit_id: number | null;
    brand_id: number | null;
    sku: string | null;
    barcode: string | null;
    description: string | null;
    type: 'product' | 'service';
    track_stock: boolean;
    min_stock: string;
    weight: string | null;
    price: string;
    cost: string;
    tax_rate: string;
    tax_is_exempt: boolean;
    tax_exemption_reason: string | null;
    image_path: string | null;
    internal_notes: string | null;
}

interface Props {
    product: Product;
    categories: Category[];
    units: Unit[];
    brands: Brand[];
}

export default function ProductEdit({ product, categories, units, brands }: Props) {
    // Inicialização do formulário mantendo o spoofing de método PUT exigido para upload de arquivos
    const { data, setData, post, processing, errors } = useForm({
        _method: 'PUT',
        name: product.name,
        category_id: product.category_id?.toString() || '',
        unit_id: product.unit_id?.toString() || '',
        brand_id: product.brand_id?.toString() || '',
        sku: product.sku || '',
        barcode: product.barcode || '',
        description: product.description || '',
        type: product.type,
        track_stock: !!product.track_stock,
        min_stock: product.min_stock || '0',
        weight: product.weight || '',
        price: product.price,
        cost: product.cost,
        tax_rate: product.tax_rate?.toString() || '16',
        tax_is_exempt: !!product.tax_is_exempt,
        tax_exemption_reason: product.tax_exemption_reason || '',
        image: null as File | null,
        internal_notes: product.internal_notes || '',
    });

    const [imagePreview, setImagePreview] = useState<string | null>(product.image_path || null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (file) {
            setData('image', file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setData('image', null);
        setImagePreview(null);
        const fileInput = document.getElementById('product-image-upload') as HTMLInputElement;

        if (fileInput) {
fileInput.value = '';
}
    };

    // Estados para controlo de modais de criação rápida
    const [quickCreateCatOpen, setQuickCreateCatOpen] = useState(false);
    const [quickCreateBrandOpen, setQuickCreateBrandOpen] = useState(false);
    const [quickCreateUnitOpen, setQuickCreateUnitOpen] = useState(false);

    // Formulários auxiliares para ações rápidas
    const catForm = useForm({ name: '', parent_id: '' });
    const brandForm = useForm({ name: '' });
    const unitForm = useForm({ name: '', short_name: '' });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/products/${product.id}`, {
            onSuccess: () => toast.success('Item atualizado com sucesso!'),
        });
    };

    const submitQuickCat = (e: React.FormEvent) => {
        e.preventDefault();
        catForm.post('/categories', {
            onSuccess: () => {
                setQuickCreateCatOpen(false);
                catForm.reset();
                toast.success('Categoria adicionada com sucesso!');
            }
        });
    };

    const submitQuickBrand = (e: React.FormEvent) => {
        e.preventDefault();
        brandForm.post('/brands', {
            onSuccess: () => {
                setQuickCreateBrandOpen(false);
                brandForm.reset();
                toast.success('Marca adicionada com sucesso!');
            }
        });
    };

    const submitQuickUnit = (e: React.FormEvent) => {
        e.preventDefault();
        unitForm.post('/units', {
            onSuccess: () => {
                setQuickCreateUnitOpen(false);
                unitForm.reset();
                toast.success('Unidade de medida adicionada com sucesso!');
            }
        });
    };

    return (
        <>
            <Head title={`Editar - ${product.name}`} />

            <div className="space-y-4  mx-auto">
                
                {/* CABEÇALHO */}
                <div className="flex items-center gap-4 border-b pb-5">
                    <Button variant="outline" size="icon" className="rounded-full h-10 w-10 shrink-0 shadow-sm" asChild>
                        <Link href="/products">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                            Editar Item
                        </h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Atualize as informações operacionais e fiscais do item: <span className="font-semibold text-slate-800 dark:text-slate-200">{product.name}</span>
                        </p>
                    </div>
                </div>

                <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-16">
                    
                    {/* COLUNA PRINCIPAL (ESQUERDA) */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        
                        {/* INFORMAÇÕES BÁSICAS */}
                        <Card className="bg-white border border-slate-200 rounded-[4px] shadow-xs">
                            <CardHeader className="border-b py-4">
                                <div className="flex items-center gap-2 text-slate-800 dark:text-white">
                                    <BookOpen className="h-5 w-5 text-slate-500" />
                                    <div>
                                        <CardTitle className="text-base font-semibold">Informações Básicas</CardTitle>
                                        <CardDescription className="text-xs">Identificação principal do item no catálogo</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="grid gap-4 pt-5">
                                <div className="grid gap-2">
                                    <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                        Nome do Item *
                                    </Label>
                                    <Input 
                                        id="name" 
                                        value={data.name} 
                                        onChange={e => setData('name', e.target.value)} 
                                        placeholder="Ex: Teclado Mecânico RGB, Consultoria Técnica"
                                        className="h-10"
                                    />
                                    {errors.name && <p className="text-xs font-medium text-red-500">{errors.name}</p>}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="sku" className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                            SKU / Referência
                                        </Label>
                                        <Input 
                                            id="sku" 
                                            value={data.sku} 
                                            onChange={e => setData('sku', e.target.value)} 
                                            placeholder="Ex: TEC-001"
                                            className="h-10 font-mono"
                                        />
                                        {errors.sku && <p className="text-xs font-medium text-red-500">{errors.sku}</p>}
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="barcode" className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                            Código de Barras (EAN / UPC)
                                        </Label>
                                        <Input 
                                            id="barcode" 
                                            value={data.barcode} 
                                            onChange={e => setData('barcode', e.target.value)} 
                                            placeholder="Ex: 5601234567890"
                                            className="h-10 font-mono"
                                        />
                                        {errors.barcode && <p className="text-xs font-medium text-red-500">{errors.barcode}</p>}
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="description" className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                        Descrição Comercial (Exibida ao Cliente)
                                    </Label>
                                    <Textarea 
                                        id="description" 
                                        value={data.description} 
                                        onChange={e => setData('description', e.target.value)} 
                                        placeholder="Descreva as características técnicas, detalhes de garantia ou escopo do serviço..."
                                        className="min-h-[100px] resize-y"
                                    />
                                    {errors.description && <p className="text-xs font-medium text-red-500">{errors.description}</p>}
                                </div>
                            </CardContent>
                        </Card>

                        {/* GESTÃO E LOGÍSTICA */}
                        <Card className="shadow-sm border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                            <CardHeader className="border-b py-4">
                                <div className="flex items-center gap-2 text-slate-800 dark:text-white">
                                    <Scale className="h-5 w-5 text-slate-500" />
                                    <div>
                                        <CardTitle className="text-base font-semibold">Gestão e Logística</CardTitle>
                                        <CardDescription className="text-xs">Parâmetros de pesagem e rastreamento de stock</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="grid gap-6 pt-5">
                                {data.type === 'product' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="grid gap-4">
                                            <div className="flex items-center justify-between p-3 bg-slate-50/50 dark:bg-zinc-800/40 rounded-lg border">
                                                <div className="flex flex-col gap-0.5">
                                                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Rastrear Stock?</Label>
                                                    <span className="text-[10px] text-muted-foreground">Monitorizar quantidades disponíveis</span>
                                                </div>
                                                <Switch 
                                                    checked={data.track_stock}
                                                    onCheckedChange={(val) => setData('track_stock', val)}
                                                />
                                            </div>

                                            {data.track_stock && (
                                                <div className="grid gap-2">
                                                    <Label htmlFor="min_stock" className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                                        Stock Mínimo (Ponto de Encomenda)
                                                    </Label>
                                                    <Input 
                                                        id="min_stock" 
                                                        type="number"
                                                        min="0"
                                                        value={data.min_stock} 
                                                        onChange={e => setData('min_stock', e.target.value)} 
                                                        className="h-10 font-mono"
                                                    />
                                                    {errors.min_stock && <p className="text-xs font-medium text-red-500">{errors.min_stock}</p>}
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="weight" className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                                Peso Bruto (KG)
                                            </Label>
                                            <Input 
                                                id="weight" 
                                                type="number"
                                                step="0.001"
                                                min="0"
                                                value={data.weight} 
                                                onChange={e => setData('weight', e.target.value)} 
                                                placeholder="Ex: 0.500"
                                                className="h-10 font-mono"
                                            />
                                            {errors.weight && <p className="text-xs font-medium text-red-500">{errors.weight}</p>}
                                        </div>
                                    </div>
                                )}

                                <div className="grid gap-2">
                                    <Label htmlFor="internal_notes" className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                                        Notas Internas (Apenas Visível à Equipa)
                                    </Label>
                                    <Textarea 
                                        id="internal_notes" 
                                        value={data.internal_notes} 
                                        onChange={e => setData('internal_notes', e.target.value)} 
                                        placeholder="Insira detalhes privados do fornecedor, histórico de compras ou avisos de manuseamento..."
                                        className="min-h-[80px] bg-blue-50/10 dark:bg-blue-950/5 border-blue-100 dark:border-blue-900/40 focus:border-blue-500"
                                    />
                                    {errors.internal_notes && <p className="text-xs font-medium text-red-500">{errors.internal_notes}</p>}
                                </div>
                            </CardContent>
                        </Card>

                        {/* PRECIFICAÇÃO */}
                        <Card className="bg-white border border-slate-200 rounded-[4px] shadow-xs">
                            <CardHeader className="border-b py-4">
                                <div className="flex items-center gap-2 text-slate-800 dark:text-white">
                                    <Coins className="h-5 w-5 text-slate-500" />
                                    <div>
                                        <CardTitle className="text-base font-semibold">Valores e Custos</CardTitle>
                                        <CardDescription className="text-xs">Configure a margem e valores financeiros do item</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-5">
                                <div className="grid gap-2">
                                    <Label htmlFor="price" className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                        Preço de Venda (MZN)
                                    </Label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input 
                                            id="price" 
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={data.price} 
                                            onChange={e => setData('price', e.target.value)} 
                                            className="pl-8 h-10 font-mono"
                                        />
                                    </div>
                                    {errors.price && <p className="text-xs font-medium text-red-500">{errors.price}</p>}
                                </div>
                                
                                <div className="grid gap-2">
                                    <Label htmlFor="cost" className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                        Preço de Custo (MZN)
                                    </Label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input 
                                            id="cost" 
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={data.cost} 
                                            onChange={e => setData('cost', e.target.value)} 
                                            className="pl-8 h-10 font-mono"
                                        />
                                    </div>
                                    {errors.cost && <p className="text-xs font-medium text-red-500">{errors.cost}</p>}
                                </div>
                            </CardContent>
                        </Card>

                        {/* ENQUADRAMENTO FISCAL */}
                        <Card className="shadow-sm border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                            <CardHeader className="border-b py-4">
                                <div className="flex items-center gap-2 text-slate-800 dark:text-white">
                                    <BadgePercent className="h-5 w-5 text-slate-500" />
                                    <div>
                                        <CardTitle className="text-base font-semibold">Tributação e IVA</CardTitle>
                                        <CardDescription className="text-xs">Regras e enquadramentos fiscais para faturação</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="grid gap-4 pt-5">
                                <div className="flex items-center justify-between p-3 bg-slate-50/50 dark:bg-zinc-800/40 rounded-lg border">
                                    <div className="flex flex-col gap-0.5">
                                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Isento de Imposto (IVA)?</Label>
                                        <span className="text-[10px] text-muted-foreground">Ativar isenção fiscal nos moldes legais do CIVA</span>
                                    </div>
                                    <Switch 
                                        checked={data.tax_is_exempt}
                                        onCheckedChange={(checked) => {
                                            setData(prev => ({
                                                ...prev,
                                                tax_is_exempt: checked,
                                                tax_rate: checked ? '0' : '16',
                                                tax_exemption_reason: checked ? 'Artigo 9 do CIVA - Isenção de bens alimentares e saúde' : ''
                                            }));
                                        }}
                                    />
                                </div>

                                {!data.tax_is_exempt ? (
                                    <div className="grid gap-2">
                                        <Label htmlFor="tax_rate" className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                            Taxa de Imposto (IVA %)
                                        </Label>
                                        <Select 
                                            value={data.tax_rate} 
                                            onValueChange={val => setData('tax_rate', val)}
                                        >
                                            <SelectTrigger className="h-10">
                                                <SelectValue placeholder="Selecione a taxa de IVA..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="16">16% (IVA Normal - Moçambique)</SelectItem>
                                                <SelectItem value="17">17% (Regime Anterior / Especial)</SelectItem>
                                                <SelectItem value="0">0% (Isento / Transmissões Especiais)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {errors.tax_rate && <p className="text-xs font-medium text-red-500">{errors.tax_rate}</p>}
                                    </div>
                                ) : (
                                    <div className="grid gap-2">
                                        <Label htmlFor="tax_exemption_reason" className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                            Motivo Legal de Isenção *
                                        </Label>
                                        <Select 
                                            value={data.tax_exemption_reason} 
                                            onValueChange={val => setData('tax_exemption_reason', val)}
                                        >
                                            <SelectTrigger className="h-10">
                                                <SelectValue placeholder="Selecione o enquadramento legal da isenção..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Artigo 9 do CIVA - Isenção de bens alimentares e saúde">Artigo 9 do CIVA - Isenção de bens alimentares e saúde</SelectItem>
                                                <SelectItem value="Artigo 10 do CIVA - Operações financeiras e seguros">Artigo 10 do CIVA - Operações financeiras e seguros</SelectItem>
                                                <SelectItem value="Isenção por exportação de mercadorias">Isenção por exportação de mercadorias</SelectItem>
                                                <SelectItem value="Regime Simplificado - Sem IVA">Regime Simplificado - Sem IVA / Regime de Pequenos Contribuintes</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {errors.tax_exemption_reason && <p className="text-xs font-medium text-red-500">{errors.tax_exemption_reason}</p>}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* COLUNA LATERAL (DIREITA) */}
                    <div className="flex flex-col gap-6">
                        
                        {/* IMAGEM DO PRODUTO */}
                        <Card className="bg-white border border-slate-200 rounded-[4px] shadow-xs overflow-hidden">
                            <CardHeader className="border-b py-4">
                                <div className="flex items-center gap-2 text-slate-800 dark:text-white">
                                    <ImageIcon className="h-5 w-5 text-slate-500" />
                                    <div>
                                        <CardTitle className="text-base font-semibold">Imagem do Item</CardTitle>
                                        <CardDescription className="text-xs">Foto ou imagem representativa do item</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center justify-center pt-5">
                                {imagePreview ? (
                                    <div className="relative group w-full aspect-square max-h-[220px] rounded-lg overflow-hidden border border-zinc-200 bg-slate-50 dark:bg-zinc-950 flex items-center justify-center shadow-xs">
                                        <img 
                                            src={imagePreview} 
                                            alt="Preview" 
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Button 
                                                type="button" 
                                                variant="destructive" 
                                                size="icon"
                                                className="rounded-full h-10 w-10 shadow-lg"
                                                onClick={handleRemoveImage}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <label 
                                        htmlFor="product-image-upload"
                                        className="w-full aspect-square max-h-[220px] rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-400 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer bg-slate-50/50 dark:bg-zinc-950/20 p-4 text-center group"
                                    >
                                        <div className="p-3 bg-white dark:bg-zinc-800 rounded-full shadow-xs border border-zinc-200/50 group-hover:scale-105 transition-transform">
                                            <Upload className="h-5 w-5 text-slate-400 group-hover:text-blue-500" />
                                        </div>
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Carregar Foto</span>
                                            <span className="text-[10px] text-muted-foreground">PNG, JPG ou WEBP até 2MB</span>
                                        </div>
                                        <input 
                                            id="product-image-upload"
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleImageChange}
                                        />
                                    </label>
                                )}
                                {errors.image && <p className="text-xs font-medium text-red-500 mt-2">{errors.image}</p>}
                            </CardContent>
                        </Card>

                        {/* CLASSIFICAÇÃO */}
                        <Card className="bg-white border border-slate-200 rounded-[4px] shadow-xs">
                            <CardHeader className="border-b py-4">
                                <div className="flex items-center gap-2 text-slate-800 dark:text-white">
                                    <Layers className="h-5 w-5 text-slate-500" />
                                    <div>
                                        <CardTitle className="text-base font-semibold">Classificação</CardTitle>
                                        <CardDescription className="text-xs">Agrupamento e enquadramento interno</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="grid gap-4 pt-5">
                                <div className="grid gap-2">
                                    <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Tipo de Item</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button 
                                            type="button"
                                            variant={data.type === 'product' ? 'default' : 'outline'}
                                            className="gap-2 text-xs h-9"
                                            onClick={() => setData('type', 'product')}
                                        >
                                            <Package className="h-4 w-4" /> Produto
                                        </Button>
                                        <Button 
                                            type="button"
                                            variant={data.type === 'service' ? 'default' : 'outline'}
                                            className="gap-2 text-xs h-9"
                                            onClick={() => setData(prev => ({
                                                ...prev,
                                                type: 'service',
                                                track_stock: false,
                                                min_stock: '0',
                                                weight: '',
                                                brand_id: ''
                                            }))}
                                        >
                                            <Wrench className="h-4 w-4" /> Serviço
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="category" className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                            Categoria
                                        </Label>
                                        <Button 
                                            type="button" 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-6 px-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50/50"
                                            onClick={() => setQuickCreateCatOpen(true)}
                                        >
                                            <Plus className="h-3.5 w-3.5 mr-1" /> Criar Categoria
                                        </Button>
                                    </div>
                                    <Select 
                                        value={data.category_id} 
                                        onValueChange={val => setData('category_id', val)}
                                    >
                                        <SelectTrigger className="h-10">
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map(cat => (
                                                <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.category_id && <p className="text-xs font-medium text-red-500">{errors.category_id}</p>}
                                </div>

                                {data.type === 'product' && (
                                    <div className="grid gap-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="brand" className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                                Marca
                                            </Label>
                                            <Button 
                                                type="button" 
                                                variant="ghost" 
                                                size="sm" 
                                                className="h-6 px-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50/50"
                                                onClick={() => setQuickCreateBrandOpen(true)}
                                            >
                                                <Plus className="h-3.5 w-3.5 mr-1" /> Criar Marca
                                            </Button>
                                        </div>
                                        <Select 
                                            value={data.brand_id} 
                                            onValueChange={val => setData('brand_id', val)}
                                        >
                                            <SelectTrigger className="h-10">
                                                <SelectValue placeholder="Selecione..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {brands.map(brand => (
                                                    <SelectItem key={brand.id} value={brand.id.toString()}>{brand.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.brand_id && <p className="text-xs font-medium text-red-500">{errors.brand_id}</p>}
                                    </div>
                                )}

                                <div className="grid gap-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="unit" className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                            Unidade de Medida
                                        </Label>
                                        <Button 
                                            type="button" 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-6 px-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50/50"
                                            onClick={() => setQuickCreateUnitOpen(true)}
                                        >
                                            <Plus className="h-3.5 w-3.5 mr-1" /> Criar Unidade
                                        </Button>
                                    </div>
                                    <Select 
                                        value={data.unit_id} 
                                        onValueChange={val => setData('unit_id', val)}
                                    >
                                        <SelectTrigger className="h-10">
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {units.map(unit => (
                                                <SelectItem key={unit.id} value={unit.id.toString()}>
                                                    {unit.name} ({unit.short_name})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.unit_id && <p className="text-xs font-medium text-red-500">{errors.unit_id}</p>}
                                </div>
                            </CardContent>
                        </Card>

                        {/* SUBMISSÃO DE FORMULÁRIO */}
                        <div className="flex flex-col gap-2.5">
                            <PrimaryButton type="submit" className="w-full gap-2 h-12 text-base justify-center" disabled={processing}>
                                <Save className="h-5 w-5" />
                                {processing ? 'A guardar alterações...' : 'Gravar Alterações'}
                            </PrimaryButton>
                            
                            <OutlineButton className="w-full justify-center h-12 text-slate-500 hover:text-slate-950" asChild>
                                <Link href="/products">
                                    Cancelar
                                </Link>
                            </OutlineButton>
                        </div>
                    </div>
                </form>
            </div>

            {/* CRIAÇÃO RÁPIDA - MODAIS */}
            <Dialog open={quickCreateCatOpen} onOpenChange={setQuickCreateCatOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <form onSubmit={submitQuickCat}>
                        <DialogHeader>
                            <DialogTitle>Nova Categoria</DialogTitle>
                            <DialogDescription className="text-xs">
                                Insira uma nova classificação de agrupamento para os itens do catálogo.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-5 grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="cat_name" className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                    Nome da Categoria *
                                </Label>
                                <Input 
                                    id="cat_name" 
                                    value={catForm.data.name} 
                                    onChange={e => catForm.setData('name', e.target.value)}
                                    placeholder="Ex: Eletrónicos, Consumíveis, Consultorias"
                                    className="h-10"
                                />
                                {catForm.errors.name && (
                                    <p className="text-xs font-medium text-red-500">{catForm.errors.name}</p>
                                )}
                            </div>
                        </div>
                        <DialogFooter className="gap-2 sm:gap-0">
                            <OutlineButton onClick={() => setQuickCreateCatOpen(false)}>
                                Cancelar
                            </OutlineButton>
                            <PrimaryButton type="submit" disabled={catForm.processing}>
                                {catForm.processing ? 'A criar...' : 'Criar Categoria'}
                            </PrimaryButton>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={quickCreateBrandOpen} onOpenChange={setQuickCreateBrandOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <form onSubmit={submitQuickBrand}>
                        <DialogHeader>
                            <DialogTitle>Nova Marca</DialogTitle>
                            <DialogDescription className="text-xs">
                                Adicione um novo fabricante ou marca à sua base operacional.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-5 grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="brand_name" className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                    Nome da Marca *
                                </Label>
                                <Input 
                                    id="brand_name" 
                                    value={brandForm.data.name} 
                                    onChange={e => brandForm.setData('name', e.target.value)}
                                    placeholder="Ex: HP, Asus, Logitech, Lenovo"
                                    className="h-10"
                                />
                                {brandForm.errors.name && (
                                    <p className="text-xs font-medium text-red-500">{brandForm.errors.name}</p>
                                )}
                            </div>
                        </div>
                        <DialogFooter className="gap-2 sm:gap-0">
                            <OutlineButton onClick={() => setQuickCreateBrandOpen(false)}>
                                Cancelar
                            </OutlineButton>
                            <PrimaryButton type="submit" disabled={brandForm.processing}>
                                {brandForm.processing ? 'A criar...' : 'Criar Marca'}
                            </PrimaryButton>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={quickCreateUnitOpen} onOpenChange={setQuickCreateUnitOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <form onSubmit={submitQuickUnit}>
                        <DialogHeader>
                            <DialogTitle>Nova Unidade de Medida</DialogTitle>
                            <DialogDescription className="text-xs">
                                Defina novas métricas de fracionamento para quantificar faturamento e stock.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-5 grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="unit_name" className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                    Nome por Extenso *
                                </Label>
                                <Input 
                                    id="unit_name" 
                                    value={unitForm.data.name} 
                                    onChange={e => unitForm.setData('name', e.target.value)}
                                    placeholder="Ex: Quilograma, Litro, Caixa, Unidade"
                                    className="h-10"
                                />
                                {unitForm.errors.name && (
                                    <p className="text-xs font-medium text-red-500">{unitForm.errors.name}</p>
                                )}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="unit_short" className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                    Sigla / Abreviatura *
                                </Label>
                                <Input 
                                    id="unit_short" 
                                    value={unitForm.data.short_name} 
                                    onChange={e => unitForm.setData('short_name', e.target.value)}
                                    placeholder="Ex: KG, L, CX, UN"
                                    className="h-10 uppercase font-mono"
                                />
                                {unitForm.errors.short_name && (
                                    <p className="text-xs font-medium text-red-500">{unitForm.errors.short_name}</p>
                                )}
                            </div>
                        </div>
                        <DialogFooter className="gap-2 sm:gap-0">
                            <OutlineButton onClick={() => setQuickCreateUnitOpen(false)}>
                                Cancelar
                            </OutlineButton>
                            <PrimaryButton type="submit" disabled={unitForm.processing}>
                                {unitForm.processing ? 'A criar...' : 'Criar Unidade'}
                            </PrimaryButton>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

ProductEdit.layout = (page: any) => (
    <AppLayout breadcrumbs={[
        { title: 'Catálogo', href: '#' },
        { title: 'Produtos e Serviços', href: '/products' },
        { title: `Editar: ${page.props?.product?.name ?? ''}`, href: '#' },
    ]}>
        {page}
    </AppLayout>
);