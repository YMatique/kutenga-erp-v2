import DocumentForm from '@/pages/billing/shared/document-form';

export default function QuotesCreate(props: any) {
    return (
        <DocumentForm
            {...props}
            method="post"
            submitRoute="/billing/quotes"
            cancelRoute="/billing/quotes"
        />
    );
}
