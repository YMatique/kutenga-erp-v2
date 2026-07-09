import { usePage } from '@inertiajs/react';
import { Search, Sun, Moon } from 'lucide-react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserMenuContent } from '@/components/user-menu-content';
import { useInitials } from '@/hooks/use-initials';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { BreadcrumbItem } from '@/types';
import { NotificationsDropdown } from '@/components/notifications-dropdown';
import { useAppearance } from '@/hooks/use-appearance';

type Props = {
    breadcrumbs?: BreadcrumbItem[];
};

export function AppHeader({ breadcrumbs = [] }: Props) {
    const page = usePage<any>();
    const { auth, notifications } = page.props;
    const getInitials = useInitials();
    const { resolvedAppearance, updateAppearance } = useAppearance();

    const toggleTheme = () => {
        updateAppearance(resolvedAppearance === 'dark' ? 'light' : 'dark');
    };

    return (
        <div className="flex w-full items-center justify-between gap-4">

            {/* Left: sidebar toggle + breadcrumbs */}
            <div className="flex items-center gap-2 min-w-0">
                <SidebarTrigger className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md h-8 w-8 flex-shrink-0 transition-colors" />
                <div className="h-4 w-px bg-slate-200 mx-1 hidden md:block flex-shrink-0" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>

            {/* Right: search, notifications, avatar */}
            <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md"
                >
                    <Search className="h-4 w-4" />
                </Button>

                <NotificationsDropdown notifications={notifications || []} />

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleTheme}
                    className="h-8 w-8 text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400 rounded-md"
                    title={resolvedAppearance === 'dark' ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
                >
                    {resolvedAppearance === 'dark' ? (
                        <Sun className="h-4 w-4 text-amber-500" />
                    ) : (
                        <Moon className="h-4 w-4" />
                    )}
                </Button>

                <div className="w-px h-4 bg-slate-200 mx-1" />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            className="h-8 px-1.5 gap-2 rounded-md hover:bg-slate-100"
                        >
                            <Avatar className="h-6 w-6 rounded-md overflow-hidden flex-shrink-0">
                                <AvatarImage src={auth.user?.avatar} alt={auth.user?.name} />
                                <AvatarFallback className="rounded-md bg-[#2DB8A0]/15 text-[#2DB8A0] text-[10px] font-bold">
                                    {getInitials(auth.user?.name ?? '')}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium text-slate-700 hidden sm:block max-w-[120px] truncate">
                                {auth.user?.name}
                            </span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end">
                        {auth.user && <UserMenuContent user={auth.user} />}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
