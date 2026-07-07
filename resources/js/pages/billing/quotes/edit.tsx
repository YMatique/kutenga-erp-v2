import DocumentForm from '@/pages/billing/shared/document-form';

export default function QuotesEdit({ document, ...props }: any) {
    return (
        <DocumentForm
            {...props}
            document={document}
            method="put"
            submitRoute={`/billing/quotes/${document.id}`}
            cancelRoute={`/billing/quotes/${document.id}`}
        />
    );
}
