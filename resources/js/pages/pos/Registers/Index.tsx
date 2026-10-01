import { Head, useForm, usePage } from '@inertiajs/react';
import { Plus, Edit, Trash2, Monitor, Printer } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { PageHeader, TableCard, PrimaryButton } from '@/components/ui/brand';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useConfirmDelete } from '@/contexts/confirm-delete-context';
import AppLayout from '@/layouts/app-layout';
import { printJob } from '@/lib/pos-printing';

interface Register {
    id: number;
    name: string;
    is_active: boolean;
    branch_id: number;
    branch: string | null;
    warehouse_id: number | null;
    warehouse: string | null;
    series: string | null;
    is_open: boolean;
    printer_driver: 'browser' | 'qz' | 'network';
    printer_name: string | null;
    printer_host: string | null;
    printer_port: number;
    paper_width: number | null;
    open_drawer: boolean;
    auto_print: boolean;
}

interface Props {
    registers: Register[];
    branches: { id: number; name: string }[];
    warehouses: { id: number; name: string }[];
    [key: string]: unknown;
}

const selectClass = 'w-full h-9 rounded-[4px] border border-slate-200 bg-white px-3 text-sm';
const headClass = 'uppercase text-[10px] tracking-wider text-slate-400 font-semibold';

export default function RegistersIndex() {
    const { registers, branches, warehouses } = usePage<Props>().props;
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<Register | null>(null);
    const { confirmDelete } = useConfirmDelete();

    const { data, setData, post, put, processing, reset, errors } = useForm({
        name: '',
        branch_id: '',
        warehouse_id: '',
        is_active: true,
        printer_driver: 'browser' as string,
        printer_name: '',
        printer_host: '',
        printer_port: 9100,
        paper_width: '' as string | number,
        open_drawer: false,
        auto_print: false,
    });

    const handleNew = () => {
        setEditing(null);
        reset();
        setData('branch_id', branches[0]?.id?.toString() ?? '');
        setOpen(true);
    };

    const handleEdit = (r: Register) => {
        setEditing(r);
        setData({
            name: r.name,
            branch_id: String(r.branch_id),
            warehouse_id: r.warehouse_id ? String(r.warehouse_id) : '',
            is_active: r.is_active,
            printer_driver: r.printer_driver,
            printer_name: r.printer_name ?? '',
            printer_host: r.printer_host ?? '',
            printer_port: r.printer_port ?? 9100,
            paper_width: r.paper_width ?? '',
            open_drawer: r.open_drawer,
            auto_print: r.auto_print,
        });
        setOpen(true);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const options = {
            onSuccess: () => {
                setOpen(false);
                reset();
            },
        };

        if (editing) {
            put(`/pos/registers/${editing.id}`, options);
        } else {
            post('/pos/registers', options);
        }
    };

    const remove = (r: Register) => {
        confirmDelete({
            url: `/pos/registers/${r.id}`,
            title: 'Remover Caixa',
            description: `Deseja remover a caixa "${r.name}"? O histórico de turnos é preservado.`,
            onSuccess: () => toast.success('Caixa removida!'),
        });
    };

    return (
        <>
            <Head title="Caixas" />

            <div className="space-y-4">
                <PageHeader
                    title="Caixas"
                    subtitle="Pontos de venda físicos da empresa. Cada turno é aberto numa caixa."
                    actions={
                        <PrimaryButton onClick={handleNew}>
                            <Plus className="h-4 w-4" />
                            Nova Caixa
                        </PrimaryButton>
                    }
                />

                <TableCard>
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50 border-b border-slate-100 hover:bg-slate-50">
                                <TableHead className={headClass}>Caixa</TableHead>
                                <TableHead className={headClass}>Filial</TableHead>
                                <TableHead className={headClass}>Armazém</TableHead>
                                <TableHead className={headClass}>Série</TableHead>
                                <TableHead className={`${headClass} text-center`}>Estado</TableHead>
                                <TableHead className={`${headClass} text-right w-[100px]`}>Acções</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {registers.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-40 text-center text-slate-400 text-sm">
                                        Nenhuma caixa configurada. Uma caixa principal é criada ao abrir o primeiro turno.
                                    </TableCell>
                                </TableRow>
                            )}
                            {registers.map((r) => (
                                <TableRow key={r.id} className="hover:bg-slate-50/50 border-b border-slate-100">
                                    <TableCell className="py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-[4px] bg-[#1A2332]/8 flex items-center justify-center">
                                                <Monitor className="h-4 w-4 text-[#1A2332]/60" />
                                            </div>
                                            <span className="font-semibold text-slate-900 text-sm">{r.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-slate-600 text-sm">{r.branch ?? '—'}</TableCell>
                                    <TableCell className="text-slate-600 text-sm">{r.warehouse ?? 'Predefinido'}</TableCell>
                                    <TableCell className="text-slate-600 text-sm">{r.series ?? 'Criada na 1.ª venda'}</TableCell>
                                    <TableCell className="text-center">
                                        {r.is_open ? (
                                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0 rounded-[4px]">Em uso</Badge>
                                        ) : r.is_active ? (
                                            <Badge variant="secondary" className="rounded-[4px]">Livre</Badge>
                                        ) : (
                                            <Badge variant="outline" className="rounded-[4px] text-slate-400">Inativa</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                title="Imprimir teste"
                                                className="h-8 w-8 text-slate-400 hover:text-[#2DB8A0] hover:bg-[#2DB8A0]/10 rounded-[4px]"
                                                onClick={() => printJob('test', r.id)}
                                            >
                                                <Printer className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-slate-400 hover:text-[#2DB8A0] hover:bg-[#2DB8A0]/10 rounded-[4px]"
                                                onClick={() => handleEdit(r)}
                                            >
                                                <Edit className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-[4px]"
                                                onClick={() => remove(r)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableCard>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="rounded-[4px]">
                    <form onSubmit={submit}>
                        <DialogHeader>
                            <DialogTitle className="text-base font-semibold text-slate-900">
                                {editing ? 'Editar Caixa' : 'Nova Caixa'}
                            </DialogTitle>
                            <DialogDescription className="text-xs text-slate-500">
                                O armazém define de onde sai o stock e a série define a numeração das vendas desta caixa.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="py-5 grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-slate-500">Nome *</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Ex: Caixa 1"
                                    className="h-9 rounded-[4px] border-slate-200"
                                />
                                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="branch_id" className="text-xs font-semibold uppercase tracking-wider text-slate-500">Filial *</Label>
                                <select id="branch_id" className={selectClass} value={data.branch_id} onChange={(e) => setData('branch_id', e.target.value)}>
                                    {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                                {errors.branch_id && <p className="text-xs text-red-500">{errors.branch_id}</p>}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="warehouse_id" className="text-xs font-semibold uppercase tracking-wider text-slate-500">Armazém</Label>
                                <select id="warehouse_id" className={selectClass} value={data.warehouse_id} onChange={(e) => setData('warehouse_id', e.target.value)}>
                                    <option value="">Predefinido da empresa</option>
                                    {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                                </select>
                                {errors.warehouse_id && <p className="text-xs text-red-500">{errors.warehouse_id}</p>}
                            </div>

                            <p className="text-xs text-slate-500 -mt-1">
                                A numeração das vendas é própria desta caixa (série criada automaticamente em cada ano).
                            </p>

                            <label className="flex items-center gap-2 text-sm text-slate-700">
                                <input
                                    type="checkbox"
                                    checked={data.is_active}
                                    onChange={(e) => setData('is_active', e.target.checked)}
                                />
                                Caixa ativa
                            </label>

                            <div className="border-t border-slate-100 pt-4 grid gap-4">
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Impressão</p>

                                <div className="grid gap-2">
                                    <Label htmlFor="printer_driver" className="text-xs text-slate-500">Como imprimir</Label>
                                    <select
                                        id="printer_driver"
                                        className={selectClass}
                                        value={data.printer_driver}
                                        onChange={(e) => setData('printer_driver', e.target.value)}
                                    >
                                        <option value="browser">Browser (diálogo de impressão)</option>
                                        <option value="qz">QZ Tray (ESC/POS directo, USB/série/rede)</option>
                                        <option value="network">Impressora de rede (ESC/POS, IP:porta)</option>
                                    </select>
                                </div>

                                {data.printer_driver === 'qz' && (
                                    <div className="grid gap-2">
                                        <Label htmlFor="printer_name" className="text-xs text-slate-500">Nome da impressora (como no sistema)</Label>
                                        <Input
                                            id="printer_name"
                                            value={data.printer_name}
                                            onChange={(e) => setData('printer_name', e.target.value)}
                                            placeholder="Ex: EPSON TM-T20"
                                            className="h-9 rounded-[4px] border-slate-200"
                                        />
                                        {errors.printer_name && <p className="text-xs text-red-500">{errors.printer_name}</p>}
                                        <p className="text-xs text-slate-400">Requer o QZ Tray em execução neste computador.</p>
                                    </div>
                                )}

                                {data.printer_driver === 'network' && (
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="grid gap-2 col-span-2">
                                            <Label htmlFor="printer_host" className="text-xs text-slate-500">Endereço IP</Label>
                                            <Input
                                                id="printer_host"
                                                value={data.printer_host}
                                                onChange={(e) => setData('printer_host', e.target.value)}
                                                placeholder="192.168.1.50"
                                                className="h-9 rounded-[4px] border-slate-200"
                                            />
                                            {errors.printer_host && <p className="text-xs text-red-500">{errors.printer_host}</p>}
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="printer_port" className="text-xs text-slate-500">Porta</Label>
                                            <Input
                                                id="printer_port"
                                                type="number"
                                                value={data.printer_port}
                                                onChange={(e) => setData('printer_port', Number(e.target.value))}
                                                className="h-9 rounded-[4px] border-slate-200"
                                            />
                                        </div>
                                        <p className="text-xs text-slate-400 col-span-3">
                                            O servidor tem de alcançar a impressora na rede.
                                        </p>
                                    </div>
                                )}

                                <div className="grid gap-2">
                                    <Label htmlFor="paper_width" className="text-xs text-slate-500">Largura do papel</Label>
                                    <select
                                        id="paper_width"
                                        className={selectClass}
                                        value={data.paper_width}
                                        onChange={(e) => setData('paper_width', e.target.value)}
                                    >
                                        <option value="">Definição da empresa</option>
                                        <option value="80">80 mm</option>
                                        <option value="58">58 mm</option>
                                    </select>
                                </div>

                                {data.printer_driver !== 'browser' && (
                                    <label className="flex items-center gap-2 text-sm text-slate-700">
                                        <input
                                            type="checkbox"
                                            checked={data.open_drawer}
                                            onChange={(e) => setData('open_drawer', e.target.checked)}
                                        />
                                        Abrir gaveta de dinheiro em vendas em dinheiro
                                    </label>
                                )}

                                <label className="flex items-center gap-2 text-sm text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={data.auto_print}
                                        onChange={(e) => setData('auto_print', e.target.checked)}
                                    />
                                    Imprimir o talão automaticamente após cada venda
                                </label>
                            </div>
                        </div>

                        <DialogFooter className="gap-2 border-t border-slate-100 pt-4">
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="inline-flex items-center h-9 px-3.5 text-sm font-medium border border-slate-200 bg-white text-slate-700 rounded-[4px] hover:bg-slate-50"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center h-9 px-3.5 text-sm font-semibold bg-[#E8A020] text-white rounded-[4px] hover:bg-[#d49218] disabled:opacity-60"
                            >
                                {processing ? 'A gravar...' : 'Guardar Caixa'}
                            </button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

RegistersIndex.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={[
        { title: 'POS', href: '/pos' },
        { title: 'Caixas', href: '/pos/registers' },
    ]}>
        {page}
    </AppLayout>
);
