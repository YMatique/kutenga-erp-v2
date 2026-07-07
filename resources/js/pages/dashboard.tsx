import { Head, Link } from '@inertiajs/react';
import {
    Package,
    BookOpen,
    FileText,
    ShoppingCart,
    ArrowRight,
    Clock,
    TrendingUp,
    Wallet,
    Activity,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/brand';
import { dashboard } from '@/routes';

const quickLinks = [
    {
        href: '/inventory',
        title: 'Inventário',
        description: 'Gerencie o seu stock e movimentos de armazém.',
        icon: Package,
        accent: 'teal' as const,
        iconBg: 'bg-[#2DB8A0]/10',
        iconColor: 'text-[#2DB8A0]',
    },
    {
        href: '/catalog',
        title: 'Catálogo',
        description: 'Produtos, categorias e listas de preços.',
        icon: BookOpen,
        accent: 'gold' as const,
        iconBg: 'bg-[#E8A020]/10',
        iconColor: 'text-[#E8A020]',
    },
    {
        href: '/invoices',
        title: 'Faturação',
        description: 'Emita e acompanhe faturas e recibos.',
        icon: FileText,
        accent: 'teal' as const,
        iconBg: 'bg-[#2DB8A0]/10',
        iconColor: 'text-[#2DB8A0]',
    },
    {
        href: '/pos',
        title: 'Ponto de Venda',
        description: 'Realize vendas directas no balcão.',
        icon: ShoppingCart,
        accent: 'gold' as const,
        iconBg: 'bg-[#E8A020]/10',
        iconColor: 'text-[#E8A020]',
    },
];

const activityRows = [1, 2, 3, 4, 5];

export default function Dashboard() {
    return (
        <>
            <Head title="Dashboard" />

            <div className="flex flex-col gap-6">
                {/* Page Header */}
                <PageHeader
                    title="Dashboard"
                    subtitle="Bem-vindo ao Kutenga ERP"
                />

                {/* Quick Links Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    {quickLinks.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="group bg-white border border-slate-200 rounded-[4px] shadow-xs p-5 flex flex-col gap-4 hover:border-[#2DB8A0] hover:shadow-md transition-all duration-200"
                            >
                                <div className="flex items-start justify-between">
                                    <div className={`h-10 w-10 rounded-[4px] flex items-center justify-center flex-shrink-0 ${item.iconBg}`}>
                                        <Icon className={`h-5 w-5 ${item.iconColor}`} />
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-[#2DB8A0] group-hover:translate-x-0.5 transition-all duration-200" />
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-900 text-[14px] leading-tight">{item.title}</p>
                                    <p className="text-[12px] text-slate-500 mt-1 leading-snug">{item.description}</p>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {/* Recent Activity */}
                <div className="bg-white border border-slate-200 rounded-[4px] shadow-xs overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                        <Activity className="h-4 w-4 text-[#2DB8A0]" />
                        <h2 className="text-[14px] font-semibold text-slate-800">Actividade Recente</h2>
                    </div>
                    <div className="divide-y divide-slate-50">
                        {activityRows.map((i) => (
                            <div key={i} className="px-5 py-3 flex items-center gap-4">
                                {/* Icon skeleton */}
                                <div className="h-8 w-8 rounded-[4px] bg-slate-100 flex-shrink-0 animate-pulse" />
                                <div className="flex-1 min-w-0 space-y-1.5">
                                    <div className="h-3 bg-slate-100 rounded-full w-2/5 animate-pulse" />
                                    <div className="h-2.5 bg-slate-50 rounded-full w-3/5 animate-pulse" />
                                </div>
                                <div className="h-2.5 bg-slate-100 rounded-full w-16 animate-pulse flex-shrink-0" />
                            </div>
                        ))}
                    </div>
                    <div className="px-5 py-4 bg-slate-50 border-t border-slate-100">
                        <p className="text-[12px] text-slate-400 flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            Os dados de actividade estarão disponíveis em breve.
                        </p>
                    </div>
                </div>

                {/* Bottom Row — Coming Soon */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Vendas */}
                    <div className="bg-white border border-slate-200 rounded-[4px] shadow-xs p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-[#2DB8A0]" />
                                <h2 className="text-[14px] font-semibold text-slate-800">Vendas</h2>
                            </div>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-semibold bg-[#E8A020]/10 text-[#E8A020] uppercase tracking-wide">
                                Em breve
                            </span>
                        </div>
                        <div className="space-y-2">
                            <div className="h-3 bg-slate-100 rounded-full w-full animate-pulse" />
                            <div className="h-3 bg-slate-100 rounded-full w-4/5 animate-pulse" />
                            <div className="h-3 bg-slate-50 rounded-full w-3/5 animate-pulse" />
                        </div>
                        <div className="mt-4 h-24 bg-slate-50 rounded-[4px] border border-slate-100 flex items-center justify-center">
                            <p className="text-[12px] text-slate-400">Gráfico de vendas disponível em breve</p>
                        </div>
                    </div>

                    {/* Fluxo de Caixa */}
                    <div className="bg-white border border-slate-200 rounded-[4px] shadow-xs p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Wallet className="h-4 w-4 text-[#E8A020]" />
                                <h2 className="text-[14px] font-semibold text-slate-800">Fluxo de Caixa</h2>
                            </div>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-semibold bg-[#E8A020]/10 text-[#E8A020] uppercase tracking-wide">
                                Em breve
                            </span>
                        </div>
                        <div className="space-y-2">
                            <div className="h-3 bg-slate-100 rounded-full w-full animate-pulse" />
                            <div className="h-3 bg-slate-100 rounded-full w-4/5 animate-pulse" />
                            <div className="h-3 bg-slate-50 rounded-full w-3/5 animate-pulse" />
                        </div>
                        <div className="mt-4 h-24 bg-slate-50 rounded-[4px] border border-slate-100 flex items-center justify-center">
                            <p className="text-[12px] text-slate-400">Relatório financeiro disponível em breve</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
