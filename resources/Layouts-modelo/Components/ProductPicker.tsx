import * as React from "react"
import { Check, ChevronsUpDown, Search, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import axios from "axios"
import { useDebounce } from "use-debounce"

export interface Product {
    id: string
    name: string
    sku?: string
    has_variants: boolean
    variations?: Variation[]
}

export interface Variation {
    id: number
    product_id: string
    name: string
    sku?: string
}

interface ProductPickerProps {
    value?: {
        product_id: string
        variation_id?: number | null
    }
    onSelect: (product: Product, variation?: Variation | null) => void
    placeholder?: string
    className?: string
}

export function ProductPicker({ value, onSelect, placeholder = "Buscar produto...", className }: ProductPickerProps) {
    const [open, setOpen] = React.useState(false)
    const [query, setQuery] = React.useState("")
    const [debouncedQuery] = useDebounce(query, 300)
    const [loading, setLoading] = React.useState(false)
    const [products, setProducts] = React.useState<Product[]>([])

    // Label do item selecionado
    const [selectedLabel, setSelectedLabel] = React.useState<string>("")

    React.useEffect(() => {
        if (debouncedQuery.length < 2) {
            setProducts([])
            return
        }

        const fetchProducts = async () => {
            setLoading(true)
            try {
                const response = await axios.get(route('tenant.inventory.products.search'), {
                    params: { query: debouncedQuery }
                })
                setProducts(response.data)
            } catch (error) {
                console.error("Erro ao buscar produtos:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchProducts()
    }, [debouncedQuery])

    const handleSelect = (product: Product, variation: Variation | null = null) => {
        onSelect(product, variation)
        setOpen(false)

        let label = product.name
        if (variation) {
            label += ` - ${variation.name}`
        }
        if (product.sku) {
            label += ` (${product.sku})`
        }
        setSelectedLabel(label)
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between", className)}
                >
                    {selectedLabel || value?.product_id ? (selectedLabel || "Produto selecionado") : placeholder}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
                <Command shouldFilter={false}>
                    <div className="flex items-center border-b px-3">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <input
                            className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Digite nome ou SKU..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>
                    <CommandList>
                        {loading && (
                            <div className="py-6 text-center text-sm text-muted-foreground flex items-center justify-center">
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Buscando...
                            </div>
                        )}
                        {!loading && products.length === 0 && query.length >= 2 && (
                            <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
                        )}
                        {!loading && query.length < 2 && (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                                Digite pelo menos 2 caracteres para buscar.
                            </div>
                        )}

                        {!loading && products.length > 0 && products.map((product) => (
                            <React.Fragment key={product.id}>
                                {!product.has_variants ? (
                                    <CommandItem
                                        value={product.id}
                                        onSelect={() => handleSelect(product)}
                                        className="cursor-pointer"
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-medium">{product.name}</span>
                                            {product.sku && <span className="text-xs text-muted-foreground">SKU: {product.sku}</span>}
                                        </div>
                                        {value?.product_id === product.id && !value?.variation_id && (
                                            <Check className="ml-auto h-4 w-4" />
                                        )}
                                    </CommandItem>
                                ) : (
                                    <CommandGroup heading={product.name}>
                                        {product.variations?.map((variation) => (
                                            <CommandItem
                                                key={variation.id}
                                                value={`${product.id}-${variation.id}`}
                                                onSelect={() => handleSelect(product, variation)}
                                                className="pl-6 cursor-pointer"
                                            >
                                                <div className="flex flex-col">
                                                    <span>{variation.name}</span>
                                                    {variation.sku && <span className="text-xs text-muted-foreground">SKU: {variation.sku}</span>}
                                                </div>
                                                {value?.product_id === product.id && value?.variation_id === variation.id && (
                                                    <Check className="ml-auto h-4 w-4" />
                                                )}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                )}
                            </React.Fragment>
                        ))}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
