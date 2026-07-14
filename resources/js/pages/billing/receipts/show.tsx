import AppLayout from '@/layouts/app-layout';
import DocumentShow from '@/pages/billing/shared/document-show';

export default function ReceiptsShow({ document, ...props }: any) {
    return (
        <DocumentShow
            {...props}
            document={document}
            backRoute="/billing/receipts"
            confirmRoute={`/billing/receipts/${document.id}/confirm`}
            cancelRoute={`/billing/receipts/${document.id}/cancel`}
        />
    );
}

ReceiptsShow.layout = (page: any) => {
    const doc = page.props?.document;
    const label = doc?.document_number || 'Rascunho';

    return (
        <AppLayout breadcrumbs={[
            { title: 'Faturação', href: '#' },
            { title: 'Faturas-Recibo', href: '/billing/receipts' },
            { title: label, href: '#' },
        ]}>
            {page}
        </AppLayout>
    );
};
