import { useEffect, useRef } from 'react';

type Options = {
    onScan: (code: string) => void;
    enabled?: boolean;
    /** Tamanho mínimo para considerar uma leitura (evita falsos positivos). */
    minLength?: number;
    /** Intervalo máximo (ms) entre teclas de uma leitura; humanos escrevem bem mais devagar. */
    maxKeyGap?: number;
};

const TERMINATORS = ['Enter', 'Tab'];

function isTextField(el: Element | null): el is HTMLInputElement | HTMLTextAreaElement {
    return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;
}

/** Repõe o valor de um campo React controlado sem o texto que o leitor escreveu nele. */
function stripFromField(field: HTMLInputElement | HTMLTextAreaElement, code: string) {
    const at = field.value.lastIndexOf(code);

    if (at === -1) {
        return;
    }

    const proto = field instanceof HTMLInputElement ? HTMLInputElement.prototype : HTMLTextAreaElement.prototype;

    Object.getOwnPropertyDescriptor(proto, 'value')?.set?.call(field, field.value.slice(0, at) + field.value.slice(at + code.length));
    field.dispatchEvent(new Event('input', { bubbles: true }));
}

/**
 * Detecta leitores de código de barras que se comportam como teclado: uma rajada de
 * caracteres muito rápida terminada em Enter (ou Tab). Funciona com qualquer campo em
 * foco; o texto que o leitor escreveu no campo é removido e consumido o Enter, para
 * não submeter formulários. Escrita manual (lenta) não é afectada.
 */
export function useBarcodeScanner({ onScan, enabled = true, minLength = 4, maxKeyGap = 80 }: Options) {
    const onScanRef = useRef(onScan);

    useEffect(() => {
        onScanRef.current = onScan;
    }, [onScan]);

    useEffect(() => {
        if (!enabled) {
            return;
        }

        let buffer = '';
        let lastKeyTime = 0;

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.altKey || e.metaKey || e.isComposing) {
                return;
            }

            if (TERMINATORS.includes(e.key)) {
                const code = buffer.trim();
                const fresh = performance.now() - lastKeyTime <= maxKeyGap;
                buffer = '';

                if (!fresh || code.length < minLength) {
                    return;
                }

                const active = document.activeElement;

                if (active instanceof HTMLTextAreaElement) {
                    return;
                }

                e.preventDefault();
                e.stopPropagation();

                if (isTextField(active)) {
                    stripFromField(active, code);
                }

                onScanRef.current(code);

                return;
            }

            if (e.key.length !== 1) {
                return;
            }

            const now = performance.now();
            buffer = now - lastKeyTime > maxKeyGap ? e.key : buffer + e.key;
            lastKeyTime = now;
        };

        window.addEventListener('keydown', onKeyDown, true);

        return () => window.removeEventListener('keydown', onKeyDown, true);
    }, [enabled, minLength, maxKeyGap]);
}
