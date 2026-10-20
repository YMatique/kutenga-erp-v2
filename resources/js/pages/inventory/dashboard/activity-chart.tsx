import { Activity } from 'lucide-react';
import { useState } from 'react';
import { TableCard } from '@/components/ui/brand';
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

export type ActivityDay = { date: string; entries: number; exits: number; movements: number };

// Entradas e saídas: duas séries categóricas validadas (teal/laranja; degraus próprios para o modo escuro).
// O vermelho fica reservado aos estados críticos.
const ENTRY = 'bg-[#2DB8A0] dark:bg-[#1fa08a]';
const EXIT = 'bg-[#eb6834] dark:bg-[#d95926]';

const PLOT_HEIGHT = 'h-40';

const money = (n: number) => new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(n);
const compact = (n: number) => new Intl.NumberFormat('pt-MZ', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
const parse = (date: string) => new Date(`${date}T00:00:00`);
const shortDay = (date: string) => parse(date).toLocaleDateString('pt-MZ', { day: '2-digit', month: '2-digit' });
// Só a primeira letra em maiúscula ("Sexta, 9 de outubro"), não cada palavra
const longDay = (date: string) => {
    const text = parse(date).toLocaleDateString('pt-MZ', { weekday: 'long', day: 'numeric', month: 'long' });

    return text.charAt(0).toUpperCase() + text.slice(1);
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

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
    if (value <= 0) {
        return <div className="w-full max-w-[12px]" />;
    }

    return (
        <div
            className={cn('w-full max-w-[12px] rounded-t-[4px] transition-[filter] group-hover:brightness-110', color)}
            style={{ height: `${(value / max) * 100}%`, minHeight: 2 }}
        />
    );
}

function Key({ color, label, value }: { color: string; label: string; value?: string }) {
    return (
        <span className="inline-flex items-center gap-1.5 text-xs">
            <span className={cn('h-2.5 w-2.5 rounded-[2px]', color)} />
            <span className="text-foreground">{label}</span>
            {value && <span className="text-muted-foreground">{value}</span>}
        </span>
    );
}

export default function ActivityChart({ days }: { days: ActivityDay[] }) {
    const [view, setView] = useState<'chart' | 'table'>('chart');
    const [active, setActive] = useState<number | null>(null);

    const totalEntries = days.reduce((sum, d) => sum + d.entries, 0);
    const totalExits = days.reduce((sum, d) => sum + d.exits, 0);
    const totalMovements = days.reduce((sum, d) => sum + d.movements, 0);

    const max = niceMax(Math.max(...days.map((d) => Math.max(d.entries, d.exits)), 0));
    const ticks = [0, max / 2, max];

    const hovered = active !== null ? days[active] : null;
    const position = active !== null ? ((active + 0.5) / days.length) * 100 : 0;

    return (
        <TableCard>
            <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-4 border-b border-border">
                <div>
                    <h2 className="text-sm font-semibold text-foreground">Atividade de Stock</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Valor das entradas e saídas nos últimos {days.length} dias, ao custo atual (sem o stock inicial)
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    <Key color={ENTRY} label="Entradas" value={money(totalEntries)} />
                    <Key color={EXIT} label="Saídas" value={money(totalExits)} />
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
            </div>

            {totalMovements === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                    <Activity className="h-7 w-7" />
                    <span className="text-sm">Sem entradas nem saídas nos últimos {days.length} dias.</span>
                </div>
            ) : view === 'chart' ? (
                <div className="px-5 pt-5 pb-4">
                    <div className="flex">
                        {/* Eixo vertical: valores redondos, sem rótulo em cada barra */}
                        <div className={cn('relative w-12 shrink-0', PLOT_HEIGHT)}>
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

                        <div className={cn('relative flex-1', PLOT_HEIGHT)} onMouseLeave={() => setActive(null)}>
                            {ticks.map((tick) => (
                                <div
                                    key={tick}
                                    className="absolute inset-x-0 border-t border-border"
                                    style={{ bottom: `${(tick / max) * 100}%` }}
                                />
                            ))}

                            <div className="absolute inset-0 flex">
                                {days.map((day, index) => (
                                    <div
                                        key={day.date}
                                        tabIndex={0}
                                        role="img"
                                        aria-label={`${longDay(day.date)}: entradas ${money(day.entries)}, saídas ${money(day.exits)}, ${day.movements} movimentos`}
                                        onMouseEnter={() => setActive(index)}
                                        onFocus={() => setActive(index)}
                                        onBlur={() => setActive(null)}
                                        className="group relative flex h-full min-w-0 flex-1 items-end justify-center gap-[2px] rounded-[2px] outline-none hover:bg-muted/40 focus-visible:bg-muted/60"
                                    >
                                        <Bar value={day.entries} max={max} color={ENTRY} />
                                        <Bar value={day.exits} max={max} color={EXIT} />
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
                                    <p className="font-medium">{longDay(hovered.date)}</p>
                                    <div className="mt-1.5 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className={cn('h-[3px] w-3 rounded-full', ENTRY)} />
                                            <span className="font-semibold">{money(hovered.entries)}</span>
                                            <span className="text-muted-foreground">Entradas</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={cn('h-[3px] w-3 rounded-full', EXIT)} />
                                            <span className="font-semibold">{money(hovered.exits)}</span>
                                            <span className="text-muted-foreground">Saídas</span>
                                        </div>
                                    </div>
                                    <p className="mt-1.5 text-muted-foreground">
                                        {hovered.movements} movimento{hovered.movements !== 1 ? 's' : ''}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Eixo horizontal: uma data de 7 em 7 dias, a contar do último, para nunca ficarem coladas */}
                    <div className="mt-1.5 ml-12 flex">
                        {days.map((day, index) => (
                            <div key={day.date} className="relative h-4 min-w-0 flex-1">
                                {(days.length - 1 - index) % 7 === 0 && (
                                    <span
                                        className={cn(
                                            'absolute top-0 whitespace-nowrap text-[10px] text-muted-foreground',
                                            index === days.length - 1 ? 'right-0' : 'left-1/2 -translate-x-1/2',
                                        )}
                                    >
                                        {shortDay(day.date)}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="max-h-80 overflow-y-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border">
                                <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground h-9">Dia</TableHead>
                                <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground h-9 text-right">Entradas</TableHead>
                                <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground h-9 text-right">Saídas</TableHead>
                                <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground h-9 text-right">Movimentos</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[...days]
                                .reverse()
                                .filter((day) => day.movements > 0)
                                .map((day) => (
                                    <TableRow key={day.date} className="border-b border-border hover:bg-muted/50">
                                        <TableCell className="py-2.5 text-sm">{longDay(day.date)}</TableCell>
                                        <TableCell className="py-2.5 text-sm text-right font-mono">{money(day.entries)}</TableCell>
                                        <TableCell className="py-2.5 text-sm text-right font-mono">{money(day.exits)}</TableCell>
                                        <TableCell className="py-2.5 text-sm text-right font-mono">{day.movements}</TableCell>
                                    </TableRow>
                                ))}
                        </TableBody>
                        <TableFooter>
                            <TableRow>
                                <TableCell className="text-sm font-semibold">Total</TableCell>
                                <TableCell className="text-sm text-right font-mono font-semibold">{money(totalEntries)}</TableCell>
                                <TableCell className="text-sm text-right font-mono font-semibold">{money(totalExits)}</TableCell>
                                <TableCell className="text-sm text-right font-mono font-semibold">{totalMovements}</TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </div>
            )}
        </TableCard>
    );
}
