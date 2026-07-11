import { AppHeader } from '@/components/app-header';
import { AppSidebar } from '@/components/app-sidebar';
import { type BreadcrumbItem } from '@/types';
import { type PropsWithChildren, useEffect } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { usePage } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';

function KutengaLayoutContent({
    children,
    breadcrumbs = [],
}: PropsWithChildren<{ breadcrumbs?: BreadcrumbItem[] }>) {
    const { props } = usePage<any>();
    const { state, isMobile } = useSidebar();
    const sidebarOpen = state === 'expanded';

    useEffect(() => {
        if (props.flash?.success) toast.success(props.flash.success);
        if (props.flash?.error) toast.error(props.flash.error);
        if (props.flash?.warning) toast.warning(props.flash.warning);
        if (props.flash?.info) toast.info(props.flash.info);
    }, [props.flash]);

    return (
        <div className="min-h-screen w-full bg-background font-sans antialiased text-foreground flex flex-col overflow-x-hidden">

            {/* Floating top header */}
            <header className="fixed top-2 left-2 right-2 z-[60] transition-all duration-300 ease-in-out">
                <div className="h-14 border border-border rounded-[4px] bg-card/60 backdrop-blur-xl px-4 flex items-center shadow-xs">
                    <AppHeader breadcrumbs={breadcrumbs} />
                </div>
            </header>

            <div className="relative w-full">

                {/* Dark navy sidebar panel */}
                <aside
                    className={cn(
                        'fixed top-[5rem] left-2 bottom-3 z-50 transition-all duration-300 ease-in-out',
                        sidebarOpen ? 'w-64' : 'w-[4.5rem]',
                        isMobile && !sidebarOpen && '-left-full',
                    )}
                >
                    <div className="h-full rounded-[4px] bg-[#1A2332] overflow-hidden flex flex-col shadow-xs border border-white/5 relative">
                        <AppSidebar />
                    </div>
                </aside>

                {/* Main content area */}
                <main
                    className={cn(
                        'pt-[5rem] transition-all duration-300 ease-in-out w-full min-h-screen',
                        isMobile ? 'pl-3 pr-3 pb-3' : sidebarOpen ? 'pl-[17.25rem] pr-3 pb-3' : 'pl-[5.75rem] pr-3 pb-3',
                    )}
                >
                    <div className="min-h-full">
                        {children}
                    </div>
                </main>
            </div>

            <Toaster richColors position="top-right" />
        </div>
    );
}

import { ConfirmDeleteProvider } from '@/contexts/confirm-delete-context';
import { InactivityLock } from '@/components/inactivity-lock';

export default function KutengaLayout({
    children,
    breadcrumbs = [],
}: PropsWithChildren<{ breadcrumbs?: BreadcrumbItem[] }>) {
    const { sidebarOpen } = usePage<any>().props;
    return (
        <ConfirmDeleteProvider>
            <TooltipProvider delayDuration={0}>
                <SidebarProvider defaultOpen={sidebarOpen}>
                    <KutengaLayoutContent breadcrumbs={breadcrumbs}>
                        {children}
                    </KutengaLayoutContent>
                    <InactivityLock />
                </SidebarProvider>
            </TooltipProvider>
        </ConfirmDeleteProvider>
    );
}
