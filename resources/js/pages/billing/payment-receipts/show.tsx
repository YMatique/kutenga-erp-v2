import AppLayout from '@/layouts/app-layout';
import DocumentShow from '@/pages/billing/shared/document-show';

export default function PaymentReceiptsShow({ document, ...props }: any) {
    return (
        <DocumentShow
            {...props}
            document={document}
            backRoute="/billing/payment-receipts"
            confirmRoute={`/billing/payment-receipts/${document.id}/confirm`} // Technically not used for RC as they are auto-confirmed
            cancelRoute={`/billing/payment-receipts/${document.id}/cancel`}
        />
    );
}

PaymentReceiptsShow.layout = (page: any) => {
    const doc = page.props?.document;
    const label = doc?.document_number || 'Recibo';

    return (
        <AppLayout breadcrumbs={[
            { title: 'Faturação', href: '#' },
            { title: 'Recibos (Pagamentos)', href: '/billing/payment-receipts' },
            { title: label, href: '#' },
        ]}>
            {page}
        </AppLayout>
    );
};
