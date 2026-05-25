import KutengaLayout from '@/layouts/kutenga-layout';
import type { BreadcrumbItem } from '@/types';

export default function AppLayout({
    breadcrumbs = [],
    children,
}: {
    breadcrumbs?: BreadcrumbItem[];
    children: React.ReactNode;
}) {
    return (
        <KutengaLayout breadcrumbs={breadcrumbs}>
            {children}
        </KutengaLayout>
    );
}
