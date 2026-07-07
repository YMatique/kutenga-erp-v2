import DocumentShow from '@/pages/billing/shared/document-show';

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
