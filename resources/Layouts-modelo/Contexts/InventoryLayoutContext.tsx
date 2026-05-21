import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface InventoryLayoutContextType {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
    toggleSidebar: () => void;
}

const InventoryLayoutContext = createContext<InventoryLayoutContextType | undefined>(undefined);

export function InventoryLayoutProvider({ children }: { children: ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const saved = localStorage.getItem('inventory-sidebar-open');
        if (saved !== null) {
            setSidebarOpen(JSON.parse(saved));
        }
    }, []);

    useEffect(() => {
        if (isMounted) {
            localStorage.setItem('inventory-sidebar-open', JSON.stringify(sidebarOpen));
        }
    }, [sidebarOpen, isMounted]);

    const toggleSidebar = () => setSidebarOpen(prev => !prev);

    return (
        <InventoryLayoutContext.Provider value={{ sidebarOpen, setSidebarOpen, toggleSidebar }}>
            {children}
        </InventoryLayoutContext.Provider>
    );
}

export function useInventoryLayout() {
    const context = useContext(InventoryLayoutContext);
    if (context === undefined) {
        throw new Error('useInventoryLayout must be used within an InventoryLayoutProvider');
    }
    return context;
}
