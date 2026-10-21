import { ChevronsUpDown, Loader2 } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { searchProducts } from '@/lib/product-search';
import type { PickedProduct } from '@/lib/product-search';
import { cn } from '@/lib/utils';

type ProductPickerProps = {
    /** O produto escolhido (só o nome é preciso para o mostrar). */
    value: { name: string } | null;
    onSelect: (product: PickedProduct) => void;
    warehouseId?: string | number | null;
    inStock?: boolean;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
};

const quantity = (n: number) => n.toLocaleString('pt-MZ', { maximumFractionDigits: 3 });

/**
 * Escolha de produto com pesquisa no servidor: ao escrever pede os primeiros resultados (nome, SKU
 * ou código de barras) em vez de ter o catálogo inteiro carregado. Setas e Enter funcionam, e um
 * pedido que chega atrasado nunca substitui o mais recente.
 */
export function ProductPicker({ value, onSelect, warehouseId, inStock, placeholder = 'Pesquisar produto...', disabled, className }: ProductPickerProps) {
    const listId = useId();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<PickedProduct[]>([]);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(false);
    const [failed, setFailed] = useState(false);
    const [active, setActive] = useState(0);
    const controller = useRef<AbortController | null>(null);

    // Pesquisa com um pequeno atraso a cada letra; ao mudar o armazém ou o filtro, volta a pedir
    useEffect(() => {
        if (!open) {
            return;
        }

        const timer = setTimeout(async () => {
            controller.current?.abort();
            const current = new AbortController();
            controller.current = current;
            setLoading(true);
            setFailed(false);

            try {
                const result = await searchProducts(query, { warehouseId, inStock, signal: current.signal });
                setResults(result.data);
                setHasMore(result.has_more);
                setActive(0);
            } catch (error) {
                if ((error as Error).name !== 'AbortError') {
                    setFailed(true);
                }
            } finally {
                if (controller.current === current) {
                    setLoading(false);
                }
            }
        }, query ? 250 : 0);

        return () => clearTimeout(timer);
    }, [open, query, warehouseId, inStock]);

    useEffect(() => () => controller.current?.abort(), []);

    const choose = (product: PickedProduct) => {
        onSelect(product);
        setOpen(false);
        setQuery('');
    };

    const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setOpen(true);
            setActive((i) => Math.min(i + 1, results.length - 1));
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActive((i) => Math.max(i - 1, 0));
        } else if (event.key === 'Enter' && open) {
            // Enter escolhe o produto; nunca submete o formulário por engano
            event.preventDefault();

            if (results[active]) {
                choose(results[active]);
            }
        } else if (event.key === 'Escape') {
            setOpen(false);
        }
    };

    return (
        <div className={cn('relative', className)}>
            <div className="relative">
                <input
                    type="text"
                    role="combobox"
                    aria-expanded={open}
                    aria-controls={listId}
                    aria-autocomplete="list"
                    aria-activedescendant={open && results[active] ? listId + '-' + results[active].id : undefined}
                    autoComplete="off"
                    disabled={disabled}
                    placeholder={value ? value.name : placeholder}
                    value={open ? query : ''}
                    onChange={(event) => {
                        setQuery(event.target.value);
                        setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                    onBlur={() => setOpen(false)}
                    onKeyDown={onKeyDown}
                    className={cn(
                        'w-full h-9 border border-slate-200 rounded-[4px] pl-3 pr-8 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#2DB8A0] focus:border-[#2DB8A0] transition-colors disabled:opacity-60 disabled:cursor-not-allowed',
                        value && !open ? 'placeholder:text-slate-900 placeholder:font-medium' : 'placeholder:text-slate-400',
                    )}
                />
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronsUpDown className="h-4 w-4" />}
                </span>
            </div>

            {open && (
                // O mousedown não tira o foco ao campo, para o clique chegar à opção antes do blur
                <div
                    id={listId}
                    role="listbox"
                    onMouseDown={(event) => event.preventDefault()}
                    className="absolute z-50 mt-1 max-h-72 w-full min-w-[260px] overflow-auto rounded-[4px] border border-border bg-popover text-popover-foreground shadow-md"
                >
                    {failed ? (
                        <p className="px-3 py-3 text-xs text-red-500">Não foi possível pesquisar. Verifique a ligação.</p>
                    ) : results.length === 0 ? (
                        <p className="px-3 py-3 text-xs text-muted-foreground">
                            {loading ? 'A pesquisar...' : query ? 'Nenhum produto encontrado.' : 'Nenhum produto disponível.'}
                        </p>
                    ) : (
                        results.map((product, index) => (
                            <div
                                key={product.id}
                                id={listId + '-' + product.id}
                                role="option"
                                aria-selected={index === active}
                                onMouseEnter={() => setActive(index)}
                                onClick={() => choose(product)}
                                className={cn(
                                    'flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-sm',
                                    index === active && 'bg-muted',
                                )}
                            >
                                <span className="min-w-0">
                                    <span className="block truncate font-medium text-foreground">{product.name}</span>
                                    <span className="block truncate text-[11px] text-muted-foreground">
                                        {[product.sku, product.barcode].filter(Boolean).join(' · ') || 'sem código'}
                                    </span>
                                </span>
                                {product.stock !== null && (
                                    <span className="shrink-0 text-right text-xs">
                                        <span className="block font-mono font-semibold text-foreground">
                                            {quantity(product.stock)}{product.unit ? ' ' + product.unit : ''}
                                        </span>
                                        {product.available !== null && product.available < product.stock && (
                                            <span className="block text-[10px] text-muted-foreground">disp. {quantity(product.available)}</span>
                                        )}
                                    </span>
                                )}
                            </div>
                        ))
                    )}
                    {hasMore && !failed && (
                        <p className="border-t border-border px-3 py-2 text-[11px] text-muted-foreground">
                            A mostrar os primeiros resultados. Escreva mais para afinar.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
