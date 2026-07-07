import DocumentList from '@/pages/billing/shared/document-list';

export default function ReceiptsIndex(props: any) {
    return (
        <DocumentList
            {...props}
            createHref="/billing/receipts/create"
            showHrefPrefix="/billing/receipts"
        />
    );
}
