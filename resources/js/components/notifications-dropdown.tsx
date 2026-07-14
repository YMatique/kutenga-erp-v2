import { router } from '@inertiajs/react';
import { Bell, Check, Clock, PackageOpen, Receipt, User, PlusCircle, ArrowDownCircle, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

interface Notification {
    id: number;
    type: string;
    title: string;
    message: string;
    link: string;
    created_at: string;
}

export function NotificationsDropdown({ notifications }: { notifications: Notification[] }) {
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

    const getIcon = (type: string) => {
        switch (type) {
            case 'invoice_overdue':
            case 'invoice_expiring':
            case 'quote_expired':
                return <Clock className="h-4 w-4 text-amber-500" />;
            case 'low_stock':
                return <PackageOpen className="h-4 w-4 text-amber-500" />;
            case 'out_of_stock':
                return <PackageOpen className="h-4 w-4 text-red-500" />;
            case 'invoice_paid':
                return <Receipt className="h-4 w-4 text-emerald-500" />;
            case 'user_created':
                return <User className="h-4 w-4 text-blue-500" />;
            case 'product_created':
                return <PlusCircle className="h-4 w-4 text-emerald-500" />;
            case 'stock_in':
                return <ArrowDownCircle className="h-4 w-4 text-[#2DB8A0]" />;
            case 'document_cancelled':
                return <Ban className="h-4 w-4 text-red-500" />;
            default:
                return <Bell className="h-4 w-4 text-blue-500" />;
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md relative"
                >
                    <Bell className="h-4 w-4" />
                    {notifications.length > 0 && (
                        <span className="absolute top-1 right-1 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80" align="end">
                <DropdownMenuLabel className="font-medium text-sm flex items-center justify-between">
                    Notificações
                    {notifications.length > 0 && (
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs font-semibold">
                            {notifications.length}
                        </span>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {notifications.length === 0 ? (
                    <div className="py-6 text-center text-slate-500 text-sm flex flex-col items-center gap-2">
                        <Check className="h-8 w-8 text-slate-200" />
                        Tudo em dia! Sem novas notificações.
                    </div>
                ) : (
                    <div className="max-h-[300px] overflow-y-auto">
                        {notifications.map((n) => (
                            <DropdownMenuItem
                                key={n.id}
                                className="flex flex-col items-start gap-1 p-3 cursor-pointer focus:bg-slate-50"
                                onClick={() => handleRead(n)}
                            >
                                <div className="flex items-center gap-2 w-full">
                                    {getIcon(n.type)}
                                    <span className="font-semibold text-sm truncate flex-1">{n.title}</span>
                                </div>
                                <span className="text-xs text-slate-500 line-clamp-2 w-full mt-1">
                                    {n.message}
                                </span>
                            </DropdownMenuItem>
                        ))}
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
