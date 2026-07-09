import DocumentList from '@/pages/billing/shared/document-list';

const breadcrumbs = [
    { title: 'Faturação', href: '#' },
    { title: 'Notas de Débito', href: '/billing/debit-notes' },
];

export default function DebitNotesIndex(props: any) {
    return (
        <DocumentList
            {...props}
            createHref="/billing/debit-notes/create"
            showHrefPrefix="/billing/debit-notes"
        />
    );
}

DebitNotesIndex.layout = {
    breadcrumbs,
};
