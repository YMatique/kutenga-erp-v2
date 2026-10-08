import { Camera, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type Props = {
    onScan: (code: string) => void;
    /** Mantém a câmara aberta e continua a ler (contagens); caso contrário fecha na primeira leitura. */
    continuous?: boolean;
    title?: string;
    className?: string;
    size?: 'default' | 'sm' | 'icon';
};

const NATIVE_FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39'];
const REPEAT_WINDOW_MS = 1500;

type NativeDetector = { detect: (source: HTMLVideoElement) => Promise<{ rawValue: string }[]> };

const cameraAvailable = () => typeof window !== 'undefined' && window.isSecureContext && !!navigator.mediaDevices?.getUserMedia;

/**
 * Lê códigos de barras com a câmara. Usa o BarcodeDetector nativo (Chrome/Android) e, onde não
 * existe, o ZXing (carregado só quando necessário). A câmara só funciona em HTTPS ou localhost.
 */
export function CameraScanButton({ onScan, continuous = false, title = 'Ler código com a câmara', className, size = 'icon' }: Props) {
    const [open, setOpen] = useState(false);
    const [status, setStatus] = useState<'starting' | 'scanning' | 'error'>('starting');
    const [error, setError] = useState('');
    const videoRef = useRef<HTMLVideoElement>(null);
    const onScanRef = useRef(onScan);

    useEffect(() => {
        onScanRef.current = onScan;
    }, [onScan]);

    useEffect(() => {
        if (!open) {
            return;
        }

        let stopped = false;
        let cleanup = () => {};
        let lastCode = '';
        let lastTime = 0;

        const handle = (code: string) => {
            const now = Date.now();

            if (stopped || (code === lastCode && now - lastTime < REPEAT_WINDOW_MS)) {
                return;
            }

            lastCode = code;
            lastTime = now;
            onScanRef.current(code);

            if (!continuous) {
                setOpen(false);
            }
        };

        const start = async () => {
            setStatus('starting');

            try {
                // O Dialog monta o <video> depois de abrir; espera pelo próximo frame
                await new Promise((resolve) => requestAnimationFrame(resolve));

                const video = videoRef.current;

                if (!video || stopped) {
                    return;
                }

                const Native = (window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => NativeDetector }).BarcodeDetector;

                if (Native) {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } } });

                    if (stopped) {
                        stream.getTracks().forEach((t) => t.stop());

                        return;
                    }

                    video.srcObject = stream;
                    await video.play();
                    setStatus('scanning');

                    const detector = new Native({ formats: NATIVE_FORMATS });
                    const timer = window.setInterval(async () => {
                        try {
                            const [found] = await detector.detect(video);

                            if (found?.rawValue) {
                                handle(found.rawValue);
                            }
                        } catch {
                            // frame ainda sem imagem: tenta no próximo ciclo
                        }
                    }, 200);

                    cleanup = () => {
                        window.clearInterval(timer);
                        stream.getTracks().forEach((t) => t.stop());
                    };

                    return;
                }

                const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] = await Promise.all([
                    import('@zxing/browser'),
                    import('@zxing/library'),
                ]);

                const hints = new Map();
                hints.set(DecodeHintType.POSSIBLE_FORMATS, [
                    BarcodeFormat.EAN_13,
                    BarcodeFormat.EAN_8,
                    BarcodeFormat.UPC_A,
                    BarcodeFormat.UPC_E,
                    BarcodeFormat.CODE_128,
                    BarcodeFormat.CODE_39,
                ]);

                const reader = new BrowserMultiFormatReader(hints);
                const controls = await reader.decodeFromConstraints({ video: { facingMode: { ideal: 'environment' } } }, video, (result) => {
                    if (result) {
                        handle(result.getText());
                    }
                });

                if (stopped) {
                    controls.stop();

                    return;
                }

                setStatus('scanning');
                cleanup = () => controls.stop();
            } catch (e) {
                const denied = e instanceof DOMException && e.name === 'NotAllowedError';

                setError(denied ? 'Permissão da câmara recusada. Autorize o acesso nas definições do browser.' : 'Não foi possível iniciar a câmara.');
                setStatus('error');
            }
        };

        void start();

        return () => {
            stopped = true;
            cleanup();
        };
    }, [open, continuous]);

    const available = cameraAvailable();

    return (
        <>
            <Button
                type="button"
                variant="outline"
                size={size}
                className={className}
                disabled={!available}
                title={available ? title : 'A câmara só funciona em HTTPS (ou localhost) e em dispositivos com câmara.'}
                onClick={() => setOpen(true)}
            >
                <Camera className="h-4 w-4" />
                {size !== 'icon' && <span className="ml-2">Câmara</span>}
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{title}</DialogTitle>
                        <DialogDescription>
                            {continuous ? 'Aponte ao código; cada leitura é registada. Feche quando terminar.' : 'Aponte a câmara ao código de barras.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="relative overflow-hidden rounded-md bg-black">
                        <video ref={videoRef} className="aspect-[4/3] w-full object-cover" muted playsInline />

                        {status === 'scanning' && <div className="pointer-events-none absolute inset-x-8 top-1/2 h-0.5 -translate-y-1/2 bg-red-500/80" />}

                        {status === 'starting' && (
                            <div className="absolute inset-0 flex items-center justify-center text-white">
                                <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                        )}
                    </div>

                    {status === 'error' && <p className="text-sm font-medium text-red-600">{error}</p>}
                </DialogContent>
            </Dialog>
        </>
    );
}
