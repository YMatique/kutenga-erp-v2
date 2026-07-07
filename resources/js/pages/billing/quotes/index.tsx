import DocumentList from '@/pages/billing/shared/document-list';

export default function QuotesIndex(props: any) {
    return (
        <DocumentList
            {...props}
            createHref="/billing/quotes/create"
            showHrefPrefix="/billing/quotes"
        />
    );
}
