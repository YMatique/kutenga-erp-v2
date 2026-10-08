export type LookedUpProduct = {
    id: number;
    name: string;
    sku: string | null;
    barcode: string | null;
    price: number;
    tax_rate: number;
    track_stock: boolean;
    unit: string | null;
};

/** Resolve um código (barcode ou SKU) para um produto da empresa; null se não existir. */
export async function lookupProduct(code: string, options: { trackStock?: boolean } = {}): Promise<LookedUpProduct | null> {
    const params = new URLSearchParams({ code });

    if (options.trackStock) {
        params.set('track_stock', '1');
    }

    const response = await fetch(`/products/lookup?${params}`, {
        headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        credentials: 'same-origin',
    });

    if (response.status === 404) {
        return null;
    }

    if (!response.ok) {
        throw new Error(`Falha ao consultar o código (${response.status}).`);
    }

    return response.json();
}

/** Compara um código lido com os campos de um produto já carregado no cliente. */
export function matchesCode(product: { barcode?: string | null; sku?: string | null }, code: string): boolean {
    const c = code.trim().toLowerCase();

    return (product.barcode ?? '').toLowerCase() === c || (product.sku ?? '').toLowerCase() === c;
}
