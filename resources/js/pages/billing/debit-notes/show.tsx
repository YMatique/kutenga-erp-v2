import AppLayout from '@/layouts/app-layout';
import DocumentShow from '@/pages/billing/shared/document-show';

export default function DebitNotesShow({ document, ...props }: any) {
    return (
        <DocumentShow
            {...props}
            document={document}
            backRoute="/billing/debit-notes"
            confirmRoute={`/billing/debit-notes/${document.id}/confirm`}
            cancelRoute={`/billing/debit-notes/${document.id}/cancel`}
        />
    );
}

DebitNotesShow.layout = (page: any) => {
    const doc = page.props?.document;
    const label = doc?.document_number || 'Rascunho';

    return (
        <AppLayout breadcrumbs={[
            { title: 'Faturação', href: '#' },
            { title: 'Notas de Débito', href: '/billing/debit-notes' },
            { title: label, href: '#' },
        ]}>
            {page}
        </AppLayout>
    );
};
