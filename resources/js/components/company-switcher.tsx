import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { usePage, router } from '@inertiajs/react';
import { Building2, ChevronsUpDown, Check, MapPin } from 'lucide-react';
import { useAppLayout } from '@/contexts/app-layout-context';

export function CompanySwitcher() {
    const { auth, active_company_id, active_branch_id } = usePage<any>().props;
    const { sidebarOpen } = useAppLayout();
    
    const userCompany = auth.user?.company;
    const activeCompany = userCompany; // For now assuming user only sees their own company
    const activeBranch = activeCompany?.branches?.find((b: any) => b.id === active_branch_id);

    const switchBranch = (branchId: number) => {
        // We'll implement a route for this soon
        router.post(route('context.switch'), {
            company_id: activeCompany.id,
            branch_id: branchId
        }, {
            preserveState: false,
        });
    };

    if (!activeCompany) return null;

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm"
                        >
                            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-zinc-900 text-sidebar-primary-foreground dark:bg-zinc-100 dark:text-zinc-900">
                                <Building2 className="size-4" />
                            </div>
                            <div className="grid flex-1 text-left text-sm leading-tight ml-2">
                                <span className="truncate font-semibold text-zinc-900 dark:text-zinc-100">
                                    {activeCompany.name}
                                </span>
                                <span className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                                    {activeBranch?.name || 'Selecionar Filial'}
                                </span>
                            </div>
                            <ChevronsUpDown className="ml-auto size-4 opacity-50" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                        align="start"
                        side="bottom"
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="text-xs text-zinc-500 font-medium px-2 py-1.5 uppercase tracking-wider">
                            Filiais / Unidades
                        </DropdownMenuLabel>
                        {activeCompany.branches?.map((branch: any) => (
                            <DropdownMenuItem
                                key={branch.id}
                                onClick={() => switchBranch(branch.id)}
                                className="gap-2 p-2 cursor-pointer"
                            >
                                <div className="flex size-6 items-center justify-center rounded-sm border border-zinc-200 dark:border-zinc-800">
                                    <MapPin className="size-4" />
                                </div>
                                <span className="flex-1 truncate">{branch.name}</span>
                                {active_branch_id === branch.id && (
                                    <Check className="size-4 text-zinc-500" />
                                )}
                            </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="gap-2 p-2 cursor-pointer font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700">
                            Gerenciar Empresas
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
