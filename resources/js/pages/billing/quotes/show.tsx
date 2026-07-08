import DocumentShow from '@/pages/billing/shared/document-show';
import AppLayout from '@/layouts/app-layout';

export default function QuotesShow({ document, ...props }: any) {
    return (
        <DocumentShow
            {...props}
            document={document}
            backRoute="/billing/quotes"
            confirmRoute={`/billing/quotes/${document.id}/confirm`}
            cancelRoute={`/billing/quotes/${document.id}/cancel`}
        />
    );
}

QuotesShow.layout = (page: any) => {
    const doc = page.props?.document;
    const label = doc?.document_number || 'Rascunho';
    return (
        <AppLayout breadcrumbs={[
            { title: 'Faturação', href: '#' },
            { title: 'Cotações', href: '/billing/quotes' },
            { title: label, href: '#' },
        ]}>
            {page}
        </AppLayout>
    );
};
