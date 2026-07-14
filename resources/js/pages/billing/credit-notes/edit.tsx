import AppLayout from '@/layouts/app-layout';
import DocumentForm from '@/pages/billing/shared/document-form';

export default function CreditNotesEdit({ document, ...props }: any) {
    return (
        <DocumentForm
            {...props}
            document={document}
            method="put"
            submitRoute={`/billing/credit-notes/${document.id}`}
            cancelRoute={`/billing/credit-notes/${document.id}`}
        />
    );
}

CreditNotesEdit.layout = (page: any) => {
    const doc = page.props?.document;
    const label = doc?.document_number || 'Rascunho';

    return (
        <AppLayout breadcrumbs={[
            { title: 'Faturação', href: '#' },
            { title: 'Notas de Crédito', href: '/billing/credit-notes' },
            { title: `Editar: ${label}`, href: '#' },
        ]}>
            {page}
        </AppLayout>
    );
};
