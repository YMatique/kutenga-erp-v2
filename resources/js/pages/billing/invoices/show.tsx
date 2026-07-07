import DocumentShow from '@/pages/billing/shared/document-show';
import AppLayout from '@/layouts/app-layout';

export default function InvoicesShow({ document, ...props }: any) {
    return (
        <DocumentShow
            {...props}
            document={document}
            backRoute="/billing/invoices"
            confirmRoute={`/billing/invoices/${document.id}/confirm`}
            cancelRoute={`/billing/invoices/${document.id}/cancel`}
            receivePaymentRoute="/billing/invoices/receive-payment"
        />
    );
}

InvoicesShow.layout = (page: any) => {
    const doc = page.props.document;
    const label = doc.document_number || 'Rascunho';
    return (
        <AppLayout breadcrumbs={[
            { title: 'Faturação', href: '#' },
            { title: 'Faturas a Crédito', href: '/billing/invoices' },
            { title: label, href: '#' },
        ]}>
            {page}
        </AppLayout>
    );
};
