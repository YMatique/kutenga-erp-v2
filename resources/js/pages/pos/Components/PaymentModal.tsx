import { Banknote, CreditCard, Landmark, Printer, CheckCircle2, Delete, ArrowLeft, ShoppingBag } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { printJob } from '@/lib/pos-printing';

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
    { id: 'cash'     as Method, label: 'Dinheiro',      icon: Banknote,   color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
    { id: 'card'     as Method, label: 'TPA / Cartão',  icon: CreditCard, color: 'text-[#2DB8A0]',   bg: 'bg-[#2DB8A0]/10 border-[#2DB8A0]/30' },
    { id: 'transfer' as Method, label: 'Transferência', icon: Landmark,   color: 'text-purple-600',  bg: 'bg-purple-50 border-purple-200' },
];

// Identificador único de cada tentativa de venda. `crypto.randomUUID` só existe em contextos
// seguros (HTTPS/localhost); numa rede local em http usa-se um valor aleatório equivalente.
function newSaleToken(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }

    return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

function NumKey({ label, onClick, span }: { label: string; onClick: () => void; span?: boolean }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`${span ? 'col-span-2' : ''} h-14 rounded-[4px] bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-semibold text-xl transition-all border border-slate-200 flex items-center justify-center`}
        >
            {label}
        </button>
    );
}

