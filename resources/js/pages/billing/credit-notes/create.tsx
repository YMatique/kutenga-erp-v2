import DocumentForm from '@/pages/billing/shared/document-form';

export default function CreditNotesCreate(props: any) {
    return (
        <DocumentForm
            {...props}
            method="post"
            submitRoute="/billing/credit-notes"
            cancelRoute="/billing/credit-notes"
        />
    );
}
