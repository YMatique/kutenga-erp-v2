import DocumentForm from '@/pages/billing/shared/document-form';

const breadcrumbs = [
    { title: 'Faturação', href: '#' },
    { title: 'Notas de Débito', href: '/billing/debit-notes' },
    { title: 'Nova Nota de Débito', href: '#' },
];

export default function DebitNotesCreate(props: any) {
    return (
        <DocumentForm
            {...props}
            method="post"
            submitRoute="/billing/debit-notes"
            cancelRoute="/billing/debit-notes"
        />
    );
}

DebitNotesCreate.layout = {
    breadcrumbs,
};
