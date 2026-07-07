import DocumentList from '@/pages/billing/shared/document-list';

const breadcrumbs = [
    { title: 'Faturação', href: '#' },
    { title: 'Notas de Crédito', href: '/billing/credit-notes' },
];

export default function CreditNotesIndex(props: any) {
    return (
        <DocumentList
            {...props}
            createHref="/billing/credit-notes/create"
            showHrefPrefix="/billing/credit-notes"
        />
    );
}

CreditNotesIndex.layout = {
    breadcrumbs,
};
