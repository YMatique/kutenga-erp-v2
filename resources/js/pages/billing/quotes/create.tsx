import DocumentForm from '@/pages/billing/shared/document-form';

const breadcrumbs = [
    { title: 'Faturação', href: '#' },
    { title: 'Cotações', href: '/billing/quotes' },
    { title: 'Nova Cotação', href: '#' },
];

export default function QuotesCreate(props: any) {
    return (
        <DocumentForm
            {...props}
            method="post"
            submitRoute="/billing/quotes"
            cancelRoute="/billing/quotes"
        />
    );
}

QuotesCreate.layout = {
    breadcrumbs,
};
