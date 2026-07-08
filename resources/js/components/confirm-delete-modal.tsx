import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { router } from '@inertiajs/react';
import { useState } from 'react';
import { Trash2 } from 'lucide-react';

interface ConfirmDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    deleteUrl: string;
    title?: string;
    description?: string;
    onSuccess?: () => void;
}

export function ConfirmDeleteModal({
    isOpen,
    onClose,
    deleteUrl,
    title = 'Tem certeza?',
    description = 'Esta ação não pode ser desfeita. Isso excluirá permanentemente este registro de nossos servidores.',
    onSuccess,
}: ConfirmDeleteModalProps) {
    const [processing, setProcessing] = useState(false);

    const handleDelete = () => {
        router.delete(deleteUrl, {
            onStart: () => setProcessing(true),
            onFinish: () => {
                setProcessing(false);
                onClose();
            },
            onSuccess: () => {
                if (onSuccess) onSuccess();
            },
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <div className="flex items-center gap-2 text-destructive mb-2">
                        <Trash2 className="h-5 w-5" />
                        <DialogTitle>{title}</DialogTitle>
                    </div>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-4 flex sm:justify-end gap-2">
                    <Button variant="outline" onClick={onClose} disabled={processing}>
                        Cancelar
                    </Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={processing}>
                        {processing ? 'Excluindo...' : 'Excluir'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
