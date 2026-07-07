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
