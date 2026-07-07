import DocumentList from '@/pages/billing/shared/document-list';

const breadcrumbs = [
    { title: 'Faturação', href: '#' },
    { title: 'Cotações', href: '/billing/quotes' },
];

export default function QuotesIndex(props: any) {
    return (
        <DocumentList
            {...props}
            createHref="/billing/quotes/create"
            showHrefPrefix="/billing/quotes"
        />
    );
}

QuotesIndex.layout = {
    breadcrumbs,
};
