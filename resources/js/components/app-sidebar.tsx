import { Link } from '@inertiajs/react';
import { BookOpen, FolderGit2, LayoutGrid, MapPin, Package, Receipt, Settings, ShoppingCart, Users, Warehouse } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { CompanySwitcher } from '@/components/company-switcher';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';
import { useSidebar } from '@/components/ui/sidebar';
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
            {title:'Dashboard', href:'/inventory'},
            { title: 'Movimentos', href: '/inventory/movements' },
            { title: 'Armazéns', href: '/inventory/warehouses' },
            { title: 'Transferências', href: '/inventory/transfers' },
            {title: 'Ajustes de Stock', href: '/inventory/adjustments' },
            { title: 'Stock', href: '/inventory/stocks' },
            {title: 'Opening Balance', href:'/inventory/opening'}
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
            { title: 'Clientes', href: '/billing/customers' },
            { title: 'Pagamentos', href: '/payments' },
        ],
    },

    {
        title: 'Ponto de Venda',
        icon: ShoppingCart,
        items: [
            { title: 'Caixa', href: '/pos' },
            { title: 'Sessões', href: '/pos/sessions' },
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
            { title: 'Usuários', href: '/users' },
            { title: 'Funções', href: '/roles' },
        ],
    },

    {
        title: 'Configurações',
        icon: Settings,
        items: [
            { title: 'Sistema', href: '/settings' },
            { title: 'Auditoria', href: '/audit' },
        ],
    },
];


const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: FolderGit2,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

export function AppSidebar() {
    const { state, isMobile } = useSidebar();
    const sidebarOpen = state === "expanded";

    return (
        <Sidebar 
            collapsible="icon" 
            className="bg-transparent border-none shadow-none"
        >
            <SidebarHeader className="p-2">
                <CompanySwitcher />
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
