import DocumentForm from '@/pages/billing/shared/document-form';

export default function ReceiptsCreate(props: any) {
    return (
        <DocumentForm
            {...props}
            method="post"
            submitRoute="/billing/receipts"
            cancelRoute="/billing/receipts"
        />
    );
}
