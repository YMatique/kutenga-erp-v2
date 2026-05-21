import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginationData {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    links: PaginationLink[];
}

interface Props {
    pagination: PaginationData;
}

export function Pagination({ pagination }: Props) {
    if (pagination.last_page <= 1) {
        return null;
    }

    return (
        <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30">
            <div className="flex-1 flex justify-between sm:hidden">
                {pagination.current_page > 1 ? (
                    <Link
                        href={pagination.links[pagination.current_page - 1]?.url || '#'}
                        preserveScroll
                    >
                        <Button variant="outline" size="sm" className="h-8">
                            Anterior
                        </Button>
                    </Link>
                ) : (
                    <Button variant="outline" size="sm" className="h-8" disabled>
                        Anterior
                    </Button>
                )}
                {pagination.current_page < pagination.last_page ? (
                    <Link
                        href={pagination.links[pagination.current_page + 1]?.url || '#'}
                        preserveScroll
                    >
                        <Button variant="outline" size="sm" className="h-8">
                            Próximo
                        </Button>
                    </Link>
                ) : (
                    <Button variant="outline" size="sm" className="h-8" disabled>
                        Próximo
                    </Button>
                )}
            </div>

            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                        Mostrando <span className="font-medium">{pagination.from}</span> a{' '}
                        <span className="font-medium">{pagination.to}</span> de{' '}
                        <span className="font-medium">{pagination.total}</span> resultados
                    </p>
                </div>
                <div className="flex items-center gap-1">
                    {/* First Page */}
                    {pagination.current_page > 1 ? (
                        <Link
                            href={pagination.links[0]?.url || '#'}
                            preserveScroll
                        >
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0 border-zinc-200 dark:border-zinc-800"
                            >
                                <ChevronsLeft className="h-3.5 w-3.5" />
                            </Button>
                        </Link>
                    ) : (
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 border-zinc-200 dark:border-zinc-800"
                            disabled
                        >
                            <ChevronsLeft className="h-3.5 w-3.5" />
                        </Button>
                    )}

                    {/* Previous Page */}
                    {pagination.current_page > 1 ? (
                        <Link
                            href={pagination.links[pagination.current_page - 1]?.url || '#'}
                            preserveScroll
                        >
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0 border-zinc-200 dark:border-zinc-800"
                            >
                                <ChevronLeft className="h-3.5 w-3.5" />
                            </Button>
                        </Link>
                    ) : (
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 border-zinc-200 dark:border-zinc-800"
                            disabled
                        >
                            <ChevronLeft className="h-3.5 w-3.5" />
                        </Button>
                    )}

                    {/* Current Page Indicator */}
                    <div className="px-3 py-1 text-xs font-medium text-zinc-900 dark:text-zinc-100 tabular-nums">
                        Página {pagination.current_page} de {pagination.last_page}
                    </div>

                    {/* Next Page */}
                    {pagination.current_page < pagination.last_page ? (
                        <Link
                            href={pagination.links[pagination.current_page + 1]?.url || '#'}
                            preserveScroll
                        >
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0 border-zinc-200 dark:border-zinc-800"
                            >
                                <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                        </Link>
                    ) : (
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 border-zinc-200 dark:border-zinc-800"
                            disabled
                        >
                            <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                    )}

                    {/* Last Page */}
                    {pagination.current_page < pagination.last_page ? (
                        <Link
                            href={pagination.links[pagination.links.length - 1]?.url || '#'}
                            preserveScroll
                        >
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0 border-zinc-200 dark:border-zinc-800"
                            >
                                <ChevronsRight className="h-3.5 w-3.5" />
                            </Button>
                        </Link>
                    ) : (
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 border-zinc-200 dark:border-zinc-800"
                            disabled
                        >
                            <ChevronsRight className="h-3.5 w-3.5" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
