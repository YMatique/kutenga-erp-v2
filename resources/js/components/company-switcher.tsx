import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { usePage, router } from '@inertiajs/react';
import { Building2, ChevronsUpDown, Check, MapPin } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

export function CompanySwitcher() {
    const { auth, active_company_id, active_branch_id } = usePage<any>().props;
    const { state } = useSidebar();
    const sidebarOpen = state === 'expanded';

    const userCompany = auth.user?.company;
    const activeCompany = userCompany;
    const activeBranch = activeCompany?.branches?.find((b: any) => b.id === active_branch_id);

    const switchBranch = (branchId: number) => {
        router.post(
            '/context/switch',
            { company_id: activeCompany.id, branch_id: branchId },
            { preserveState: false },
        );
    };

    if (!activeCompany) return null;

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className={cn(
                                'h-12 rounded-md border border-white/8 bg-white/5 hover:bg-white/10 transition-colors',
                                'data-[state=open]:bg-white/10',
                            )}
                        >
                            {/* Logo mark */}
                            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#2DB8A0]/20 flex-shrink-0">
                                <Building2 className="h-4 w-4 text-[#2DB8A0]" />
                            </div>

                            {sidebarOpen && (
                                <div className="grid flex-1 text-left leading-tight ml-1 overflow-hidden">
                                    <span className="truncate text-sm font-semibold text-white">
                                        {activeCompany.name}
                                    </span>
                                    <span className="truncate text-[11px] text-slate-400">
                                        {activeBranch?.name || 'Selecionar Filial'}
                                    </span>
                                </div>
                            )}

                            {sidebarOpen && (
                                <ChevronsUpDown className="ml-auto h-4 w-4 text-slate-500 flex-shrink-0" />
                            )}
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                        align="start"
                        side="bottom"
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest px-2 py-1.5">
                            Filiais / Unidades
                        </DropdownMenuLabel>
                        {activeCompany.branches?.map((branch: any) => (
                            <DropdownMenuItem
                                key={branch.id}
                                onClick={() => switchBranch(branch.id)}
                                className="gap-2 p-2 cursor-pointer"
                            >
                                <div className="flex h-6 w-6 items-center justify-center rounded border border-slate-200">
                                    <MapPin className="h-3.5 w-3.5" />
                                </div>
                                <span className="flex-1 truncate">{branch.name}</span>
                                {active_branch_id === branch.id && (
                                    <Check className="h-4 w-4 text-[#2DB8A0]" />
                                )}
                            </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="gap-2 p-2 cursor-pointer font-medium text-[#2DB8A0]">
                            Gerenciar Empresas
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
