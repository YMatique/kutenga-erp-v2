import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Banknote, CreditCard, Landmark, Printer, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    total: number;
    cart: any[];
    onSuccess: () => void;
}

export default function PaymentModal({ isOpen, onClose, total, cart, onSuccess }: PaymentModalProps) {
    const [method, setMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
    const [amountPaid, setAmountPaid] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [successData, setSuccessData] = useState<any>(null);

    useEffect(() => {
        if (isOpen) {
            setAmountPaid(total.toFixed(2));
            setSuccessData(null);
        }
    }, [isOpen, total]);

    const change = method === 'cash' ? Math.max(0, parseFloat(amountPaid || '0') - total) : 0;
    const isAmountValid = parseFloat(amountPaid || '0') >= total - 0.01;

    const handlePayment = async () => {
        if (!isAmountValid) {
            toast.error('O valor pago é menor que o total.');
            return;
        }

        setIsProcessing(true);
        try {
            const formattedCart = cart.map(item => ({
                product_id: item.id,
                product_name: item.name,
                quantity: item.quantity,
                unit_price: item.sale_price,
                tax_rate: item.tax_rate,
                discount_percent: 0
            }));

            const token = document.cookie.split('; ').find(row => row.startsWith('XSRF-TOKEN='))?.split('=')[1] || '';
            
            const response = await fetch('/pos/sales', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-XSRF-TOKEN': decodeURIComponent(token)
                },
                body: JSON.stringify({
                    items: formattedCart,
                    payment_method: method,
                    amount_paid: parseFloat(amountPaid)
                })
            });

            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(responseData.error || 'Erro ao processar venda.');
            }

            setSuccessData(responseData.document);
            toast.success('Venda concluída com sucesso!');
        } catch (error: any) {
            toast.error(error.message || 'Erro ao processar venda.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePrint = () => {
        if (!successData) return;
        
        // Abre numa nova janela para impressão otimizada
        const printWindow = window.open('', '_blank', 'width=400,height=600');
        if (!printWindow) return;

        // Construir HTML simples para impressora 80mm
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Recibo POS</title>
                <style>
                    body {
                        font-family: 'Courier New', Courier, monospace;
                        margin: 0;
                        padding: 10px;
                        width: 78mm; /* 80mm printer width */
                        font-size: 12px;
                        color: #000;
                    }
                    .center { text-align: center; }
                    .right { text-align: right; }
                    .bold { font-weight: bold; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    th, td { padding: 4px 0; border-bottom: 1px dashed #ccc; }
                    .totals { margin-top: 15px; border-top: 1px dashed #000; padding-top: 10px; }
                    .totals div { display: flex; justify-content: space-between; margin-bottom: 5px; }
                    .footer { text-align: center; margin-top: 20px; font-size: 10px; border-top: 1px dashed #000; padding-top: 10px; }
                    @media print {
                        body { width: 100%; }
                    }
                </style>
            </head>
            <body>
                <div class="center">
                    <h2 style="margin: 0;">${successData.company?.name || 'Kutenga'}</h2>
                    <p style="margin: 5px 0;">NUIT: ${successData.company?.nuit || '---'}</p>
                    <p style="margin: 5px 0;">VD / Fatura-Recibo<br>${successData.series?.prefix || 'FR'}/${successData.sequence_number}</p>
                    <p style="margin: 5px 0;">Data: ${new Date().toLocaleString('pt-MZ')}</p>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th align="left">Qtd x Artigo</th>
                            <th align="right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${successData.items.map((item: any) => `
                            <tr>
                                <td>${Number(item.quantity)} x ${item.product_name}<br><small>${Number(item.unit_price).toFixed(2)} MT</small></td>
                                <td align="right" valign="top">${(Number(item.quantity) * Number(item.unit_price)).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div class="totals">
                    <div><span>Subtotal:</span> <span>${Number(successData.subtotal).toFixed(2)} MT</span></div>
                    <div><span>IVA:</span> <span>${Number(successData.tax_total).toFixed(2)} MT</span></div>
                    <div class="bold" style="font-size: 14px;"><span>TOTAL:</span> <span>${Number(successData.grand_total).toFixed(2)} MT</span></div>
                </div>

                <div class="footer">
                    Obrigado pela preferência!<br>
                    Processado por Kutenga ERP
                </div>

                <script>
                    window.onload = function() { window.print(); window.close(); }
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
        
        onSuccess();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && !isProcessing && !successData && onClose()}>
            <DialogContent className="sm:max-w-md">
                {successData ? (
                    <div className="py-8 flex flex-col items-center justify-center space-y-6 text-center">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-10 h-10 text-green-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-neutral-900">Venda Concluída!</h2>
                            <p className="text-neutral-500 mt-2">O documento foi registado com sucesso no sistema.</p>
                        </div>
                        {change > 0 && method === 'cash' && (
                            <div className="bg-neutral-100 p-4 rounded-lg w-full">
                                <p className="text-sm text-neutral-500 mb-1">Troco a devolver:</p>
                                <p className="text-3xl font-bold text-blue-600">{change.toFixed(2)} MT</p>
                            </div>
                        )}
                        <div className="flex gap-4 w-full pt-4">
                            <Button variant="outline" className="flex-1" onClick={onSuccess}>
                                Nova Venda
                            </Button>
                            <Button className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700 text-white" onClick={handlePrint}>
                                <Printer className="w-4 h-4" />
                                Imprimir Recibo
                            </Button>
                        </div>
                    </div>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle>Pagamento</DialogTitle>
                            <DialogDescription>
                                Selecione o método e confirme o valor.
                            </DialogDescription>
                        </DialogHeader>
                        
                        <div className="grid grid-cols-3 gap-3 py-4">
                            <Button 
                                variant={method === 'cash' ? 'default' : 'outline'}
                                className={`h-24 flex flex-col gap-2 ${method === 'cash' ? 'bg-blue-600 hover:bg-blue-700 ring-2 ring-blue-600 ring-offset-2' : ''}`}
                                onClick={() => setMethod('cash')}
                            >
                                <Banknote className="w-8 h-8" />
                                Dinheiro
                            </Button>
                            <Button 
                                variant={method === 'card' ? 'default' : 'outline'}
                                className={`h-24 flex flex-col gap-2 ${method === 'card' ? 'bg-blue-600 hover:bg-blue-700 ring-2 ring-blue-600 ring-offset-2' : ''}`}
                                onClick={() => setMethod('card')}
                            >
                                <CreditCard className="w-8 h-8" />
                                TPA / Cartão
                            </Button>
                            <Button 
                                variant={method === 'transfer' ? 'default' : 'outline'}
                                className={`h-24 flex flex-col gap-2 ${method === 'transfer' ? 'bg-blue-600 hover:bg-blue-700 ring-2 ring-blue-600 ring-offset-2' : ''}`}
                                onClick={() => setMethod('transfer')}
                            >
                                <Landmark className="w-8 h-8" />
                                Transferência
                            </Button>
                        </div>

                        <div className="space-y-4 py-4 border-t border-neutral-100">
                            <div className="flex justify-between items-center bg-neutral-50 p-4 rounded-lg">
                                <span className="font-semibold text-neutral-600">Total a Pagar:</span>
                                <span className="text-3xl font-bold text-neutral-900">{total.toFixed(2)} MT</span>
                            </div>

                            {method === 'cash' && (
                                <div className="space-y-2">
                                    <Label htmlFor="amount">Valor Recebido</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">MT</span>
                                        <Input
                                            id="amount"
                                            type="number"
                                            step="0.01"
                                            className="pl-12 text-2xl h-14 font-bold"
                                            value={amountPaid}
                                            onChange={(e) => setAmountPaid(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            {method === 'cash' && change > 0 && (
                                <div className="flex justify-between items-center text-blue-600">
                                    <span className="font-medium">Troco:</span>
                                    <span className="text-xl font-bold">{change.toFixed(2)} MT</span>
                                </div>
                            )}
                        </div>

                        <Button 
                            className="w-full h-14 text-lg mt-4 bg-green-600 hover:bg-green-700 text-white"
                            onClick={handlePayment}
                            disabled={isProcessing || !isAmountValid}
                        >
                            {isProcessing ? 'Processando...' : 'Confirmar Pagamento'}
                        </Button>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
