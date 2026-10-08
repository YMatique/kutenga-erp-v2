/** Dígito de controlo EAN-13 para os 12 primeiros dígitos. */
export function ean13CheckDigit(body: string): number {
    const sum = [...body].reduce((acc, digit, i) => acc + Number(digit) * (i % 2 === 0 ? 1 : 3), 0);

    return (10 - (sum % 10)) % 10;
}

export function isValidEan13(code: string): boolean {
    return /^\d{13}$/.test(code) && ean13CheckDigit(code.slice(0, 12)) === Number(code[12]);
}

/** Um código com 13 dígitos que não passa no dígito de controlo é quase sempre um erro de leitura/escrita. */
export function looksLikeBadEan13(code: string): boolean {
    return /^\d{13}$/.test(code) && !isValidEan13(code);
}

/** EAN-13 válido desenha-se como EAN-13; qualquer outro código (SKU, códigos internos) como Code 128. */
export function barcodeFormat(code: string): 'EAN13' | 'CODE128' {
    return isValidEan13(code) ? 'EAN13' : 'CODE128';
}
