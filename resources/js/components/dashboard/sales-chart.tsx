import { TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { TableCard } from '@/components/ui/brand';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn, formatCurrency } from '@/lib/utils';

export type SalesMonth = { month: string; value: number; current: boolean };

// Uma única série: a cor é a da marca (degrau próprio para o modo escuro, validado contra a superfície escura).
const BAR = 'bg-[#2DB8A0] dark:bg-[#1fa08a]';

const compact = (n: number) => new Intl.NumberFormat('pt-MZ', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
const monthDate = (month: string) => new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1, 1);
const longMonth = (month: string) => {
    const text = monthDate(month).toLocaleDateString('pt-MZ', { month: 'long', year: 'numeric' });

    return text.charAt(0).toUpperCase() + text.slice(1);
};

/** Mês abreviado; o ano só aparece no primeiro mês e em janeiro, para não repetir em todos. */
const axisLabel = (month: string, index: number) => {
    const short = monthDate(month).toLocaleDateString('pt-MZ', { month: 'short' });

    return index === 0 || month.endsWith('-01') ? `${short} ${month.slice(0, 4)}` : short;
};

/** Arredonda o máximo para um número "redondo" (1, 2, 5 × 10ⁿ) para os rótulos do eixo serem limpos. */
function niceMax(value: number): number {
    if (value <= 0) {
        return 1;
    }

    const exponent = Math.floor(Math.log10(value));
    const fraction = value / 10 ** exponent;
    const nice = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;

    return nice * 10 ** exponent;
}

export default function SalesChart({ months }: { months: SalesMonth[] }) {
    const [view, setView] = useState<'chart' | 'table'>('chart');
    const [active, setActive] = useState<number | null>(null);

    const max = niceMax(Math.max(...months.map((m) => m.value), 0));
    const ticks = [0, max / 2, max];
    const hasData = months.some((m) => m.value !== 0);

    const hovered = active !== null ? months[active] : null;
    const position = active !== null ? ((active + 0.5) / months.length) * 100 : 0;

    return (
        <TableCard className="flex h-full flex-col">
            <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-4 border-b border-border">
                <div>
                    <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-[#2DB8A0]" />
                        <h2 className="text-sm font-semibold text-foreground">Faturação mensal</h2>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Faturas e faturas-recibo menos notas de crédito, com IVA, por data de emissão
                    </p>
                </div>
                <div className="inline-flex rounded-[4px] border border-border overflow-hidden text-xs" role="group" aria-label="Tipo de vista">
                    {(['chart', 'table'] as const).map((option) => (
                        <button
                            key={option}
                            type="button"
                            aria-pressed={view === option}
                            onClick={() => setView(option)}
                            className={cn(
                                'px-2.5 py-1 transition-colors',
                                view === option ? 'bg-muted text-foreground font-medium' : 'text-muted-foreground hover:bg-muted/50',
                            )}
                        >
                            {option === 'chart' ? 'Gráfico' : 'Tabela'}
                        </button>
                    ))}
                </div>
            </div>

            {!hasData ? (
                <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                    <TrendingUp className="h-7 w-7" />
                    <span className="text-sm">Ainda não há faturação nos últimos {months.length} meses.</span>
                </div>
            ) : view === 'chart' ? (
                <div className="flex flex-1 flex-col px-5 pt-6 pb-4">
                    <div className="flex min-h-44 flex-1">
                        <div className="relative w-12 shrink-0">
                            {ticks.map((tick) => (
                                <span
                                    key={tick}
                                    className="absolute right-2 translate-y-1/2 text-[10px] text-muted-foreground leading-none"
                                    style={{ bottom: `${(tick / max) * 100}%` }}
                                >
                                    {tick === 0 ? '0' : compact(tick)}
                                </span>
                            ))}
                        </div>

                        <div className="relative flex-1" onMouseLeave={() => setActive(null)}>
                            {ticks.map((tick) => (
                                <div
                                    key={tick}
                                    className="absolute inset-x-0 border-t border-border"
                                    style={{ bottom: `${(tick / max) * 100}%` }}
                                />
                            ))}

                            <div className="absolute inset-0 flex">
                                {months.map((item, index) => (
                                    <div
                                        key={item.month}
                                        tabIndex={0}
                                        role="img"
                                        aria-label={`${longMonth(item.month)}${item.current ? ' (mês em curso)' : ''}: ${formatCurrency(item.value)}`}
                                        onMouseEnter={() => setActive(index)}
                                        onFocus={() => setActive(index)}
                                        onBlur={() => setActive(null)}
                                        className="group relative flex h-full min-w-0 flex-1 items-end justify-center rounded-[2px] outline-none hover:bg-muted/40 focus-visible:bg-muted/60"
                                    >
                                        {item.value > 0 && (
                                            <div
                                                className={cn(
                                                    'w-full max-w-[24px] rounded-t-[4px] transition-[filter] group-hover:brightness-110',
                                                    BAR,
                                                    // O mês em curso ainda não acabou: fica mais leve, para não parecer uma queda
                                                    item.current && 'opacity-60',
                                                )}
                                                style={{ height: `${(Math.max(item.value, 0) / max) * 100}%`, minHeight: 2 }}
                                            />
                                        )}
                                        {item.current && item.value > 0 && (
                                            <span
                                                className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-[10px] font-semibold text-foreground whitespace-nowrap"
                                                style={{ bottom: `calc(${(item.value / max) * 100}% + 4px)` }}
                                            >
                                                {compact(item.value)}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {hovered && (
                                <div
                                    role="tooltip"
                                    className="pointer-events-none absolute top-0 z-10 min-w-[170px] rounded-[4px] border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md"
                                    style={{
                                        left: `${position}%`,
                                        transform: `translateX(${position < 20 ? '-10%' : position > 80 ? '-90%' : '-50%'})`,
                                    }}
                                >
                                    <p className="font-medium">{longMonth(hovered.month)}</p>
                                    <div className="mt-1.5 flex items-center gap-2">
                                        <span className={cn('h-[3px] w-3 rounded-full', BAR)} />
                                        <span className="font-semibold">{formatCurrency(hovered.value)}</span>
                                    </div>
                                    {hovered.current && <p className="mt-1.5 text-muted-foreground">Mês em curso, ainda por fechar</p>}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-1.5 ml-12 flex">
                        {months.map((item, index) => (
                            <div key={item.month} className="min-w-0 flex-1 text-center text-[10px] text-muted-foreground whitespace-nowrap">
                                {axisLabel(item.month, index)}
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border">
                            <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground h-9">Mês</TableHead>
                            <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground h-9 text-right">Faturado (líquido)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {[...months].reverse().map((item) => (
                            <TableRow key={item.month} className="border-b border-border hover:bg-muted/50">
                                <TableCell className="py-2.5 text-sm">
                                    {longMonth(item.month)}
                                    {item.current && <span className="ml-2 text-xs text-muted-foreground">em curso</span>}
                                </TableCell>
                                <TableCell className="py-2.5 text-sm text-right font-mono">{formatCurrency(item.value)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </TableCard>
    );
}
