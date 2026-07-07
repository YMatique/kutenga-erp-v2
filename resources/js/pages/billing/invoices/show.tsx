import DocumentShow from '@/pages/billing/shared/document-show';

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
