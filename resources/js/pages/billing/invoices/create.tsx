import DocumentForm from '@/pages/billing/shared/document-form';

const breadcrumbs = [
    { title: 'Faturação', href: '#' },
    { title: 'Faturas a Crédito', href: '/billing/invoices' },
    { title: 'Nova Fatura', href: '#' },
];

export default function InvoicesCreate(props: any) {
    return (
        <DocumentForm
            {...props}
            method="post"
            submitRoute="/billing/invoices"
            cancelRoute="/billing/invoices"
        />
    );
}

InvoicesCreate.layout = {
    breadcrumbs,
};
