import { Head, Link } from '@inertiajs/react';
import React from 'react';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { PageHeader, PrimaryButton, OutlineButton } from '@/components/ui/brand';
import AppLayout from '@/layouts/app-layout';

interface Props {
    status: number;
    message?: string;
}

export default function ErrorPage({ status, message }: Props) {
    const title = status === 403 ? 'Acesso Negado' : status === 404 ? 'Página Não Encontrada' : 'Erro do Servidor';
    const description = message || 'Não tens permissão para aceder a esta página.';

    return (
        <>
            <Head title={title} />
            
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
                <div className="w-full max-w-md bg-card border border-border rounded-[4px] shadow-lg p-8 text-center relative overflow-hidden">
                    {/* Top Accent Bar */}
                    <div className="absolute top-0 left-0 right-0 h-[3px] bg-red-500" />
                    
                    {/* Icon Container */}
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 text-red-500 mb-6">
                        <ShieldAlert size={36} />
                    </div>
                    
                    {/* Status Code */}
                    <span className="block text-xs font-mono font-bold tracking-widest text-muted-foreground uppercase mb-1">
                        Status {status}
                    </span>
                    
                    {/* Title */}
                    <h2 className="text-2xl font-bold text-foreground mb-3">
                        {title}
                    </h2>
                    
                    {/* Description */}
                    <p className="text-sm text-muted-foreground leading-relaxed mb-8">
                        {description}
                    </p>
                    
                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <OutlineButton 
                            id="btn-go-back"
                            onClick={() => window.history.back()} 
                            className="w-full sm:w-auto h-10 px-5 text-sm font-semibold"
                        >
                            <ArrowLeft size={16} />
                            Voltar Atrás
                        </OutlineButton>
                        
                        <PrimaryButton 
                            id="btn-go-home"
                            asChild
                            className="w-full sm:w-auto h-10 px-5 text-sm font-semibold bg-[#2DB8A0] hover:bg-[#239B86]"
                        >
                            <Link href="/dashboard">
                                <Home size={16} />
                                Painel Principal
                            </Link>
                        </PrimaryButton>
                    </div>
                </div>
            </div>
        </>
    );
}

ErrorPage.layout = (page: any) => (
    <AppLayout breadcrumbs={[{ title: 'Erro', href: '#' }]}>
        {page}
    </AppLayout>
);
