import DocumentShow from '@/pages/billing/shared/document-show';

export default function CreditNotesShow({ document, ...props }: any) {
    return (
        <DocumentShow
            {...props}
            document={document}
            backRoute="/billing/credit-notes"
            confirmRoute={`/billing/credit-notes/${document.id}/confirm`}
            cancelRoute={`/billing/credit-notes/${document.id}/cancel`}
        />
    );
}
