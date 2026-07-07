import DocumentForm from '@/pages/billing/shared/document-form';

export default function InvoicesEdit({ document, ...props }: any) {
    return (
        <DocumentForm
            {...props}
            document={document}
            method="put"
            submitRoute={`/billing/invoices/${document.id}`}
            cancelRoute={`/billing/invoices/${document.id}`}
        />
    );
}
