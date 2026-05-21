import { InventorySidebar } from '../Components/InventorySidebar';
import { InventoryHeader } from '../Components/InventoryHeader';
import { ImpersonationBanner } from '@/components/impersonation-banner';
import { OnboardingBanner } from '@/components/onboarding-banner';
import { type BreadcrumbItem } from '@/types';
import { type PropsWithChildren, useState, useEffect } from 'react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { usePage } from '@inertiajs/react';
import { cn } from '@/lib/utils';

import { InventoryLayoutProvider, useInventoryLayout } from '../Contexts/InventoryLayoutContext';

function InventoryLayoutContent({
    children,
    breadcrumbs = [],
    fullWidth = false,
}: PropsWithChildren<{ breadcrumbs?: BreadcrumbItem[]; fullWidth?: boolean }>) {
    const { props } = usePage<any>();
    const { sidebarOpen, setSidebarOpen, toggleSidebar } = useInventoryLayout();

    // Toast notifications para mensagens flash
    useEffect(() => {
        if (props.success) {
            toast.success(props.success);
        }
        if (props.error) {
            toast.error(props.error);
        }
        if (props.warning) {
            toast.warning(props.warning);
        }
        if (props.info) {
            toast.info(props.info);
        }
    }, [props.success, props.error, props.warning, props.info]);

    return (
        <>
            {/* Main Background - Zinc 100 */}
            <div className="min-h-screen w-full bg-zinc-100 dark:bg-zinc-950">
                <ImpersonationBanner />
                <OnboardingBanner />

                {/* Suspended Header - Fixed, Floating */}
                <InventoryHeader
                    breadcrumbs={breadcrumbs}
                    sidebarOpen={sidebarOpen}
                    onToggleSidebar={toggleSidebar}
                />

                {/* Suspended Sidebar - Fixed Left, Floating */}
                <InventorySidebar
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                />

                {/* Main Content Area - Offset for Header and Sidebar */}
                <main
                    className={cn(
                        "mt-24 mr-4 mb-4 min-h-[calc(100vh-7rem)]",
                        "transition-all duration-300 ease-in-out",
                        sidebarOpen ? "md:ml-72 ml-2" : "md:ml-22 ml-4"
                    )}
                >
                    {/* Content Wrapper Card */}
                    <div className="border border-zinc-200 dark:border-zinc-800 rounded-md bg-white dark:bg-zinc-900 p-6 md:p-8">
                        <div className={`${fullWidth ? 'w-full' : 'max-w-[1780px] mx-auto'}`}>
                            <ErrorBoundary>
                                {children}
                            </ErrorBoundary>
                        </div>
                    </div>
                </main>
            </div>
            <Toaster />
        </>
    );
}

export default function InventoryLayout(props: PropsWithChildren<{ breadcrumbs?: BreadcrumbItem[]; fullWidth?: boolean }>) {
    return (
        <InventoryLayoutProvider>
            <InventoryLayoutContent {...props} />
        </InventoryLayoutProvider>
    );
}
