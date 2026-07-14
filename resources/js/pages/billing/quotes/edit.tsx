import AppLayout from '@/layouts/app-layout';
import DocumentForm from '@/pages/billing/shared/document-form';

export default function QuotesEdit({ document, ...props }: any) {
    return (
        <DocumentForm
            {...props}
            document={document}
            method="put"
            submitRoute={`/billing/quotes/${document.id}`}
            cancelRoute={`/billing/quotes/${document.id}`}
        />
    );
}

QuotesEdit.layout = (page: any) => {
    const doc = page.props?.document;
    const label = doc?.document_number || 'Rascunho';

    return (
        <AppLayout breadcrumbs={[
            { title: 'Faturação', href: '#' },
            { title: 'Cotações', href: '/billing/quotes' },
            { title: `Editar: ${label}`, href: '#' },
        ]}>
            {page}
        </AppLayout>
    );
};
