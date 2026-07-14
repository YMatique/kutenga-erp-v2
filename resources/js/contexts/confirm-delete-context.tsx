import type { ReactNode } from 'react';
import React, { createContext, useContext, useState } from 'react';
import { ConfirmDeleteModal } from '@/components/confirm-delete-modal';

interface ConfirmDeleteOptions {
    url: string;
    title?: string;
    description?: string;
    onSuccess?: () => void;
    method?: 'delete' | 'post';
    confirmLabel?: string;
}

interface ConfirmDeleteContextType {
    confirmDelete: (options: ConfirmDeleteOptions) => void;
}

const ConfirmDeleteContext = createContext<ConfirmDeleteContextType | undefined>(undefined);

export function ConfirmDeleteProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState<ConfirmDeleteOptions | null>(null);

    const confirmDelete = (opts: ConfirmDeleteOptions) => {
        setOptions(opts);
        setIsOpen(true);
    };

    const handleClose = () => {
        setIsOpen(false);
    };

    return (
        <ConfirmDeleteContext.Provider value={{ confirmDelete }}>
            {children}
            {options && (
                <ConfirmDeleteModal
                    isOpen={isOpen}
                    onClose={handleClose}
                    deleteUrl={options.url}
                    title={options.title}
                    description={options.description}
                    onSuccess={options.onSuccess}
                    method={options.method}
                    confirmLabel={options.confirmLabel}
                />
            )}
        </ConfirmDeleteContext.Provider>
    );
}

export function useConfirmDelete() {
    const context = useContext(ConfirmDeleteContext);

    if (!context) {
        throw new Error('useConfirmDelete must be used within a ConfirmDeleteProvider');
    }

    return context;
}
