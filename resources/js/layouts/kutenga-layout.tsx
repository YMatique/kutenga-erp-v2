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
    const sidebarOpen = state === "expanded";

    // Toast notifications para mensagens flash
    useEffect(() => {
        if (props.flash?.success) {
            toast.success(props.flash.success);
        }
        if (props.flash?.error) {
            toast.error(props.flash.error);
        }
    }, [props.flash]);

    return (
        <div className="min-h-screen w-full bg-zinc-100 dark:bg-zinc-950 font-sans antialiased text-zinc-900 dark:text-zinc-100 flex flex-col">
            {/* Suspended Sidebar - We use the Sidebar component inside SidebarProvider */}
            <AppSidebar />

            <div className="flex flex-1 flex-col transition-all duration-300 ease-in-out">
                {/* Suspended Header */}
                <header className={cn(
                    "fixed top-4 right-4 z-40 transition-all duration-300 ease-in-out",
                    isMobile ? "left-4" : (sidebarOpen ? "left-[17rem]" : "left-[4rem]")
                )}>
                    <div className="h-16 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md px-4 flex items-center shadow-xs">
                        <AppHeader breadcrumbs={breadcrumbs} />
                    </div>
                </header>

                {/* Main Content Area */}
                <main
                    className={cn(
                        "mt-24 mr-4 mb-4 min-h-[calc(100vh-7rem)] transition-all duration-300 ease-in-out flex-1",
                        isMobile ? "ml-4" : (sidebarOpen ? "ml-[17rem]" : "ml-[4rem]")
                    )}
                >
                    {/* Content Wrapper Card */}
                    <div className="h-full border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 p-6 md:p-8 shadow-xs border-dashed">
                        {children}
                    </div>
                </main>
            </div>

            <Toaster />
        </div>
    );
}

export default function KutengaLayout({ children, breadcrumbs = [] }: PropsWithChildren<{ breadcrumbs?: BreadcrumbItem[] }>) {
    const { sidebarOpen } = usePage<any>().props;
    return (
        <TooltipProvider delayDuration={0}>
            <SidebarProvider defaultOpen={sidebarOpen}>
                <KutengaLayoutContent breadcrumbs={breadcrumbs}>
                    {children}
                </KutengaLayoutContent>
            </SidebarProvider>
        </TooltipProvider>
    );
}
