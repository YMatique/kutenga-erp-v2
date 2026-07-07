import DocumentShow from '@/pages/billing/shared/document-show';
import AppLayout from '@/layouts/app-layout';

export default function CreditNotesShow({ document, ...props }: any) {
    return (
        <DocumentShow
            {...props}
            document={document}
            backRoute="/billing/credit-notes"
            confirmRoute={`/billing/credit-notes/${document.id}/confirm`}
            cancelRoute={`/billing/credit-notes/${document.id}/cancel`}
        />
    );
}

CreditNotesShow.layout = (page: any) => {
    const doc = page.props.document;
    const label = doc.document_number || 'Rascunho';
    return (
        <AppLayout breadcrumbs={[
            { title: 'Faturação', href: '#' },
            { title: 'Notas de Crédito', href: '/billing/credit-notes' },
            { title: label, href: '#' },
        ]}>
            {page}
        </AppLayout>
    );
};
