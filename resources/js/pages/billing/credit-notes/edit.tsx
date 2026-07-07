import DocumentForm from '@/pages/billing/shared/document-form';

export default function CreditNotesEdit({ document, ...props }: any) {
    return (
        <DocumentForm
            {...props}
            document={document}
            method="put"
            submitRoute={`/billing/credit-notes/${document.id}`}
            cancelRoute={`/billing/credit-notes/${document.id}`}
        />
    );
}
