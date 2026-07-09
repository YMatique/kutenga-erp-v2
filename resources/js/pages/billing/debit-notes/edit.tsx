import DocumentForm from '@/pages/billing/shared/document-form';
import AppLayout from '@/layouts/app-layout';

export default function DebitNotesEdit({ document, ...props }: any) {
    return (
        <DocumentForm
            {...props}
            document={document}
            method="put"
            submitRoute={`/billing/debit-notes/${document.id}`}
            cancelRoute={`/billing/debit-notes/${document.id}`}
        />
    );
}

DebitNotesEdit.layout = (page: any) => {
    const doc = page.props?.document;
    const label = doc?.document_number || 'Rascunho';
    return (
        <AppLayout breadcrumbs={[
            { title: 'Faturação', href: '#' },
            { title: 'Notas de Débito', href: '/billing/debit-notes' },
            { title: `Editar: ${label}`, href: '#' },
        ]}>
            {page}
        </AppLayout>
    );
};
