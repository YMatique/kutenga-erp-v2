import DocumentList from '@/pages/billing/shared/document-list';

export default function CreditNotesIndex(props: any) {
    return (
        <DocumentList
            {...props}
            createHref="/billing/credit-notes/create"
            showHrefPrefix="/billing/credit-notes"
        />
    );
}
