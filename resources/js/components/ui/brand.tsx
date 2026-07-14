import { type ReactNode } from 'react';
import * as React from 'react';
import { cn } from '@/lib/utils';
import { Slot } from '@radix-ui/react-slot';

interface PageHeaderProps {
    title: ReactNode;
    subtitle?: string;
    actions?: ReactNode;
    className?: string;
}

/**
 * Standard Kutenga page header — left title+subtitle, right action buttons.
 * Matches the mockup: bg-white card, border-b, 4px radius cap.
 */
export function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
    return (
        <div
            className={cn(
                'flex flex-col sm:flex-row sm:items-center justify-between gap-4',
                'bg-white rounded-[4px] border border-slate-200 px-6 py-4 mb-4 shadow-xs',
                className,
            )}
        >
            <div>
                <h1 className="text-[18px] font-semibold text-slate-900 leading-tight">
                    {title}
                </h1>
                {subtitle && (
                    <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
                )}
            </div>
            {actions && (
                <div className="flex items-center gap-2 flex-shrink-0">
                    {actions}
                </div>
            )}
        </div>
    );
}

interface KpiCardProps {
    label: string;
    value: ReactNode;
    icon: ReactNode;
    accent?: 'teal' | 'gold' | 'orange' | 'red' | 'slate';
    description?: string;
}

const accentMap = {
    teal:   { value: 'text-[#2DB8A0]', icon: 'bg-[#2DB8A0]/10 text-[#2DB8A0]' },
    gold:   { value: 'text-[#E8A020]', icon: 'bg-[#E8A020]/10 text-[#E8A020]' },
    orange: { value: 'text-orange-500', icon: 'bg-orange-50 text-orange-500' },
    red:    { value: 'text-red-500',    icon: 'bg-red-50 text-red-500' },
    slate:  { value: 'text-slate-700',  icon: 'bg-slate-100 text-slate-500' },
};

/**
 * KPI metric card — white bg, 1px border, 4px radius, colored value + icon.
 */
export function KpiCard({ label, value, icon, accent = 'teal', description }: KpiCardProps) {
    const colors = accentMap[accent];

    return (
        <div className="bg-white border border-slate-200 rounded-[4px] px-5 py-4 shadow-xs">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-[12px] font-medium text-slate-500 uppercase tracking-wide leading-none mb-2">
                        {label}
                    </p>
                    <p className={cn('text-[28px] font-bold leading-none tracking-tight', colors.value)}>
                        {value}
                    </p>
                    {description && (
                        <p className="text-[12px] text-slate-400 mt-1.5">{description}</p>
                    )}
                </div>
                <div className={cn('h-9 w-9 rounded-[4px] flex items-center justify-center flex-shrink-0', colors.icon)}>
                    {icon}
                </div>
            </div>
        </div>
    );
}

/**
 * Stock status badge — dot indicator + soft background, 4px radius.
 */
export function StockBadge({
    status,
}: {
    status: 'in_stock' | 'low' | 'out_of_stock' | 'active' | 'inactive';
}) {
    const map = {
        in_stock:    { dot: 'bg-[#2DB8A0]', text: 'Em Estoque', cls: 'bg-[#2DB8A0]/10 text-[#2DB8A0]' },
        low:         { dot: 'bg-[#E8A020]', text: 'Baixo',      cls: 'bg-[#E8A020]/10 text-[#E8A020]' },
        out_of_stock:{ dot: 'bg-red-500',   text: 'Esgotado',   cls: 'bg-red-50 text-red-600' },
        active:      { dot: 'bg-[#2DB8A0]', text: 'Ativo',      cls: 'bg-[#2DB8A0]/10 text-[#2DB8A0]' },
        inactive:    { dot: 'bg-slate-400', text: 'Inativo',     cls: 'bg-slate-100 text-slate-500' },
    };
    const { dot, text, cls } = map[status];

    return (
        <span className={cn('inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-[4px]', cls)}>
            <span className={cn('h-1.5 w-1.5 rounded-full flex-shrink-0', dot)} />
            {text}
        </span>
    );
}

/**
 * Standard table container card.
 */
export function TableCard({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <div className={cn('bg-white border border-slate-200 rounded-[4px] shadow-xs overflow-hidden', className)}>
            {children}
        </div>
    );
}

export interface BrandedButtonProps extends React.ComponentProps<"button"> {
    asChild?: boolean;
}

/**
 * Branded outline button — for secondary actions.
 */
export function OutlineButton({
    className,
    asChild = false,
    ...props
}: BrandedButtonProps) {
    const Comp = asChild ? Slot : "button";
    return (
        <Comp
            className={cn(
                'inline-flex items-center gap-1.5 h-9 px-3.5 text-sm font-medium justify-center',
                'border border-slate-200 bg-white text-slate-700 rounded-[4px]',
                'hover:bg-slate-50 hover:border-slate-300 transition-colors',
                'disabled:pointer-events-none disabled:opacity-50',
                className,
            )}
            {...props}
        />
    );
}

/**
 * Branded primary button — mustard gold for CTA actions.
 */
export function PrimaryButton({
    className,
    asChild = false,
    ...props
}: BrandedButtonProps) {
    const Comp = asChild ? Slot : "button";
    return (
        <Comp
            className={cn(
                'inline-flex items-center gap-1.5 h-9 px-3.5 text-sm font-semibold justify-center',
                'bg-[#E8A020] text-white rounded-[4px]',
                'hover:bg-[#d49218] transition-colors',
                'disabled:pointer-events-none disabled:opacity-50',
                className,
            )}
            {...props}
        />
    );
}
