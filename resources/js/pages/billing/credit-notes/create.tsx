import DocumentForm from '@/pages/billing/shared/document-form';

const breadcrumbs = [
    { title: 'Faturação', href: '#' },
    { title: 'Notas de Crédito', href: '/billing/credit-notes' },
    { title: 'Nova Nota de Crédito', href: '#' },
];

export default function CreditNotesCreate(props: any) {
    return (
        <DocumentForm
            {...props}
            method="post"
            submitRoute="/billing/credit-notes"
            cancelRoute="/billing/credit-notes"
        />
    );
}

CreditNotesCreate.layout = {
    breadcrumbs,
};
