import AppLayout from '@/layouts/app-layout';
import DocumentForm from '@/pages/billing/shared/document-form';

export default function ReceiptsEdit({ document, ...props }: any) {
    return (
        <DocumentForm
            {...props}
            document={document}
            method="put"
            submitRoute={`/billing/receipts/${document.id}`}
            cancelRoute={`/billing/receipts/${document.id}`}
        />
    );
}

ReceiptsEdit.layout = (page: any) => {
    const doc = page.props?.document;
    const label = doc?.document_number || 'Rascunho';

    return (
        <AppLayout breadcrumbs={[
            { title: 'Faturação', href: '#' },
            { title: 'Faturas-Recibo', href: '/billing/receipts' },
            { title: `Editar: ${label}`, href: '#' },
        ]}>
            {page}
        </AppLayout>
    );
};
