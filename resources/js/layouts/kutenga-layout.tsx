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
        <div className="min-h-screen w-full bg-zinc-50 dark:bg-zinc-950 font-sans antialiased text-zinc-900 dark:text-zinc-100 flex flex-col">
            {/* 1. Suspended Top Header */}
            <header className="fixed top-4 left-4 right-4 z-[60] transition-all duration-300 ease-in-out">
                <div className="h-16 border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl px-4 flex items-center shadow-sm">
                    <AppHeader breadcrumbs={breadcrumbs} />
                </div>
            </header>

            <div className="flex flex-1 relative">
                {/* 2. Suspended Sidebar - Starts below the header (top-24) */}
                <aside 
                    className={cn(
                        "fixed top-24 left-4 bottom-4 z-50 transition-all duration-300 ease-in-out",
                        sidebarOpen ? "w-64" : "w-20",
                        isMobile && !sidebarOpen && "-left-full"
                    )}
                >
                    <div className="h-full border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl shadow-sm overflow-hidden flex flex-col">
                        <AppSidebar />
                    </div>
                </aside>

                {/* 3. Main Content Area */}
                <main
                    className={cn(
                        "mt-24 w-full transition-all duration-300 ease-in-out flex-1",
                        isMobile ? "ml-4 mr-4 mb-4" : (sidebarOpen ? "ml-72 mr-4 mb-4" : "ml-28 mr-4 mb-4")
                    )}
                >
                    {/* Content Wrapper Card */}
                    <div className="min-h-full border border-zinc-200/60 dark:border-zinc-800/60 rounded-xl bg-white dark:bg-zinc-900 p-6 md:p-8 shadow-xs border-dashed">
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
