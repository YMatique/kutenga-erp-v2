import DocumentList from '@/pages/billing/shared/document-list';

const breadcrumbs = [
    { title: 'Faturação', href: '#' },
    { title: 'Faturas-Recibo', href: '/billing/receipts' },
];

export default function ReceiptsIndex(props: any) {
    return (
        <DocumentList
            {...props}
            createHref="/billing/receipts/create"
            showHrefPrefix="/billing/receipts"
        />
    );
}

ReceiptsIndex.layout = {
    breadcrumbs,
};
