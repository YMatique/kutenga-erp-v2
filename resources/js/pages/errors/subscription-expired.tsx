import { Head, Link } from '@inertiajs/react';
import { ShieldAlert, LogOut, RefreshCw } from 'lucide-react';

export default function SubscriptionExpired() {
    return (
        <>
            <Head title="Subscrição Expirada" />

            <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950 text-white p-6">
                <div className="max-w-md w-full text-center space-y-8 animate-in fade-in duration-300">
                    
                    {/* Icon */}
                    <div className="flex justify-center">
                        <div className="p-4 rounded-full bg-rose-500/10 border-4 border-rose-500/20 text-rose-500">
                            <ShieldAlert className="h-16 w-16" />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-3">
                        <h1 className="text-3xl font-extrabold tracking-tight">Subscrição Expirada</h1>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            A subscrição da sua empresa expirou. As permissões de acesso ao sistema foram temporariamente suspensas.
                        </p>
                        <p className="text-slate-500 text-xs">
                            Por favor, contacte o administrador da sua empresa para renovar o plano ou faça login com outra conta.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        <Link 
                            href="/logout" 
                            method="post" 
                            as="button" 
                            className="w-full sm:flex-1 h-11 inline-flex items-center justify-center gap-2 rounded bg-zinc-850 hover:bg-zinc-800 text-sm font-semibold transition-colors border border-zinc-700 text-zinc-300"
                        >
                            <LogOut className="h-4 w-4" />
                            Terminar Sessão
                        </Link>
                        
                        <Link 
                            href="/dashboard" 
                            className="w-full sm:flex-1 h-11 inline-flex items-center justify-center gap-2 rounded bg-[#2DB8A0] hover:bg-[#259b86] text-sm font-semibold transition-colors text-white"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Tentar Novamente
                        </Link>
                    </div>

                    {/* Footer text */}
                    <p className="text-xs text-slate-600">
                        Kutenga ERP v2 &copy; 2026. Todos os direitos reservados.
                    </p>
                </div>
            </div>
        </>
    );
}
