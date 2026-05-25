import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AppLayoutContextType {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
    toggleSidebar: () => void;
}

const AppLayoutContext = createContext<AppLayoutContextType | undefined>(undefined);

export function AppLayoutProvider({ children, initialSidebarOpen = true }: { children: ReactNode, initialSidebarOpen?: boolean }) {
    const [sidebarOpen, setSidebarOpen] = useState(initialSidebarOpen);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const saved = localStorage.getItem('sidebar-open');
        if (saved !== null) {
            setSidebarOpen(JSON.parse(saved));
        }
    }, []);

    useEffect(() => {
        if (isMounted) {
            localStorage.setItem('sidebar-open', JSON.stringify(sidebarOpen));
        }
    }, [sidebarOpen, isMounted]);

    const toggleSidebar = () => setSidebarOpen(prev => !prev);

    return (
        <AppLayoutContext.Provider value={{ sidebarOpen, setSidebarOpen, toggleSidebar }}>
            {children}
        </AppLayoutContext.Provider>
    );
}

export function useAppLayout() {
    const context = useContext(AppLayoutContext);
    if (context === undefined) {
        throw new Error('useAppLayout must be used within an AppLayoutProvider');
    }
    return context;
}
