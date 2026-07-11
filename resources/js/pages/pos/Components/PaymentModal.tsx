import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Banknote, CreditCard, Landmark, Printer, CheckCircle2, Delete, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    total: number;
    cart: any[];
    onSuccess: () => void;
}

type Method = 'cash' | 'card' | 'transfer';
type Step = 'method' | 'amount' | 'success';

const METHODS = [
    { id: 'cash'     as Method, label: 'Dinheiro',      icon: Banknote,    color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
    { id: 'card'     as Method, label: 'TPA / Cartão',  icon: CreditCard,  color: 'text-blue-600',    bg: 'bg-blue-50 border-blue-200' },
    { id: 'transfer' as Method, label: 'Transferência', icon: Landmark,    color: 'text-purple-600',  bg: 'bg-purple-50 border-purple-200' },
];

function NumKey({ label, onClick, span }: { label: string; onClick: () => void; span?: boolean }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`${span ? 'col-span-2' : ''} h-14 rounded-xl bg-neutral-100 hover:bg-neutral-200 active:scale-95 text-neutral-800 font-semibold text-xl transition-all border border-neutral-200 flex items-center justify-center`}
        >
            {label}
        </button>
    );
}

export default function PaymentModal({ isOpen, onClose, total, cart, onSuccess }: PaymentModalProps) {
    const [step, setStep]         = useState<Step>('method');
    const [method, setMethod]     = useState<Method>('cash');
    const [display, setDisplay]   = useState('0');
    const [processing, setProc]   = useState(false);
    const [successData, setData]  = useState<any>(null);

    // Reset on open
    useEffect(() => {
        if (isOpen) {
            setStep('method');
            setDisplay(total.toFixed(2));
            setData(null);
            setProc(false);
        }
    }, [isOpen, total]);

    const numericValue = parseFloat(display) || 0;
    const change       = method === 'cash' ? Math.max(0, numericValue - total) : 0;
    const shortage     = method === 'cash' ? Math.max(0, total - numericValue) : 0;
    const canPay       = method !== 'cash' || numericValue >= total - 0.005;

    const fmt = (n: number) => n.toLocaleString('pt-MZ', { minimumFractionDigits: 2 });

    // Keypad handlers
    const pressKey = (k: string) => {
        setDisplay(prev => {
            if (k === '⌫') return prev.length <= 1 ? '0' : prev.slice(0, -1);
            if (k === '.' && prev.includes('.')) return prev;
            if (k === '.' && prev === '0') return '0.';
            if (prev === '0' && k !== '.') return k;
            if (prev.includes('.') && prev.split('.')[1].length >= 2) return prev;
            return prev + k;
        });
    };

    const handlePay = async () => {
        setProc(true);
        try {
            const items = cart.map(i => ({
                product_id:       i.id,
                product_name:     i.name,
                quantity:         i.quantity,
                unit_price:       parseFloat(String(i.sale_price)) || 0,
                tax_rate:         i.tax_rate,
                discount_percent: 0,
            }));

            const token = document.cookie.split('; ').find(r => r.startsWith('XSRF-TOKEN='))?.split('=')[1] || '';
            const res   = await fetch('/pos/sales', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-XSRF-TOKEN': decodeURIComponent(token),
                },
                body: JSON.stringify({
                    items,
                    payment_method: method,
                    amount_paid:    numericValue,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Erro ao processar venda.');
            setData(data.document);
            setStep('success');
            toast.success('Venda concluída!');
        } catch (e: any) {
            toast.error(e.message || 'Erro ao processar venda.');
        } finally {
            setProc(false);
        }
    };

    const handlePrint = () => {
        if (!successData) return;
        const win = window.open('', '_blank', 'width=400,height=700');
        if (!win) return;
        win.document.write(`<!DOCTYPE html><html><head><title>Recibo</title>
<style>
  body{font-family:'Courier New',monospace;margin:0;padding:12px;width:78mm;font-size:12px}
  .c{text-align:center} .r{text-align:right} .b{font-weight:bold}
  table{width:100%;border-collapse:collapse;margin-top:8px}
  td,th{padding:3px 0;vertical-align:top}
  .sep{border-top:1px dashed #000;margin:8px 0}
  .tot{display:flex;justify-content:space-between;margin:4px 0}
  .foot{text-align:center;margin-top:16px;font-size:10px}
  @media print{body{width:100%}}
</style></head><body>
<div class="c b" style="font-size:14px">${successData.company?.name || 'Kutenga'}</div>
<div class="c">NUIT: ${successData.company?.nuit || '---'}</div>
<div class="sep"></div>
<div class="c">Fatura-Recibo</div>
<div class="c b">${successData.series?.prefix ?? 'FR'}/${successData.sequence_number ?? ''}</div>
<div class="c">${new Date().toLocaleString('pt-MZ')}</div>
<div class="sep"></div>
<table>
  <tr><th align="left">Artigo</th><th align="right">Qtd</th><th align="right">Total</th></tr>
  ${(successData.items ?? []).map((i: any) =>
    `<tr><td>${i.product_name}</td><td align="right">${i.quantity}</td><td align="right">${(i.quantity * i.unit_price).toFixed(2)}</td></tr>`
  ).join('')}
</table>
<div class="sep"></div>
<div class="tot"><span>Subtotal</span><span>${Number(successData.subtotal).toFixed(2)} MT</span></div>
<div class="tot"><span>IVA</span><span>${Number(successData.tax_total).toFixed(2)} MT</span></div>
<div class="sep"></div>
<div class="tot b" style="font-size:14px"><span>TOTAL</span><span>${Number(successData.grand_total).toFixed(2)} MT</span></div>
${change > 0 ? `<div class="tot"><span>Troco</span><span>${change.toFixed(2)} MT</span></div>` : ''}
<div class="foot">Obrigado pela preferência!<br>Processado por Kutenga ERP</div>
<script>window.onload=()=>{window.print();window.close()}</script>
</body></html>`);
        win.document.close();
        onSuccess();
    };

    const canClose = !processing && step !== 'success';

    return (
        <Dialog open={isOpen} onOpenChange={open => !open && canClose && onClose()}>
            <DialogContent className="sm:max-w-sm p-0 overflow-hidden gap-0">

                {/* ── SUCCESS ── */}
                {step === 'success' && successData && (
                    <div className="p-6 flex flex-col items-center gap-5 text-center">
                        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
                            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-xl font-bold text-neutral-900">Venda Concluída!</p>
                            <p className="text-sm text-neutral-500 mt-1">
                                {successData.series?.prefix ?? 'FR'}/{successData.sequence_number}
                            </p>
                        </div>

                        {change > 0.005 && (
                            <div className="w-full bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                                <p className="text-xs text-emerald-600 font-medium mb-1">TROCO A DEVOLVER</p>
                                <p className="text-3xl font-black text-emerald-700">{fmt(change)} MT</p>
                            </div>
                        )}

                        <div className="flex gap-3 w-full">
                            <Button variant="outline" className="flex-1" onClick={onSuccess}>
                                Nova Venda
                            </Button>
                            <Button className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700" onClick={handlePrint}>
                                <Printer className="w-4 h-4" /> Imprimir
                            </Button>
                        </div>
                    </div>
                )}

                {/* ── METHOD SELECTION ── */}
                {step === 'method' && (
                    <div className="p-5 space-y-4">
                        <div className="text-center">
                            <p className="text-sm text-neutral-500">Total a pagar</p>
                            <p className="text-3xl font-black text-neutral-900 mt-1">{fmt(total)} MT</p>
                        </div>

                        <div className="space-y-2">
                            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">Método de Pagamento</p>
                            <div className="grid grid-cols-3 gap-2">
                                {METHODS.map(m => {
                                    const Icon = m.icon;
                                    const active = method === m.id;
                                    return (
                                        <button
                                            key={m.id}
                                            onClick={() => setMethod(m.id)}
                                            className={`flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-all ${
                                                active
                                                    ? `${m.bg} border-current ${m.color} shadow-sm ring-2 ring-offset-1 ring-current`
                                                    : 'bg-neutral-50 border-neutral-200 text-neutral-500 hover:border-neutral-300'
                                            }`}
                                        >
                                            <Icon className={`w-6 h-6 ${active ? m.color : ''}`} />
                                            <span className="text-xs font-semibold leading-tight text-center">{m.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <Button
                            className="w-full h-12 bg-blue-600 hover:bg-blue-700 font-bold text-base"
                            onClick={() => method === 'cash' ? setStep('amount') : handlePay()}
                            disabled={processing}
                        >
                            {method === 'cash' ? 'Continuar →' : processing ? 'Processando...' : 'Confirmar Pagamento'}
                        </Button>
                    </div>
                )}

                {/* ── AMOUNT + KEYPAD (cash only) ── */}
                {step === 'amount' && (
                    <div className="p-4 space-y-3">
                        <div className="flex items-center gap-2 mb-1">
                            <button onClick={() => setStep('method')} className="text-neutral-400 hover:text-neutral-600">
                                <ArrowLeft className="w-4 h-4" />
                            </button>
                            <span className="text-sm font-medium text-neutral-600">Pagamento em Dinheiro</span>
                        </div>

                        {/* Display */}
                        <div className="bg-neutral-900 rounded-xl px-4 py-3 text-right">
                            <p className="text-xs text-neutral-500 mb-1">Valor Recebido</p>
                            <p className="text-4xl font-black text-white tracking-tight">{display} <span className="text-lg font-medium text-neutral-400">MT</span></p>
                        </div>

                        {/* Info strip */}
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="bg-neutral-50 rounded-lg p-2 text-center border border-neutral-200">
                                <p className="text-xs text-neutral-400">Total</p>
                                <p className="font-bold text-neutral-800">{fmt(total)} MT</p>
                            </div>
                            <div className={`rounded-lg p-2 text-center border ${
                                shortage > 0.005
                                    ? 'bg-red-50 border-red-200'
                                    : 'bg-emerald-50 border-emerald-200'
                            }`}>
                                <p className="text-xs text-neutral-400">{shortage > 0.005 ? 'Em falta' : 'Troco'}</p>
                                <p className={`font-bold ${shortage > 0.005 ? 'text-red-600' : 'text-emerald-600'}`}>
                                    {shortage > 0.005 ? fmt(shortage) : fmt(change)} MT
                                </p>
                            </div>
                        </div>

                        {/* Keypad */}
                        <div className="grid grid-cols-3 gap-1.5">
                            {['7','8','9','4','5','6','1','2','3'].map(k => (
                                <NumKey key={k} label={k} onClick={() => pressKey(k)} />
                            ))}
                            <NumKey label="." onClick={() => pressKey('.')} />
                            <NumKey label="0" onClick={() => pressKey('0')} />
                            <button
                                type="button"
                                onClick={() => pressKey('⌫')}
                                className="h-14 rounded-xl bg-neutral-100 hover:bg-neutral-200 active:scale-95 text-neutral-500 transition-all border border-neutral-200 flex items-center justify-center"
                            >
                                <Delete className="w-5 h-5" />
                            </button>
                            <NumKey label="Exact" onClick={() => setDisplay(total.toFixed(2))} span />
                        </div>

                        <Button
                            className="w-full h-12 font-bold text-base bg-emerald-600 hover:bg-emerald-700"
                            onClick={handlePay}
                            disabled={processing || !canPay}
                        >
                            {processing ? 'Processando...' : `Confirmar • Troco ${fmt(change)} MT`}
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
