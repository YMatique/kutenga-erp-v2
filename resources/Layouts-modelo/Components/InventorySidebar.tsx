import { Link, usePage } from '@inertiajs/react';
import {
    Package,
    Truck,
    MapPin,
    Warehouse,
    Users,
    ClipboardList,
    Layers,
    X,
    ScanBarcode,
    RefreshCw,
    ArrowRightLeft,
    TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface InventorySidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export function InventorySidebar({ isOpen, onClose }: InventorySidebarProps) {
    const { url } = usePage();

    const navigation = [
        {
            name: 'Dashboard',
            href: '/inventory',
            icon: Package,
            active: url === '/inventory' || url === '/inventory/'
        },
        {
            name: 'Operações',
            href: '/inventory/transfers',
            icon: ArrowRightLeft,
            active: url.startsWith('/inventory/transfers')
        },
        {
            name: 'Movimentações Avulsas',
            href: '/inventory/movements',
            icon: Truck,
            active: url.startsWith('/inventory/movements')
        },
        {
            name: 'Armazéns',
            href: '/inventory/warehouses',
            icon: Warehouse,
            active: url.startsWith('/inventory/warehouses')
        },
        {
            name: 'Lotes / Séries',
            href: '/inventory/lots',
            icon: ScanBarcode,
            active: url.startsWith('/inventory/lots')
        },
        {
            name: 'Níveis de Stock',
            href: '/inventory/stock-levels',
            icon: Layers,
            active: url.startsWith('/inventory/stock-levels')
        },
        {
            name: 'Regras de Reposição',
            href: '/inventory/rules',
            icon: RefreshCw,
            active: url.startsWith('/inventory/rules')
        },
        {
            name: 'Reposição',
            href: '/inventory/replenishment',
            icon: TrendingUp,
            active: url.startsWith('/inventory/replenishment')
        },
        {
            name: 'Localizações',
            href: '/inventory/locations',
            icon: MapPin,
            active: url.startsWith('/inventory/locations')
        },
        {
            name: 'Parceiros',
            href: '/inventory/partners',
            icon: Users,
            active: url.startsWith('/inventory/partners')
        },
        {
            name: 'Relatórios',
            href: '/inventory/reports',
            icon: TrendingUp,
            active: url.startsWith('/inventory/reports')
        },
        {
            name: 'Inventário Físico',
            href: '/inventory/counts',
            icon: ClipboardList,
            active: url.startsWith('/inventory/counts')
        },
    ];

    return (
        <TooltipProvider delayDuration={0}>
            {/* Desktop Sidebar - Suspended, Colapsável */}
            <aside
                className={cn(
                    "fixed left-0 z-40 transition-all duration-300 ease-in-out",
                    "hidden md:block",
                    "top-24 ml-4 bottom-4",
                    isOpen ? "w-64" : "w-16"
                )}
            >
                <div className="h-full border border-zinc-200 dark:border-zinc-800 rounded-md bg-zinc-50 dark:bg-zinc-900/50 flex flex-col overflow-hidden">
                    {/* Sidebar Header */}
                    <div className={cn(
                        "p-4 border-b border-zinc-200 dark:border-zinc-800 transition-all",
                        !isOpen && "p-2"
                    )}>
                        {isOpen ? (
                            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">
                                Inventário
                            </h3>
                        ) : (
                            <div className="flex justify-center">
                                <Package className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
                            </div>
                        )}
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
                        {navigation.map((item) => {
                            const Icon = item.icon;

                            if (!isOpen) {
                                // Collapsed: Show icon only with tooltip
                                return (
                                    <Tooltip key={item.name}>
                                        <TooltipTrigger asChild>
                                            <Link
                                                href={item.href}
                                                className={cn(
                                                    "flex items-center justify-center h-10 rounded-md transition-colors",
                                                    item.active
                                                        ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700"
                                                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100"
                                                )}
                                            >
                                                <Icon className="h-4 w-4 flex-shrink-0" />
                                            </Link>
                                        </TooltipTrigger>
                                        <TooltipContent side="right" className="font-medium">
                                            {item.name}
                                        </TooltipContent>
                                    </Tooltip>
                                );
                            }

                            // Expanded: Show icon + text
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-colors",
                                        item.active
                                            ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700"
                                            : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100"
                                    )}
                                >
                                    <Icon className="h-4 w-4 flex-shrink-0" />
                                    <span>{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </aside>

            {/* Mobile Sidebar - Sheet/Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-zinc-900/50 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Sidebar Panel - Floating with margin */}
                    <aside className="absolute top-4 left-4 bottom-4 w-64">
                        <div className="h-full border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 flex flex-col">
                            {/* Mobile Header with Close */}
                            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">
                                    Inventário
                                </h3>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={onClose}
                                    className="h-8 w-8 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Navigation */}
                            <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
                                {navigation.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            onClick={onClose}
                                            className={cn(
                                                "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-colors",
                                                item.active
                                                    ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700"
                                                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100"
                                            )}
                                        >
                                            <Icon className="h-4 w-4 flex-shrink-0" />
                                            <span>{item.name}</span>
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>
                    </aside>
                </div>
            )}
        </TooltipProvider>
    );
}
