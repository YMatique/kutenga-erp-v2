import { Head } from '@inertiajs/react';
import { ReactNode } from 'react';
import { Link } from '@inertiajs/react';
import { Home, LogOut } from 'lucide-react';

interface PosLayoutProps {
    children: ReactNode;
    title?: string;
}

export default function PosLayout({ children, title = 'POS' }: PosLayoutProps) {
    return (
        <div className="min-h-screen bg-neutral-100 flex flex-col">
            <Head title={title} />
            
            {/* Minimal Header */}
            <header className="bg-white border-b border-neutral-200 h-14 flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="text-neutral-500 hover:text-neutral-900 transition-colors">
                        <Home className="w-5 h-5" />
                    </Link>
                    <h1 className="font-semibold text-lg text-neutral-800">Kutenga POS</h1>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="text-sm text-neutral-500">
                        {new Date().toLocaleDateString()}
                    </div>
                    <Link
                        href="/pos/shifts/close"
                        className="text-sm font-medium text-red-600 hover:text-red-700 flex items-center gap-2"
                    >
                        <LogOut className="w-4 h-4" />
                        Fechar Turno
                    </Link>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 flex overflow-hidden">
                {children}
            </main>
        </div>
    );
}
