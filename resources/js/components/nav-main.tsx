import { Link } from '@inertiajs/react';
import { ChevronRight  } from 'lucide-react';
import type {LucideIcon} from 'lucide-react';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    SidebarGroup,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn } from '@/lib/utils';
import type { NavItem } from '@/types';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const { isCurrentUrl } = useCurrentUrl();
    const { state } = useSidebar();
    const collapsed = state === 'collapsed';

    // Check if any child URL is active (for parent group highlighting)
    const isGroupActive = (item: NavItem) => {
        if (!item.items) {
return false;
}

        return item.items.some((sub) => isCurrentUrl(sub.href));
    };

    return (
        <SidebarGroup className="px-3 py-2">
            {/* Brand label */}
            {!collapsed && (
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.15em] px-2 pb-3 pt-1 select-none">
                    Kutenga ERP
                </p>
            )}

            <SidebarMenu className="space-y-0.5">
                {items.map((item) => {
                    const hasSubItems = item.items && item.items.length > 0;
                    const itemActive = !hasSubItems && item.href ? isCurrentUrl(item.href) : false;
                    const groupActive = hasSubItems ? isGroupActive(item) : false;

                    if (!hasSubItems) {
                        return (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton
                                    asChild
                                    isActive={itemActive}
                                    tooltip={{ children: item.title, side: 'right' }}
                                    className={cn(
                                        'h-9 rounded-md px-3 transition-all duration-150',
                                        itemActive
                                            ? 'bg-[#2DB8A0]/15 text-[#2DB8A0] border-l-2 border-[#2DB8A0] rounded-l-none pl-[10px]'
                                            : 'text-slate-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent rounded-l-none pl-[10px]',
                                    )}
                                >
                                    <Link href={item.href!} prefetch>
                                        {item.icon && (
                                            <item.icon
                                                className={cn(
                                                    'h-4 w-4 flex-shrink-0',
                                                    itemActive ? 'text-[#2DB8A0]' : 'text-slate-500',
                                                )}
                                            />
                                        )}
                                        <span className="text-sm font-medium tracking-tight">
                                            {item.title}
                                        </span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        );
                    }

                    return (
                        <Collapsible
                            key={item.title}
                            asChild
                            defaultOpen={groupActive}
                            className="group/collapsible"
                        >
                            <SidebarMenuItem>
                                <CollapsibleTrigger asChild>
                                    <SidebarMenuButton
                                        tooltip={{ children: item.title, side: 'right' }}
                                        className={cn(
                                            'h-9 rounded-md px-3 transition-all duration-150 border-l-2 rounded-l-none pl-[10px]',
                                            groupActive
                                                ? 'text-[#2DB8A0] border-[#2DB8A0] bg-[#2DB8A0]/10'
                                                : 'text-slate-400 hover:text-white hover:bg-white/5 border-transparent',
                                        )}
                                    >
                                        {item.icon && (
                                            <item.icon
                                                className={cn(
                                                    'h-4 w-4 flex-shrink-0',
                                                    groupActive ? 'text-[#2DB8A0]' : 'text-slate-500',
                                                )}
                                            />
                                        )}
                                        <span className="text-sm font-medium tracking-tight flex-1">
                                            {item.title}
                                        </span>
                                        <ChevronRight
                                            className={cn(
                                                'h-3.5 w-3.5 text-slate-500 transition-transform duration-200',
                                                'group-data-[state=open]/collapsible:rotate-90',
                                            )}
                                        />
                                    </SidebarMenuButton>
                                </CollapsibleTrigger>

                                <CollapsibleContent>
                                    <SidebarMenuSub className="ml-6 border-l border-white/8 pl-3 mt-0.5 space-y-0.5">
                                        {item.items?.map((subItem) => {
                                            const subActive = isCurrentUrl(subItem.href);

                                            return (
                                                <SidebarMenuSubItem key={subItem.title}>
                                                    <Link
                                                        href={subItem.href}
                                                        prefetch
                                                        className={cn(
                                                            'flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition-all duration-150',
                                                            subActive
                                                                ? 'text-[#2DB8A0] font-medium bg-[#2DB8A0]/10'
                                                                : 'text-slate-400 hover:text-white hover:bg-white/5 font-normal',
                                                        )}
                                                    >
                                                        {subItem.title}
                                                    </Link>
                                                </SidebarMenuSubItem>
                                            );
                                        })}
                                    </SidebarMenuSub>
                                </CollapsibleContent>
                            </SidebarMenuItem>
                        </Collapsible>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}
