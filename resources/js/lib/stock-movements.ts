/** Tipos de movimento de stock: o mesmo nome e a mesma cor em todos os ecrãs. */
export const movementLabels: Record<string, { label: string; color: string }> = {
    opening: { label: 'Stock Inicial', color: 'bg-muted text-muted-foreground' },
    in: { label: 'Entrada', color: 'bg-[#2DB8A0]/10 text-[#2DB8A0]' },
    out: { label: 'Saída', color: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400' },
    adjustment: { label: 'Ajuste', color: 'bg-[#E8A020]/10 text-[#E8A020]' },
};

/** Sinal do efeito de um movimento no stock: entradas e stock inicial somam, saídas subtraem, ajustes têm o sinal da quantidade. */
export function movementDelta(movement: { type: string; quantity: number | string }): number {
    const quantity = Number(movement.quantity);

    if (movement.type === 'out') {
        return -Math.abs(quantity);
    }

    if (movement.type === 'adjustment') {
        return quantity;
    }

    return Math.abs(quantity);
}

/** Quantidade com até 3 casas, no formato local. */
export const formatQty = (n: number | string) => Number(n).toLocaleString('pt-MZ', { maximumFractionDigits: 3 });
