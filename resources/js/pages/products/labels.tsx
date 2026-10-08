import { Head, Link } from '@inertiajs/react';
import JsBarcode from 'jsbarcode';
import { AlertTriangle, Plus, Printer, Search, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { barcodeFormat } from '@/lib/barcode';

type LabelProduct = {
    id: number;
    name: string;
    sku: string | null;
    barcode: string | null;
    price: number | string;
};

type Item = LabelProduct & { copies: number };

type Preset = {
    label: string;
    /** Tamanho da etiqueta em mm. */
    width: number;
    height: number;
    /** Folha A4 com várias etiquetas por página; null = rolo (uma etiqueta por página). */
    sheet: { columns: number } | null;
};

const PRESETS: Record<string, Preset> = {
    'a4-3': { label: 'Folha A4 · 3 colunas (70×37 mm)', width: 70, height: 37, sheet: { columns: 3 } },
    'a4-4': { label: 'Folha A4 · 4 colunas (52×30 mm)', width: 52, height: 30, sheet: { columns: 4 } },
    'roll-50x30': { label: 'Rolo · 50×30 mm', width: 50, height: 30, sheet: null },
    'roll-40x25': { label: 'Rolo · 40×25 mm', width: 40, height: 25, sheet: null },
};

const money = (value: number | string) =>
    `${(parseFloat(String(value)) || 0).toLocaleString('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT`;

function BarcodeSvg({ code }: { code: string }) {
    const ref = useRef<SVGSVGElement>(null);

    useEffect(() => {
        const svg = ref.current;

        if (!svg) {
            return;
        }

        try {
            JsBarcode(svg, code, { format: barcodeFormat(code), width: 2, height: 50, displayValue: true, fontSize: 14, margin: 0, textMargin: 2 });

            // Escala o SVG ao espaço disponível na etiqueta
            const w = svg.getAttribute('width');
            const h = svg.getAttribute('height');

            if (w && h) {
                svg.setAttribute('viewBox', `0 0 ${parseFloat(w)} ${parseFloat(h)}`);
                svg.removeAttribute('width');
                svg.removeAttribute('height');
            }
        } catch {
            svg.replaceChildren();
        }
    }, [code]);

    return <svg ref={ref} className="h-full w-full" preserveAspectRatio="xMidYMid meet" />;
}

function LabelCell({ item, preset, showPrice }: { item: LabelProduct; preset: Preset; showPrice: boolean }) {
    return (
        <div
            className="label-cell flex flex-col overflow-hidden bg-white p-[2mm] text-black"
            style={{ width: `${preset.width}mm`, height: `${preset.height}mm`, breakInside: 'avoid' }}
        >
            <p className="truncate text-[9pt] font-semibold leading-tight">{item.name}</p>
            {showPrice && <p className="text-[10pt] font-bold leading-tight">{money(item.price)}</p>}
            <div className="min-h-0 flex-1 pt-[1mm]">{item.barcode && <BarcodeSvg code={item.barcode} />}</div>
        </div>
    );
}

export default function Labels({ products }: { products: LabelProduct[] }) {
    const [items, setItems] = useState<Item[]>(() => products.map((p) => ({ ...p, copies: 1 })));
    const [presetKey, setPresetKey] = useState('a4-3');
    const [showPrice, setShowPrice] = useState(true);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<LabelProduct[]>([]);
    const preset = PRESETS[presetKey];

    useEffect(() => {
        const term = query.trim();

        if (term.length < 2) {
            return;
        }

        const controller = new AbortController();
        const timer = setTimeout(async () => {
            try {
                const response = await fetch(`/products/search?q=${encodeURIComponent(term)}`, {
                    headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                    credentials: 'same-origin',
                    signal: controller.signal,
                });

                if (response.ok) {
                    setResults(await response.json());
                }
            } catch {
                // pesquisa cancelada ou sem rede
            }
        }, 250);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [query]);

    const visibleResults = query.trim().length < 2 ? [] : results;

    const add = (product: LabelProduct) => {
        setItems((prev) => (prev.some((i) => i.id === product.id) ? prev : [...prev, { ...product, copies: 1 }]));
        setQuery('');
        setResults([]);
    };

    const setCopies = (id: number, copies: number) =>
        setItems((prev) => prev.map((i) => (i.id === id ? { ...i, copies: Math.max(1, Math.min(500, copies || 1)) } : i)));

    const printable = useMemo(() => items.filter((i) => i.barcode), [items]);
    const labels = useMemo(() => printable.flatMap((i) => Array.from({ length: i.copies }, (_, n) => ({ key: `${i.id}-${n}`, item: i }))), [printable]);
    const withoutCode = items.filter((i) => !i.barcode);

    const pageCss = preset.sheet
        ? '@page { size: A4; margin: 0; }'
        : `@page { size: ${preset.width}mm ${preset.height}mm; margin: 0; }`;

    return (
        <>
            <Head title="Etiquetas" />

            <style>{`
                @media print {
                    ${pageCss}
                    body * { visibility: hidden !important; }
                    #label-sheet, #label-sheet * { visibility: visible !important; }
                    #label-sheet { position: absolute; left: 0; top: 0; margin: 0 !important; box-shadow: none !important; }
                    ${preset.sheet ? '' : '.label-cell:not(:last-child) { page-break-after: always; }'}
                }
            `}</style>

            <div className="space-y-6 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-semibold">Etiquetas de produtos</h1>
                        <p className="text-sm text-muted-foreground">Escolha os produtos, o formato e imprima. Em impressoras de rolo, defina o papel igual ao formato escolhido.</p>
                    </div>
                    <Button onClick={() => window.print()} disabled={labels.length === 0} className="gap-2">
                        <Printer className="h-4 w-4" />
                        Imprimir {labels.length > 0 && `(${labels.length})`}
                    </Button>
                </div>

                <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
                    <div className="space-y-5">
                        <div className="space-y-2">
                            <Label>Formato</Label>
                            <select
                                value={presetKey}
                                onChange={(e) => setPresetKey(e.target.value)}
                                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                            >
                                {Object.entries(PRESETS).map(([key, p]) => (
                                    <option key={key} value={key}>
                                        {p.label}
                                    </option>
                                ))}
                            </select>
                            <label className="flex items-center gap-2 text-sm">
                                <input type="checkbox" checked={showPrice} onChange={(e) => setShowPrice(e.target.checked)} />
                                Mostrar preço na etiqueta
                            </label>
                        </div>

                        <div className="space-y-2">
                            <Label>Adicionar produto</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nome, SKU ou código..." className="pl-9" />
                                {visibleResults.length > 0 && (
                                    <ul className="absolute z-10 mt-1 max-h-64 w-full overflow-auto rounded-md border bg-popover shadow-md">
                                        {visibleResults.map((p) => (
                                            <li key={p.id}>
                                                <button
                                                    type="button"
                                                    onClick={() => add(p)}
                                                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                                                >
                                                    <span className="truncate">{p.name}</span>
                                                    <Plus className="h-4 w-4 shrink-0" />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Produtos ({items.length})</Label>
                            {items.length === 0 && <p className="text-sm text-muted-foreground">Nenhum produto escolhido.</p>}
                            <ul className="divide-y rounded-md border">
                                {items.map((item) => (
                                    <li key={item.id} className="flex items-center gap-2 p-2 text-sm">
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate font-medium">{item.name}</p>
                                            {item.barcode ? (
                                                <p className="font-mono text-xs text-muted-foreground">{item.barcode}</p>
                                            ) : (
                                                <p className="flex items-center gap-1 text-xs text-amber-600">
                                                    <AlertTriangle className="h-3 w-3" />
                                                    Sem código de barras.{' '}
                                                    <Link href={`/products/${item.id}/edit`} className="underline">
                                                        Gerar
                                                    </Link>
                                                </p>
                                            )}
                                        </div>
                                        <Input
                                            type="number"
                                            min={1}
                                            max={500}
                                            value={item.copies}
                                            onChange={(e) => setCopies(item.id, Number(e.target.value))}
                                            className="h-8 w-20 text-right"
                                            title="Número de etiquetas"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setItems((prev) => prev.filter((i) => i.id !== item.id))}
                                            title="Remover"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                            {withoutCode.length > 0 && <p className="text-xs text-amber-600">Produtos sem código não são impressos.</p>}
                        </div>
                    </div>

                    <div className="overflow-auto rounded-md border bg-muted/40 p-4">
                        <p className="mb-3 text-xs text-muted-foreground">Pré-visualização ({labels.length} etiquetas)</p>
                        <div
                            id="label-sheet"
                            className="inline-grid gap-0 bg-white shadow"
                            style={
                                preset.sheet
                                    ? { gridTemplateColumns: `repeat(${preset.sheet.columns}, ${preset.width}mm)`, gridAutoRows: `${preset.height}mm`, width: '210mm' }
                                    : { gridTemplateColumns: `${preset.width}mm` }
                            }
                        >
                            {labels.map(({ key, item }) => (
                                <LabelCell key={key} item={item} preset={preset} showPrice={showPrice} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

Labels.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            { title: 'Catálogo', href: '#' },
            { title: 'Produtos e Serviços', href: '/products' },
            { title: 'Etiquetas', href: '#' },
        ]}
    >
        {page}
    </AppLayout>
);
