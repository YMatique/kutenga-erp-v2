/** Resultado da pesquisa de produtos dos formulários de stock. */
export type PickedProduct = {
    id: number;
    name: string;
    sku: string | null;
    barcode: string | null;
    unit: string | null;
    /** false quando a unidade só aceita quantidades inteiras (unidade, caixa, dúzia...). */
    allow_decimals: boolean;
    /** Stock e disponível (sem reservas) no armazém pedido; null quando não se indicou armazém. */
    stock: number | null;
    available: number | null;
};

export type ProductSearchOptions = {
    /** Com armazém, cada resultado traz o stock lá e o que ainda está disponível. */
    warehouseId?: string | number | null;
    /** Só produtos com stock (no armazém indicado, ou em qualquer um). */
    inStock?: boolean;
    signal?: AbortSignal;
};

export type ProductSearchResult = { data: PickedProduct[]; has_more: boolean };

async function request(params: URLSearchParams, signal?: AbortSignal): Promise<ProductSearchResult> {
    const response = await fetch('/inventory/products/search?' + params, {
        headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        credentials: 'same-origin',
        signal,
    });

    if (!response.ok) {
        throw new Error('Falha ao pesquisar produtos (' + response.status + ').');
    }

    return response.json();
}

function baseParams(options: ProductSearchOptions): URLSearchParams {
    const params = new URLSearchParams();

    if (options.warehouseId) {
        params.set('warehouse_id', String(options.warehouseId));
    }

    if (options.inStock) {
        params.set('in_stock', '1');
    }

    return params;
}

/** Pesquisa por nome, SKU ou código de barras (parte do texto); devolve os primeiros resultados. */
export function searchProducts(query: string, options: ProductSearchOptions = {}): Promise<ProductSearchResult> {
    const params = baseParams(options);

    if (query.trim()) {
        params.set('q', query.trim());
    }

    return request(params, options.signal);
}

/** Resolve um código lido (leitor ou câmara) para o produto com esse código de barras ou SKU; null se não existir. */
export async function findProductByCode(code: string, options: ProductSearchOptions = {}): Promise<PickedProduct | null> {
    const params = baseParams(options);
    params.set('q', code.trim());
    params.set('exact', '1');

    const result = await request(params, options.signal);

    return result.data[0] ?? null;
}
