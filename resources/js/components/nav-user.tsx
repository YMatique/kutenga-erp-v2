import { usePage } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import { ChevronsUpDown, LogOut, Settings, User } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { useInitials } from '@/hooks/use-initials';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

export function NavUser() {
    const { auth } = usePage<any>().props;
    const { state } = useSidebar();
    const isMobile = useIsMobile();
    const getInitials = useInitials();

    if (!auth.user) {
return null;
}

    const user = auth.user;

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="h-12 rounded-md border border-white/8 bg-white/5 hover:bg-white/10 transition-colors data-[state=open]:bg-white/10"
                            data-test="sidebar-menu-button"
                        >
                            {/* Avatar */}
                            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#E8A020]/20 flex-shrink-0 text-[#E8A020] font-semibold text-sm">
                                {getInitials(user.name ?? '')}
                            </div>

                            {state === 'expanded' && (
                                <div className="grid flex-1 text-left leading-tight ml-1 overflow-hidden">
                                    <span className="truncate text-sm font-medium text-white">
                                        {user.name}
                                    </span>
                                    <span className="truncate text-[11px] text-slate-400">
                                        {user.email}
                                    </span>
                                </div>
                            )}

                            {state === 'expanded' && (
                                <ChevronsUpDown className="ml-auto h-4 w-4 text-slate-500 flex-shrink-0" />
                            )}
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                        align="end"
                        side={isMobile ? 'bottom' : state === 'collapsed' ? 'right' : 'top'}
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="p-0 font-normal">
                            <div className="flex items-center gap-3 px-3 py-2.5">
                                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#E8A020]/15 text-[#E8A020] font-semibold text-sm flex-shrink-0">
                                    {getInitials(user.name ?? '')}
                                </div>
                                <div className="grid leading-tight">
                                    <span className="font-semibold text-sm text-slate-900">{user.name}</span>
                                    <span className="text-xs text-slate-500">{user.email}</span>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild className="gap-2 cursor-pointer">
                            <Link href="/settings/profile">
                                <User className="h-4 w-4 text-slate-400" />
                                Perfil
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="gap-2 cursor-pointer">
                            <Link href="/settings">
                                <Settings className="h-4 w-4 text-slate-400" />
                                Configurações
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild className="gap-2 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50">
                            <Link href="/logout" method="post" as="button" className="w-full">
                                <LogOut className="h-4 w-4" />
                                Terminar Sessão
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
