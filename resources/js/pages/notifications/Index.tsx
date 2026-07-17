import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    Bell, Check, Clock, PackageOpen, Receipt, User,
    PlusCircle, ArrowDownCircle, Ban, CheckSquare, Inbox, ExternalLink
} from 'lucide-react';
import { PageHeader, PrimaryButton, OutlineButton } from '@/components/ui/brand';
import { toast } from 'sonner';

interface Notification {
    id: number;
    type: string;
    title: string;
    message: string;
    link: string;
    is_read: boolean;
    created_at: string;
}

interface PaginatedNotifications {
    data: Notification[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
    total: number;
}

interface Props {
    systemNotifications: PaginatedNotifications;
    filter: string;
}

export default function NotificationsIndex({ systemNotifications, filter }: Props) {

    const handleRead = (n: Notification) => {
        router.post(`/notifications/${n.id}/read`, {}, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                if (n.link) {
                    router.visit(n.link);
                }
            }
        });
    };

    const handleMarkAllRead = () => {
        router.post('/notifications/mark-all-read', {}, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                toast.success('Todas as notificações foram marcadas como lidas!');
            }
        });
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'invoice_overdue':
            case 'invoice_expiring':
            case 'quote_expired':
                return <Clock className="h-5 w-5 text-amber-500" />;
            case 'low_stock':
                return <PackageOpen className="h-5 w-5 text-amber-500" />;
            case 'out_of_stock':
                return <PackageOpen className="h-5 w-5 text-red-500" />;
            case 'invoice_paid':
                return <Receipt className="h-5 w-5 text-emerald-500" />;
            case 'user_created':
                return <User className="h-5 w-5 text-blue-500" />;
            case 'product_created':
                return <PlusCircle className="h-5 w-5 text-emerald-500" />;
            case 'stock_in':
                return <ArrowDownCircle className="h-5 w-5 text-[#2DB8A0]" />;
            case 'document_cancelled':
                return <Ban className="h-5 w-5 text-red-500" />;
            default:
                return <Bell className="h-5 w-5 text-blue-500" />;
        }
    };

    return (
        <>
            <Head title="Notificações do Sistema" />

            <div className="w-full py-8 ">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Notificações</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Acompanhe alertas, avisos e atividades geradas pelo sistema.
                        </p>
                    </div>

                    {systemNotifications.data.some(n => !n.is_read) && (
                        <PrimaryButton
                            id="btn-mark-all-read"
                            onClick={handleMarkAllRead}
                            className="bg-[#2DB8A0] hover:bg-[#239B86] h-10 px-4 text-xs font-semibold flex items-center gap-2 self-start sm:self-auto"
                        >
                            <CheckSquare size={16} />
                            Marcar Todas como Lidas
                        </PrimaryButton>
                    )}
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2 mb-6 border-b border-border pb-3">
                    <Link
                        href="/notifications?filter=all"
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${filter === 'all'
                            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400'
                            : 'text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                    >
                        Todas
                    </Link>
                    <Link
                        href="/notifications?filter=unread"
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${filter === 'unread'
                            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400'
                            : 'text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                    >
                        Não Lidas
                        {systemNotifications.data.filter(n => !n.is_read).length > 0 && (
                            <span className="ml-1.5 bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                                {systemNotifications.data.filter(n => !n.is_read).length}
                            </span>
                        )}
                    </Link>
                    <Link
                        href="/notifications?filter=read"
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${filter === 'read'
                            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400'
                            : 'text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                    >
                        Lidas
                    </Link>
                </div>

                {/* Content Card */}
                <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
                    {systemNotifications.data.length === 0 ? (
                        <div className="py-20 text-center text-muted-foreground flex flex-col items-center justify-center gap-4">
                            <div className="p-4 rounded-full bg-slate-50 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500">
                                <Inbox className="h-10 w-10" />
                            </div>
                            <div>
                                <p className="font-bold text-lg text-foreground">Sem notificações</p>
                                <p className="text-sm mt-1">Não encontrámos nenhuma notificação com este filtro.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {systemNotifications.data.map((n) => (
                                <div
                                    key={n.id}
                                    className={`flex items-start justify-between p-5 transition-all relative hover:bg-slate-50/50 dark:hover:bg-slate-800/20 ${!n.is_read ? 'bg-slate-50/20 dark:bg-slate-800/10 font-medium' : ''
                                        }`}
                                >
                                    {/* Unread Accent Indicator */}
                                    {!n.is_read && (
                                        <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-indigo-500" />
                                    )}

                                    {/* Left info */}
                                    <div className="flex items-start gap-4 flex-1 pr-4">
                                        <div className="p-2.5 rounded-md bg-background border border-border">
                                            {getIcon(n.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="font-bold text-foreground text-sm leading-tight">
                                                    {n.title}
                                                </h3>
                                                {!n.is_read && (
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500 text-white uppercase tracking-wider">
                                                        Novo
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground leading-relaxed mt-1.5 whitespace-pre-line">
                                                {n.message}
                                            </p>

                                            <div className="flex items-center gap-3 mt-3 text-[10px] text-muted-foreground">
                                                <span>{new Date(n.created_at).toLocaleString('pt-PT')}</span>
                                                {n.link && (
                                                    <button
                                                        onClick={() => handleRead(n)}
                                                        className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold transition-colors"
                                                    >
                                                        <ExternalLink size={10} />
                                                        Ver detalhes
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Action */}
                                    {!n.is_read && (
                                        <OutlineButton
                                            onClick={() => handleRead(n)}
                                            className="h-8 px-3 text-[11px] font-semibold border-indigo-200 dark:border-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20"
                                        >
                                            Marcar como lida
                                        </OutlineButton>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {systemNotifications.last_page > 1 && (
                    <div className="flex items-center justify-center gap-1 mt-6">
                        {systemNotifications.links.map((link, idx) => {
                            if (!link.url) {
                                return (
                                    <span
                                        key={idx}
                                        className="px-3 py-1.5 text-xs text-muted-foreground cursor-not-allowed border border-transparent"
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                );
                            }
                            return (
                                <Link
                                    key={idx}
                                    href={link.url}
                                    className={`px-3 py-1.5 text-xs font-semibold rounded border transition-all ${link.active
                                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-900 dark:text-indigo-400'
                                        : 'border-border text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800'
                                        }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
}

NotificationsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Notificações',
            href: '/notifications',
        },
    ],
};
