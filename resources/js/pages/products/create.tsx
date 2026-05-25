import { Head, useForm, Link } from '@inertiajs/react';
import { 
    ArrowLeft, 
    Save, 
    Package, 
    Wrench, 
    Info, 
    DollarSign, 
    Layers,
    Plus 
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
        price: '0',
        cost: '0',
    });

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

                <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                                    <Label htmlFor="description" className="italic">Descrição Detalhada</Label>
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
                    </div>

                    {/* Sidebar Info */}
                    <div className="flex flex-col gap-6">
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
