import DocumentForm from '@/pages/billing/shared/document-form';

const breadcrumbs = [
    { title: 'Faturação', href: '#' },
    { title: 'Faturas-Recibo', href: '/billing/receipts' },
    { title: 'Nova Fatura-Recibo', href: '#' },
];

export default function ReceiptsCreate(props: any) {
    return (
        <DocumentForm
            {...props}
            method="post"
            submitRoute="/billing/receipts"
            cancelRoute="/billing/receipts"
        />
    );
}

ReceiptsCreate.layout = {
    breadcrumbs,
};
