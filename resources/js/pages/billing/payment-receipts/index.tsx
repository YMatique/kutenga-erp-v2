import DocumentList from '@/pages/billing/shared/document-list';

const breadcrumbs = [
    { title: 'Faturação', href: '#' },
    { title: 'Recibos', href: '/billing/payment-receipts' },
];

export default function PaymentReceiptsIndex(props: any) {
    return (
        <DocumentList
            {...props}
            showHrefPrefix="/billing/payment-receipts"
            hideCreateButton={true}
        />
    );
}

PaymentReceiptsIndex.layout = {
    breadcrumbs,
};
