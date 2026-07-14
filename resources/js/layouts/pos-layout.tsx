import { Head, Link, usePage } from '@inertiajs/react';
import { LayoutGrid, LogOut, ShoppingBag } from 'lucide-react';
import type { ReactNode} from 'react';
import { useState, useEffect } from 'react';

interface PosLayoutProps {
    children: ReactNode;
    title?: string;
    shift?: any;
}

export default function PosLayout({ children, title = 'POS', shift }: PosLayoutProps) {
    const { auth } = usePage().props as any;
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(new Date()), 1000);

        return () => clearInterval(interval);
    }, []);

    const formatTime = (date: Date) =>
        date.toLocaleTimeString('pt-MZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const formatDate = (date: Date) =>
        date.toLocaleDateString('pt-MZ', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

    return (
        <div className="min-h-screen bg-neutral-100 flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
            <Head title={`POS • ${title}`} />

            <header className="bg-[#0f172a] text-white h-16 flex items-center justify-between px-5 shrink-0 shadow-xl">
                {/* Left: Brand + Shift badge */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/40">
                            <ShoppingBag className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-xs text-white/50 leading-none">Kutenga</p>
                            <p className="text-sm font-bold text-white leading-tight">Ponto de Venda</p>
                        </div>
                    </div>

                    {shift && (
                        <div className="hidden sm:flex items-center gap-2 bg-white/10 border border-white/10 px-3 py-1.5 rounded-full">
                            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                            <span className="text-xs font-medium text-white/80">Turno #{shift.id}</span>
                        </div>
                    )}
                </div>

                {/* Center: Clock */}
                <div className="hidden md:flex flex-col items-center">
                    <span className="font-mono text-2xl font-bold text-white tracking-widest">
                        {formatTime(currentTime)}
                    </span>
                    <span className="text-xs text-white/40 capitalize mt-0.5">
                        {formatDate(currentTime)}
                    </span>
                </div>

                {/* Right: User + nav */}
                <div className="flex items-center gap-2">
                    {auth?.user?.name && (
                        <div className="hidden sm:flex flex-col items-end mr-2">
                            <span className="text-xs text-white/40">Operador</span>
                            <span className="text-sm font-semibold text-white">{auth.user.name}</span>
                        </div>
                    )}

                    <Link
                        href="/pos/shifts"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all text-sm"
                        title="Gestão de Turnos"
                    >
                        <LayoutGrid className="w-4 h-4" />
                        <span className="hidden sm:block">Gestão</span>
                    </Link>

                    <Link
                        href="/pos/shifts/close"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300 transition-all text-sm font-medium"
                        title="Fechar Turno"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="hidden sm:block">Fechar Turno</span>
                    </Link>
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden">
                {children}
            </main>
        </div>
    );
}
