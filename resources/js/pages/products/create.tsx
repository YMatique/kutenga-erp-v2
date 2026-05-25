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
    Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useState } from 'react';
import { toast } from 'sonner';

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

interface Props {
    categories: Category[];
    units: Unit[];
    brands: Brand[];
}

export default function ProductCreate({ categories, units, brands }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        category_id: '',
        unit_id: '',
        brand_id: '',
        sku: '',
        barcode: '',
        description: '',
        type: 'product',
        track_stock: true,
        min_stock: '0',
        weight: '',
        price: '0',
        cost: '0',
        tax_rate: '16', // IVA Moçambique standard
        tax_is_exempt: false,
        tax_exemption_reason: '',
        image: null as File | null,
        internal_notes: '',
    });

    const [imagePreview, setImagePreview] = useState<string | null>(null);

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
        if (fileInput) fileInput.value = '';
    };

    // Quick Create State
    const [quickCreateCatOpen, setQuickCreateCatOpen] = useState(false);
    const [quickCreateBrandOpen, setQuickCreateBrandOpen] = useState(false);
    const [quickCreateUnitOpen, setQuickCreateUnitOpen] = useState(false);

    // Quick Create Forms
    const catForm = useForm({ name: '', parent_id: '' });
    const brandForm = useForm({ name: '' });
    const unitForm = useForm({ name: '', short_name: '' });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/products', {
            onSuccess: () => toast.success('Item cadastrado com sucesso!'),
        });
    };

    const submitQuickCat = (e: React.FormEvent) => {
        e.preventDefault();
        catForm.post('/categories', {
            onSuccess: () => {
                setQuickCreateCatOpen(false);
                catForm.reset();
                toast.success('Categoria adicionada!');
            }
        });
    };

    const submitQuickBrand = (e: React.FormEvent) => {
        e.preventDefault();
        brandForm.post('/brands', {
            onSuccess: () => {
                setQuickCreateBrandOpen(false);
                brandForm.reset();
                toast.success('Marca adicionada!');
            }
        });
    };

    const submitQuickUnit = (e: React.FormEvent) => {
        e.preventDefault();
        unitForm.post('/units', {
            onSuccess: () => {
                setQuickCreateUnitOpen(false);
                unitForm.reset();
                toast.success('Unidade de medida adicionada!');
            }
        });
    };

    return (
        <>
            <Head title="Novo Item" />

            <div className="flex flex-col gap-6 max-w-5xl mx-auto">
                <div className="flex items-center gap-4">
                    <Link href="/products">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-white italic">Novo Item</h1>
                        <p className="text-muted-foreground text-sm">Adicione um novo produto ou serviço ao seu catálogo.</p>
                    </div>
                </div>

                <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-12">
                    {/* Main Info */}
                    <div className="md:col-span-2 flex flex-col gap-6">
                        <Card className="border-zinc-200/50 bg-white/70 backdrop-blur-md shadow-xs">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Info className="h-4 w-4 text-zinc-400" />
                                    <CardTitle className="text-lg">Informações Básicas</CardTitle>
                                </div>
                                <CardDescription>Identificação principal do item.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Nome do Item</Label>
                                    <Input 
                                        id="name" 
                                        value={data.name} 
                                        onChange={e => setData('name', e.target.value)} 
                                        placeholder="Ex: Teclado Mecânico RGB, Consultoria Técnica"
                                    />
                                    {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="sku">SKU / Referência</Label>
                                        <Input 
                                            id="sku" 
                                            value={data.sku} 
                                            onChange={e => setData('sku', e.target.value)} 
                                            placeholder="Ex: TEC-001"
                                        />
                                        {errors.sku && <p className="text-sm text-red-500">{errors.sku}</p>}
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="barcode">Código de Barras</Label>
                                        <Input 
                                            id="barcode" 
                                            value={data.barcode} 
                                            onChange={e => setData('barcode', e.target.value)} 
                                            placeholder="EAN-13, UPC..."
                                        />
                                        {errors.barcode && <p className="text-sm text-red-500">{errors.barcode}</p>}
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="description">Descrição para o Cliente</Label>
                                    <Textarea 
                                        id="description" 
                                        value={data.description} 
                                        onChange={e => setData('description', e.target.value)} 
                                        placeholder="Características técnicas, observações..."
                                        className="min-h-[100px]"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-zinc-200/50 bg-white/70 backdrop-blur-md shadow-xs">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Layers className="h-4 w-4 text-zinc-400" />
                                    <CardTitle className="text-lg">Gestão e Logística</CardTitle>
                                </div>
                                <CardDescription>Configure como o sistema gerencia este item.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="grid gap-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col gap-0.5">
                                                <Label>Gerenciar Estoque?</Label>
                                                <span className="text-[10px] text-muted-foreground italic">Ativar rastreio de quantidades.</span>
                                            </div>
                                            <Button 
                                                type="button" 
                                                variant={data.track_stock ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => setData('track_stock', !data.track_stock)}
                                                className="w-20"
                                            >
                                                {data.track_stock ? 'SIM' : 'NÃO'}
                                            </Button>
                                        </div>

                                        {data.track_stock && (
                                            <div className="grid gap-2">
                                                <Label htmlFor="min_stock">Ponto de Encomenda (Qtd Mínima)</Label>
                                                <Input 
                                                    id="min_stock" 
                                                    type="number"
                                                    value={data.min_stock} 
                                                    onChange={e => setData('min_stock', e.target.value)} 
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="weight">Peso (KG)</Label>
                                        <Input 
                                            id="weight" 
                                            type="number"
                                            step="0.001"
                                            value={data.weight} 
                                            onChange={e => setData('weight', e.target.value)} 
                                            placeholder="Ex: 0.500"
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="internal_notes" className="text-blue-600 font-semibold">Notas Internas (Privado)</Label>
                                    <Textarea 
                                        id="internal_notes" 
                                        value={data.internal_notes} 
                                        onChange={e => setData('internal_notes', e.target.value)} 
                                        placeholder="Observações de fornecedor, defeitos comuns, etc..."
                                        className="min-h-[80px] bg-blue-50/20"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-zinc-200/50 bg-white/70 backdrop-blur-md shadow-xs">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 text-zinc-400" />
                                    <CardTitle className="text-lg">Precificação</CardTitle>
                                </div>
                                <CardDescription>Defina os valores de custo e venda.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="price">Preço de Venda (MZN)</Label>
                                    <Input 
                                        id="price" 
                                        type="number"
                                        step="0.01"
                                        value={data.price} 
                                        onChange={e => setData('price', e.target.value)} 
                                    />
                                    {errors.price && <p className="text-sm text-red-500">{errors.price}</p>}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="cost">Preço de Custo (MZN)</Label>
                                    <Input 
                                        id="cost" 
                                        type="number"
                                        step="0.01"
                                        value={data.cost} 
                                        onChange={e => setData('cost', e.target.value)} 
                                    />
                                    {errors.cost && <p className="text-sm text-red-500">{errors.cost}</p>}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Fiscal / Impostos Card */}
                        <Card className="border-zinc-200/50 bg-white/70 backdrop-blur-md shadow-xs">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Info className="h-4 w-4 text-zinc-400" />
                                    <CardTitle className="text-lg">Informações Fiscais</CardTitle>
                                </div>
                                <CardDescription>Defina a tributação aplicável a este produto ou serviço.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col gap-0.5">
                                        <Label>Isento de Imposto (IVA)?</Label>
                                        <span className="text-[10px] text-muted-foreground italic">Ativar isenção fiscal para faturamento.</span>
                                    </div>
                                    <Button 
                                        type="button" 
                                        variant={data.tax_is_exempt ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => {
                                            setData(prev => ({
                                                ...prev,
                                                tax_is_exempt: !prev.tax_is_exempt,
                                                tax_rate: !prev.tax_is_exempt ? '0' : '16',
                                                tax_exemption_reason: !prev.tax_is_exempt ? 'Isenção nos termos do Artigo 9 do CIVA' : ''
                                            }));
                                        }}
                                        className="w-20"
                                    >
                                        {data.tax_is_exempt ? 'SIM' : 'NÃO'}
                                    </Button>
                                </div>

                                {!data.tax_is_exempt ? (
                                    <div className="grid gap-2">
                                        <Label htmlFor="tax_rate">Taxa de Imposto (IVA %)</Label>
                                        <Select 
                                            value={data.tax_rate} 
                                            onValueChange={val => setData('tax_rate', val)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecionar taxa..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="16">16% (IVA Normal - Moçambique)</SelectItem>
                                                <SelectItem value="17">17% (IVA Anterior)</SelectItem>
                                                <SelectItem value="0">0% (Sem IVA)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {errors.tax_rate && <p className="text-sm text-red-500">{errors.tax_rate}</p>}
                                    </div>
                                ) : (
                                    <div className="grid gap-2">
                                        <Label htmlFor="tax_exemption_reason">Motivo da Isenção (Obrigatório)</Label>
                                        <Select 
                                            value={data.tax_exemption_reason} 
                                            onValueChange={val => setData('tax_exemption_reason', val)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecionar enquadramento legal..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Artigo 9 do CIVA - Isenção de bens alimentares e saúde">Artigo 9 do CIVA - Isenção de bens alimentares e saúde</SelectItem>
                                                <SelectItem value="Artigo 10 do CIVA - Operações financeiras e seguros">Artigo 10 do CIVA - Operações financeiras e seguros</SelectItem>
                                                <SelectItem value="Isenção por exportação de mercadorias">Isenção por exportação de mercadorias</SelectItem>
                                                <SelectItem value="Regime Simplificado - Sem IVA">Regime Simplificado - Sem IVA</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {errors.tax_exemption_reason && <p className="text-sm text-red-500">{errors.tax_exemption_reason}</p>}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar Info */}
                    <div className="flex flex-col gap-6">
                        {/* Imagem do Produto Card */}
                        <Card className="border-zinc-200/50 bg-white/70 backdrop-blur-md shadow-xs overflow-hidden">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-2">
                                    <ImageIcon className="h-4 w-4 text-zinc-400" />
                                    <CardTitle className="text-lg">Imagem do Produto</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center justify-center">
                                {imagePreview ? (
                                    <div className="relative group w-full aspect-square max-h-[220px] rounded-lg overflow-hidden border border-zinc-200 bg-zinc-50 flex items-center justify-center">
                                        <img 
                                            src={imagePreview} 
                                            alt="Preview" 
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                            <Button 
                                                type="button" 
                                                variant="destructive" 
                                                size="icon"
                                                className="rounded-full h-9 w-9 shadow-lg"
                                                onClick={handleRemoveImage}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <label 
                                        htmlFor="product-image-upload"
                                        className="w-full aspect-square max-h-[220px] rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-400 transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer bg-zinc-50/50 dark:bg-zinc-900/50 p-4 text-center group"
                                    >
                                        <div className="p-3 bg-white dark:bg-zinc-800 rounded-full shadow-xs border border-zinc-200/50 group-hover:scale-105 transition-transform">
                                            <Upload className="h-5 w-5 text-zinc-400 group-hover:text-blue-500" />
                                        </div>
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Carregar Imagem</span>
                                            <span className="text-[10px] text-muted-foreground">PNG, JPG, WEBP até 2MB</span>
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
                                {errors.image && <p className="text-xs text-red-500 mt-2">{errors.image}</p>}
                            </CardContent>
                        </Card>

                        <Card className="border-zinc-200/50 bg-white/70 backdrop-blur-md shadow-xs">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Layers className="h-4 w-4 text-zinc-400" />
                                    <CardTitle className="text-lg">Classificação</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label>Tipo de Item</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button 
                                            type="button"
                                            variant={data.type === 'product' ? 'default' : 'outline'}
                                            className="gap-2 text-xs"
                                            onClick={() => setData('type', 'product')}
                                        >
                                            <Package className="h-4 w-4" /> Produto
                                        </Button>
                                        <Button 
                                            type="button"
                                            variant={data.type === 'service' ? 'default' : 'outline'}
                                            className="gap-2 text-xs"
                                            onClick={() => setData('type', 'service')}
                                        >
                                            <Wrench className="h-4 w-4" /> Serviço
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="category">Categoria</Label>
                                        <Button 
                                            type="button" 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-6 px-1 text-blue-600"
                                            onClick={() => setQuickCreateCatOpen(true)}
                                        >
                                            <Plus className="h-3 w-3 mr-1" /> Nova
                                        </Button>
                                    </div>
                                    <Select 
                                        value={data.category_id} 
                                        onValueChange={val => setData('category_id', val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecionar..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map(cat => (
                                                <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid gap-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="brand">Marca</Label>
                                        <Button 
                                            type="button" 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-6 px-1 text-blue-600"
                                            onClick={() => setQuickCreateBrandOpen(true)}
                                        >
                                            <Plus className="h-3 w-3 mr-1" /> Nova
                                        </Button>
                                    </div>
                                    <Select 
                                        value={data.brand_id} 
                                        onValueChange={val => setData('brand_id', val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecionar..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {brands.map(brand => (
                                                <SelectItem key={brand.id} value={brand.id.toString()}>{brand.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid gap-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="unit">Unidade de Medida</Label>
                                        <Button 
                                            type="button" 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-6 px-1 text-blue-600"
                                            onClick={() => setQuickCreateUnitOpen(true)}
                                        >
                                            <Plus className="h-3 w-3 mr-1" /> Nova
                                        </Button>
                                    </div>
                                    <Select 
                                        value={data.unit_id} 
                                        onValueChange={val => setData('unit_id', val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecionar..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {units.map(unit => (
                                                <SelectItem key={unit.id} value={unit.id.toString()}>{unit.name} ({unit.short_name})</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex flex-col gap-2">
                            <Button type="submit" className="w-full gap-2 py-6 text-lg" disabled={processing}>
                                <Save className="h-5 w-5" />
                                {processing ? 'Gravando...' : 'Salvar Item'}
                            </Button>
                            <Link href="/products" className="w-full">
                                <Button variant="ghost" className="w-full">Cancelar</Button>
                            </Link>
                        </div>
                    </div>
                </form>
            </div>

            {/* Quick Create Modals */}
            <Dialog open={quickCreateCatOpen} onOpenChange={setQuickCreateCatOpen}>
                <DialogContent>
                    <form onSubmit={submitQuickCat}>
                        <DialogHeader>
                            <DialogTitle>Nova Categoria</DialogTitle>
                        </DialogHeader>
                        <div className="py-4 grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="cat_name">Nome da Categoria</Label>
                                <Input 
                                    id="cat_name" 
                                    value={catForm.data.name} 
                                    onChange={e => catForm.setData('name', e.target.value)}
                                    placeholder="Ex: Eletrônicos, Serviços de TI"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setQuickCreateCatOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={catForm.processing}>Criar Categoria</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={quickCreateBrandOpen} onOpenChange={setQuickCreateBrandOpen}>
                <DialogContent>
                    <form onSubmit={submitQuickBrand}>
                        <DialogHeader>
                            <DialogTitle>Nova Marca</DialogTitle>
                        </DialogHeader>
                        <div className="py-4 grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="brand_name">Nome da Marca</Label>
                                <Input 
                                    id="brand_name" 
                                    value={brandForm.data.name} 
                                    onChange={e => brandForm.setData('name', e.target.value)}
                                    placeholder="Ex: Apple, Samsung, Dell"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setQuickCreateBrandOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={brandForm.processing}>Criar Marca</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={quickCreateUnitOpen} onOpenChange={setQuickCreateUnitOpen}>
                <DialogContent>
                    <form onSubmit={submitQuickUnit}>
                        <DialogHeader>
                            <DialogTitle>Nova Unidade de Medida</DialogTitle>
                        </DialogHeader>
                        <div className="py-4 grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="unit_name">Nome da Unidade</Label>
                                <Input 
                                    id="unit_name" 
                                    value={unitForm.data.name} 
                                    onChange={e => unitForm.setData('name', e.target.value)}
                                    placeholder="Ex: Quilograma, Litro"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="unit_short">Sigla</Label>
                                <Input 
                                    id="unit_short" 
                                    value={unitForm.data.short_name} 
                                    onChange={e => unitForm.setData('short_name', e.target.value)}
                                    placeholder="Ex: KG, LT, UN"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setQuickCreateUnitOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={unitForm.processing}>Criar Unidade</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
