import DocumentList from '@/pages/billing/shared/document-list';

export default function InvoicesIndex(props: any) {
    return (
        <DocumentList
            {...props}
            createHref="/billing/invoices/create"
            showHrefPrefix="/billing/invoices"
        />
    );
}
