import DocumentList from '@/pages/billing/shared/document-list';

const breadcrumbs = [
    { title: 'Faturação', href: '#' },
    { title: 'Faturas a Crédito', href: '/billing/invoices' },
];

export default function InvoicesIndex(props: any) {
    return (
        <DocumentList
            {...props}
            createHref="/billing/invoices/create"
            showHrefPrefix="/billing/invoices"
        />
    );
}

InvoicesIndex.layout = {
    breadcrumbs,
};
