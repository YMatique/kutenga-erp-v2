import { Link } from '@inertiajs/react';
import {
    LayoutGrid,
    Package,
    Receipt,
    Settings,
    ShoppingCart,
    Users,
    Warehouse,
    MapPin,
} from 'lucide-react';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { CompanySwitcher } from '@/components/company-switcher';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    useSidebar,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';
import { cn } from '@/lib/utils';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Catálogo',
        icon: Package,
        items: [
            { title: 'Produtos & Serviços', href: '/products' },
            { title: 'Categorias', href: '/categories' },
            { title: 'Marcas', href: '/brands' },
            { title: 'Unidades', href: '/units' },
        ],
    },
    {
        title: 'Inventário',
        icon: Warehouse,
        items: [
            { title: 'Dashboard', href: '/inventory' },
            { title: 'Movimentos', href: '/inventory/movements' },
            { title: 'Armazéns', href: '/inventory/warehouses' },
            { title: 'Transferências', href: '/inventory/transfers' },
            { title: 'Ajustes de Stock', href: '/inventory/adjustments' },
            { title: 'Stock', href: '/inventory/stocks' },
            { title: 'Opening Balance', href: '/inventory/opening' },
        ],
    },
    {
        title: 'Faturação',
        icon: Receipt,
        items: [
            { title: 'Cotações', href: '/billing/quotes' },
            { title: 'Faturas a Crédito', href: '/billing/invoices' },
            { title: 'Faturas-Recibo', href: '/billing/receipts' },
            { title: 'Notas de Crédito', href: '/billing/credit-notes' },
            { title: 'Notas de Débito', href: '/billing/debit-notes' },
            { title: 'Clientes', href: '/billing/customers' },
            { title: 'Pagamentos', href: '/payments' },
        ],
    },
    {
        title: 'Ponto de Venda',
        icon: ShoppingCart,
        items: [
            { title: 'Ir para o POS', href: '/pos' },
            { title: 'Turnos / Sessões', href: '/pos/shifts' },
            { title: 'Abrir Turno', href: '/pos/shifts/open' },
        ],
    },
    {
        title: 'Unidades',
        icon: MapPin,
        items: [
            { title: 'Empresas', href: '/companies' },
            { title: 'Filiais', href: '/branches' },
        ],
    },
    {
        title: 'Utilizadores',
        icon: Users,
        items: [
            { title: 'Usuários', href: '/settings/users' },
            { title: 'Funções', href: '/settings/roles' },
        ],
    },
    {
        title: 'Configurações',
        icon: Settings,
        items: [
            { title: 'Sistema', href: '/settings/company' },
            { title: 'Auditoria', href: '/settings/audits' },
        ],
    },
];

export function AppSidebar() {
    const { state } = useSidebar();
    const sidebarOpen = state === 'expanded';

    return (
        <Sidebar
            collapsible="icon"
            className="bg-transparent border-none shadow-none"
        >
            {/* Logo area */}
            <SidebarHeader className="px-3 py-3 border-b border-white/6">
                <Link
                    href={dashboard()}
                    className={cn(
                        'flex items-center gap-3 h-10 rounded-md px-1 transition-all',
                        'hover:opacity-90',
                    )}
                >
                    <div className="flex h-8 w-8 items-center justify-center flex-shrink-0">
                        <img
                            src="/kutenga-logo.png"
                            alt="Kutenga"
                            className="h-8 w-8 object-contain"
                        />
                    </div>
                    {sidebarOpen && (
                        <div className="leading-tight overflow-hidden">
                            <span className="text-white font-bold text-[15px] tracking-tight block truncate">
                                Kutenga
                            </span>
                            <span className="text-slate-500 text-[10px] font-medium tracking-widest uppercase block">
                                ERP
                            </span>
                        </div>
                    )}
                </Link>

                {/* Branch/Company switcher */}
                <div className="mt-3">
                    <CompanySwitcher />
                </div>
            </SidebarHeader>

            <SidebarContent className="overflow-y-auto overflow-x-hidden py-2">
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter className="border-t border-white/6 px-3 py-3">
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
