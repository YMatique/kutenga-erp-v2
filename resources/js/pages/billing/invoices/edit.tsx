import DocumentForm from '@/pages/billing/shared/document-form';
import AppLayout from '@/layouts/app-layout';

export default function InvoicesEdit({ document, ...props }: any) {
    return (
        <DocumentForm
            {...props}
            document={document}
            method="put"
            submitRoute={`/billing/invoices/${document.id}`}
            cancelRoute={`/billing/invoices/${document.id}`}
        />
    );
}

InvoicesEdit.layout = (page: any) => {
    const doc = page.props.document;
    const label = doc.document_number || 'Rascunho';
    return (
        <AppLayout breadcrumbs={[
            { title: 'Faturação', href: '#' },
            { title: 'Faturas a Crédito', href: '/billing/invoices' },
            { title: `Editar: ${label}`, href: '#' },
        ]}>
            {page}
        </AppLayout>
    );
};
