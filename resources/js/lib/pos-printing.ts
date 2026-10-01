/**
 * Impressão do POS.
 *
 * O servidor decide o driver de cada caixa (configurável em POS → Caixas) e devolve um
 * "trabalho de impressão" em /pos/print/job. Este módulo executa a parte que corre no browser.
 *
 * Para acrescentar outro driver de cliente (ex.: WebUSB, Bluetooth, app nativa):
 *   1. aceitar o novo valor em CashRegister::PRINTER_DRIVERS (PHP);
 *   2. devolver os dados necessários em PosReceiptController::job();
 *   3. registar aqui uma função em `clientDrivers`.
 */
import { toast } from 'sonner';

export type PrintType = 'receipt' | 'shift-summary' | 'shift-sales' | 'day' | 'test';

interface PrintJob {
    driver: string;
    url?: string;
    fallback_url?: string;
    printer?: string;
    data?: string;
    printed?: boolean;
    error?: string;
}

type ClientDriver = (job: PrintJob) => Promise<void>;

function openBrowserPrint(url: string) {
    const win = window.open(url, '_blank', 'width=360,height=600,scrollbars=yes,toolbar=no,menubar=no');

    if (!win) {
        throw new Error('Bloqueador de popups activo. Autorize popups para este site.');
    }
}

/** Reutiliza a ligação ao QZ Tray entre impressões. */
async function qzClient() {
    const qz = (await import('qz-tray')).default;

    if (!qz.websocket.isActive()) {
        await qz.websocket.connect({ retries: 1, delay: 1 });
    }

    return qz;
}

const clientDrivers: Record<string, ClientDriver> = {
    // Talão HTML + diálogo de impressão do browser
    browser: async (job) => openBrowserPrint(job.url!),

    // ESC/POS bruto via QZ Tray (https://qz.io) instalado no posto
    qz: async (job) => {
        const qz = await qzClient();
        const config = qz.configs.create(job.printer!);

        await qz.print(config, [{ type: 'raw', format: 'command', flavor: 'base64', data: job.data! }]);
    },

    // Enviado pelo próprio servidor (TCP/9100): nada a fazer no cliente
    network: async () => undefined,
};

/** Pede ao servidor o trabalho de impressão e executa-o com o driver da caixa. */
export async function printJob(type: PrintType, id?: number | string): Promise<boolean> {
    const params = new URLSearchParams({ type });

    if (id !== undefined) {
        params.set('id', String(id));
    }

    let job: PrintJob | null = null;

    try {
        const res = await fetch(`/pos/print/job?${params}`, { headers: { Accept: 'application/json' } });

        job = await res.json();

        if (!res.ok) {
            throw new Error(job?.error || 'Não foi possível preparar a impressão.');
        }

        await (clientDrivers[job!.driver] ?? clientDrivers.browser)(job!);

        if (job!.driver !== 'browser') {
            toast.success('Enviado para a impressora.');
        }

        return true;
    } catch (e: any) {
        toast.error(e?.message || 'Falha na impressão.');

        // Se a impressora directa falhar, o talão HTML continua disponível
        if (job?.fallback_url) {
            toast.info('A abrir o talão no browser como alternativa.', {
                action: { label: 'Abrir', onClick: () => window.open(job!.fallback_url!, '_blank') },
            });
        }

        return false;
    }
}