// ── Componente principal ───────────────────────────────────────────────────────
export default function PaymentModal({ isOpen, onClose, total, cart, onSuccess }: PaymentModalProps) {
    const [step, setStep]        = useState<Step>('method');
    const [method, setMethod]    = useState<Method>('cash');
    const [display, setDisplay]  = useState('0');
    const [processing, setProc]  = useState(false);
    const [successData, setData] = useState<any>(null);
    // A mesma chave acompanha todas as tentativas desta venda: se o pedido for repetido
    // (duplo clique, falha de rede) o servidor devolve a venda já feita em vez de criar outra.
    const saleToken = useRef<string>(newSaleToken());

    // Reset ao abrir
    useEffect(() => {
        if (isOpen) {
            setStep('method');
            setDisplay(total.toFixed(2));
            setData(null);
            setProc(false);
            saleToken.current = newSaleToken();
        }
    }, [isOpen, total]);

    const numericValue = parseFloat(display) || 0;
    const change       = method === 'cash' ? Math.max(0, numericValue - total) : 0;
    const shortage     = method === 'cash' ? Math.max(0, total - numericValue) : 0;
    const canPay       = method !== 'cash' || numericValue >= total - 0.005;

    const fmt = (n: number) => n.toLocaleString('pt-MZ', { minimumFractionDigits: 2 });

    // Teclado numérico
    const pressKey = (k: string) => {
        setDisplay(prev => {
            if (k === '⌫') {
return prev.length <= 1 ? '0' : prev.slice(0, -1);
}

            if (k === '.' && prev.includes('.')) {
return prev;
}

            if (k === '.' && prev === '0') {
return '0.';
}

            if (prev === '0' && k !== '.') {
return k;
}

            if (prev.includes('.') && prev.split('.')[1].length >= 2) {
return prev;
}

            return prev + k;
        });
    };

    // Processar venda
    const handlePay = async () => {
        if (processing) {
            return;
        }

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
                    client_token:   saleToken.current,
                    items,
                    payment_method: method,
                    amount_paid:    numericValue,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
throw new Error(data.error || 'Erro ao processar venda.');
}

            setData(data.document);
            setStep('success');

            if (data.auto_print) {
                void printJob('receipt', data.document.id);
            }

            toast.success('Venda concluída com sucesso!');
        } catch (e: any) {
            toast.error(e.message || 'Erro ao processar venda.');
        } finally {
            setProc(false);
        }
    };

    // Imprimir recibo: o driver (browser, QZ Tray, rede) é o configurado na caixa
    const handlePrint = () => {
        if (successData) {
            void printJob('receipt', successData.id);
        }
    };

    const canClose = !processing && step !== 'success';

    return (
        <Dialog open={isOpen} onOpenChange={open => !open && canClose && onClose()}>
            <DialogContent className="sm:max-w-sm p-0 overflow-hidden gap-0 rounded-[4px]">

                {/* ── SUCESSO ── */}
                {step === 'success' && successData && (
                    <div className="p-6 flex flex-col items-center gap-5 text-center">
                        <div className="w-20 h-20 rounded-full bg-[#2DB8A0]/10 flex items-center justify-center">
                            <CheckCircle2 className="w-10 h-10 text-[#2DB8A0]" />
                        </div>
                        <div>
                            <p className="text-xl font-bold text-slate-900">Venda Concluída!</p>
                            <p className="text-sm font-mono text-slate-500 mt-1 font-semibold">
                                {successData.document_number}
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">
                                {new Date().toLocaleString('pt-MZ')}
                            </p>
                        </div>

                        {/* Totais rápidos */}
                        <div className="w-full bg-slate-50 border border-slate-200 rounded-[4px] divide-y divide-slate-100 text-sm">
                            <div className="flex justify-between px-4 py-2 text-slate-500">
                                <span>Total</span>
                                <span className="font-bold text-slate-900">{fmt(Number(successData.grand_total))} MT</span>
                            </div>
                            {change > 0.005 && (
                                <div className="flex justify-between px-4 py-2 bg-emerald-50">
                                    <span className="text-emerald-700 font-semibold">TROCO A DEVOLVER</span>
                                    <span className="text-2xl font-black text-emerald-700">{fmt(change)} MT</span>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 w-full">
                            <Button
                                variant="outline"
                                className="flex-1 rounded-[4px]"
                                onClick={onSuccess}
                            >
                                Nova Venda
                            </Button>
                            <Button
                                className="flex-1 gap-2 bg-[#E8A020] hover:bg-[#d49218] rounded-[4px]"
                                onClick={handlePrint}
                            >
                                <Printer className="w-4 h-4" /> Imprimir VD
                            </Button>
                        </div>

                        {/* Botão secundário imprimir + nova venda */}
                        <button
                            onClick={() => {
 handlePrint(); onSuccess(); 
}}
                            className="text-xs text-slate-400 hover:text-slate-600 underline transition-colors"
                        >
                            Imprimir e iniciar nova venda
                        </button>
                    </div>
                )}

                {/* ── MÉTODO DE PAGAMENTO ── */}
                {step === 'method' && (
                    <div className="p-5 space-y-4">
                        <div className="text-center">
                            <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Total a pagar</p>
                            <p className="text-4xl font-black text-slate-900 mt-1">{fmt(total)} <span className="text-lg font-medium text-slate-400">MT</span></p>
                        </div>

                        <div className="space-y-2">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Método de Pagamento</p>
                            <div className="grid grid-cols-3 gap-2">
                                {METHODS.map(m => {
                                    const Icon = m.icon;
                                    const active = method === m.id;

                                    return (
                                        <button
                                            key={m.id}
                                            onClick={() => setMethod(m.id)}
                                            className={`flex flex-col items-center gap-2 py-4 rounded-[4px] border-2 transition-all ${
                                                active
                                                    ? `${m.bg} border-current ${m.color} shadow-sm`
                                                    : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300'
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
                            className="w-full h-12 bg-[#2DB8A0] hover:bg-[#27a591] font-bold text-base rounded-[4px]"
                            onClick={() => method === 'cash' ? setStep('amount') : handlePay()}
                            disabled={processing}
                        >
                            {method === 'cash' ? 'Continuar →' : processing ? 'A processar...' : 'Confirmar Pagamento'}
                        </Button>
                    </div>
                )}

                {/* ── VALOR + TECLADO (apenas dinheiro) ── */}
                {step === 'amount' && (
                    <div className="p-4 space-y-3">
                        <div className="flex items-center gap-2 mb-1">
                            <button onClick={() => setStep('method')} className="text-slate-400 hover:text-slate-600">
                                <ArrowLeft className="w-4 h-4" />
                            </button>
                            <span className="text-sm font-medium text-slate-600">Pagamento em Dinheiro</span>
                        </div>

                        {/* Display do valor */}
                        <div className="bg-slate-900 rounded-[4px] px-4 py-4 text-right">
                            <p className="text-xs text-slate-500 mb-1">Valor Recebido</p>
                            <p className="text-5xl font-black text-white tracking-tight leading-none">
                                {display} <span className="text-xl font-medium text-slate-400">MT</span>
                            </p>
                        </div>

                        {/* Info strip */}
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="bg-slate-50 rounded-[4px] p-2.5 text-center border border-slate-200">
                                <p className="text-xs text-slate-400">Total</p>
                                <p className="font-bold text-slate-800 text-base">{fmt(total)} MT</p>
                            </div>
                            <div className={`rounded-[4px] p-2.5 text-center border ${
                                shortage > 0.005
                                    ? 'bg-red-50 border-red-200'
                                    : 'bg-emerald-50 border-emerald-200'
                            }`}>
                                <p className="text-xs text-slate-400">{shortage > 0.005 ? 'Em falta' : 'Troco'}</p>
                                <p className={`font-bold text-base ${shortage > 0.005 ? 'text-red-600' : 'text-emerald-600'}`}>
                                    {shortage > 0.005 ? fmt(shortage) : fmt(change)} MT
                                </p>
                            </div>
                        </div>

                        {/* Teclado numérico */}
                        <div className="grid grid-cols-3 gap-1.5">
                            {['7','8','9','4','5','6','1','2','3'].map(k => (
                                <NumKey key={k} label={k} onClick={() => pressKey(k)} />
                            ))}
                            <NumKey label="." onClick={() => pressKey('.')} />
                            <NumKey label="0" onClick={() => pressKey('0')} />
                            <button
                                type="button"
                                onClick={() => pressKey('⌫')}
                                className="h-14 rounded-[4px] bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-500 transition-all border border-slate-200 flex items-center justify-center"
                            >
                                <Delete className="w-5 h-5" />
                            </button>
                            <NumKey label="Exact" onClick={() => setDisplay(total.toFixed(2))} span />
                        </div>

                        <Button
                            className="w-full h-12 font-bold text-base bg-[#2DB8A0] hover:bg-[#27a591] rounded-[4px]"
                            onClick={handlePay}
                            disabled={processing || !canPay}
                        >
                            {processing ? 'A processar...' : `Confirmar  •  Troco ${fmt(change)} MT`}
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
