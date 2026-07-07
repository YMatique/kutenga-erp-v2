import DocumentForm from '@/pages/billing/shared/document-form';

export default function ReceiptsEdit({ document, ...props }: any) {
    return (
        <DocumentForm
            {...props}
            document={document}
            method="put"
            submitRoute={`/billing/receipts/${document.id}`}
            cancelRoute={`/billing/receipts/${document.id}`}
        />
    );
}
