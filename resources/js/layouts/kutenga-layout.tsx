import { AppHeader } from '@/components/app-header';
import { AppSidebar } from '@/components/app-sidebar';
import { type BreadcrumbItem } from '@/types';
import { type PropsWithChildren, useEffect } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { usePage } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import { AppLayoutProvider, useAppLayout } from '@/contexts/app-layout-context';

function KutengaLayoutContent({
    children,
    breadcrumbs = [],
}: PropsWithChildren<{ breadcrumbs?: BreadcrumbItem[] }>) {
    const { props } = usePage<any>();
    const { sidebarOpen, setSidebarOpen } = useAppLayout();

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
        <div className="min-h-screen w-full bg-zinc-100 dark:bg-zinc-950 font-sans antialiased text-zinc-900 dark:text-zinc-100">
            {/* Suspended Header */}
            <header className={cn(
                "fixed top-4 right-4 z-50 left-4 transition-all duration-300 ease-in-out",
                sidebarOpen ? "md:left-[18rem]" : "md:left-20"
            )}>
                <div className="h-16 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md px-4 flex items-center shadow-sm">
                    <AppHeader breadcrumbs={breadcrumbs} />
                </div>
            </header>

            {/* Suspended Sidebar */}
            <div className="fixed top-4 left-4 bottom-4 z-50">
                <AppSidebar />
            </div>

            {/* Main Content Area */}
            <main
                className={cn(
                    "mt-24 mr-4 mb-4 min-h-[calc(100vh-7rem)] transition-all duration-300 ease-in-out",
                    sidebarOpen ? "md:ml-72 ml-4" : "md:ml-23 ml-4"
                )}
            >
                {/* Content Wrapper Card */}
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 p-6 md:p-8 shadow-sm">
                    {children}
                </div>
            </main>

            <Toaster />
        </div>
    );
}

export default function KutengaLayout({ children, breadcrumbs = [] }: PropsWithChildren<{ breadcrumbs?: BreadcrumbItem[] }>) {
    const { sidebarOpen } = usePage<any>().props;
    return (
        <AppLayoutProvider initialSidebarOpen={sidebarOpen}>
            <KutengaLayoutContent breadcrumbs={breadcrumbs}>
                {children}
            </KutengaLayoutContent>
        </AppLayoutProvider>
    );
}
