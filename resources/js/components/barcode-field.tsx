import { Barcode, Loader2, Wand2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { CameraScanButton } from '@/components/camera-scanner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { looksLikeBadEan13 } from '@/lib/barcode';
import { lookupProduct } from '@/lib/product-lookup';

type Props = {
    value: string;
    onChange: (value: string) => void;
    error?: string;
    /** Produto em edição, para não se avisar de duplicado contra si próprio. */
    currentProductId?: number;
};

/**
 * Campo de código de barras: aceita escrita manual, leitor físico (que termina em Enter, por
 * isso o Enter é consumido para não submeter o formulário) ou câmara. Avisa se o código já
 * existe ou se o dígito de controlo EAN-13 não bate, e gera códigos internos para produtos
 * sem código de fábrica.
 */
export function BarcodeField({ value, onChange, error, currentProductId }: Props) {
    const [duplicateOf, setDuplicateOf] = useState<string | null>(null);
    const [generating, setGenerating] = useState(false);

    const checkDuplicate = async (code = value.trim()) => {
        if (!code) {
            setDuplicateOf(null);

            return;
        }

        try {
            const found = await lookupProduct(code);

            setDuplicateOf(found && found.id !== currentProductId ? found.name : null);
        } catch {
            setDuplicateOf(null);
        }
    };

    const generate = async () => {
        setGenerating(true);

        try {
            const response = await fetch('/products/barcode/next', {
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                credentials: 'same-origin',
            });

            if (!response.ok) {
                throw new Error();
            }

            const { barcode } = await response.json();

            setDuplicateOf(null);
            onChange(barcode);
        } catch {
            toast.error('Não foi possível gerar o código.');
        } finally {
            setGenerating(false);
        }
    };

    const fromCamera = (code: string) => {
        onChange(code);
        void checkDuplicate(code);
    };

    return (
        <div className="grid gap-2">
            <Label htmlFor="barcode" className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Código de Barras (EAN / UPC)
            </Label>
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Input
                        id="barcode"
                        value={value}
                        onChange={(e) => {
                            setDuplicateOf(null);
                            onChange(e.target.value);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                void checkDuplicate();
                            }
                        }}
                        onBlur={() => void checkDuplicate()}
                        placeholder="Digite ou leia. Ex: 5601234567890"
                        autoComplete="off"
                        className="h-10 pr-10 font-mono"
                    />
                    <Barcode className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
                <CameraScanButton onScan={fromCamera} className="h-10 w-10 shrink-0" />
                <Button
                    type="button"
                    variant="outline"
                    className="h-10 shrink-0 gap-1.5"
                    onClick={generate}
                    disabled={generating}
                    title="Gera um EAN-13 interno (prefixo 20) para produtos sem código de fábrica"
                >
                    {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                    Gerar
                </Button>
            </div>
            {duplicateOf && <p className="text-xs font-medium text-amber-600">Este código já pertence a “{duplicateOf}”.</p>}
            {!duplicateOf && looksLikeBadEan13(value.trim()) && (
                <p className="text-xs font-medium text-amber-600">O dígito de controlo EAN-13 não confere: confirme se o código foi lido ou escrito correctamente.</p>
            )}
            {error && <p className="text-xs font-medium text-red-500">{error}</p>}
        </div>
    );
}
