import { Link, usePage } from '@inertiajs/react';
import { Search, Bell, Moon, Sun, Menu } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { SharedData } from '@/types';
import type {BreadcrumbItem as BreadcrumbItemType} from '@/types';

export function InventoryHeader({
    breadcrumbs = [],
    sidebarOpen,
    onToggleSidebar,
}: {
    breadcrumbs?: BreadcrumbItemType[];
    sidebarOpen?: boolean;
    onToggleSidebar?: () => void;
}) {
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        if (document.documentElement.classList.contains('dark')) {
            setIsDarkMode(true);
        }
    }, []);

    const toggleDarkMode = () => {
        const html = document.documentElement;

        if (html.classList.contains('dark')) {
            html.classList.remove('dark');
            setIsDarkMode(false);
            localStorage.setItem('theme', 'light');
        } else {
            html.classList.add('dark');
            setIsDarkMode(true);
            localStorage.setItem('theme', 'dark');
        }
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-50 mt-4 mx-4">
            <div className="h-16 border border-zinc-200 dark:border-zinc-800 rounded-md bg-white dark:bg-zinc-900 flex items-center justify-between px-6">
                <div className="flex items-center gap-4">
                    {/* Sidebar Toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onToggleSidebar}
                        className="h-9 w-9 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle Sidebar</span>
                    </Button>

                    {/* Breadcrumbs */}
                    {breadcrumbs.length > 0 && (
                        <div className="hidden md:flex border-l border-zinc-200 dark:border-zinc-800 pl-4">
                            <Breadcrumbs breadcrumbs={breadcrumbs} />
                        </div>
                    )}
                </div>

                {/* Right Side Actions */}
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleDarkMode}
                        className="h-9 w-9 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                        {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="relative h-9 w-9 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                        <Bell className="h-5 w-5" />
                        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
                    </Button>

                    <HeaderUser />
                </div>
            </div>
        </header>
    );
}

function HeaderUser() {
    const { auth } = usePage<SharedData>().props;

    if (!auth.user) {
return null;
}

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 ml-2">
                    <Avatar className="h-9 w-9 border border-zinc-200 dark:border-zinc-700">
                        <AvatarImage src={auth.user.avatar} alt={auth.user.name} />
                        <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-medium">
                            {auth.user.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{auth.user.name}</p>
                        <p className="text-xs text-zinc-500">
                            {auth.user.email}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href={route('tenant.profile.edit')}>
                        Perfil
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="#">
                        Configurações
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link
                        href={route('tenant.logout')}
                        method="post"
                        as="button"
                        className="w-full text-left text-red-600 dark:text-red-400"
                    >
                        Sair
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
