import { Link } from '@inertiajs/react';
import { BookOpen, FolderGit2, LayoutGrid, MapPin, Package } from 'lucide-react';
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
        title: 'Gestão de Unidades',
        href: '/branches',
        icon: MapPin,
    },
    {
        title: 'Catálogo de Itens',
        href: '/products',
        icon: Package,
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
