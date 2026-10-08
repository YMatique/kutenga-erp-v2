import { router } from '@inertiajs/react';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface ConfirmDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    deleteUrl: string;
    title?: string;
    description?: string;
    onSuccess?: () => void;
    method?: 'delete' | 'post';
    confirmLabel?: string;
}

export function ConfirmDeleteModal({
    isOpen,
    onClose,
    deleteUrl,
    title = 'Tem certeza?',
    description = 'Esta ação não pode ser desfeita. Isso excluirá permanentemente este registro de nossos servidores.',
    onSuccess,
    method = 'delete',
    confirmLabel,
}: ConfirmDeleteModalProps) {
    const [processing, setProcessing] = useState(false);

    const handleDelete = () => {
        const options = {
            onStart: () => setProcessing(true),
            onFinish: () => {
                setProcessing(false);
                onClose();
            },
            onSuccess: () => {
                if (onSuccess) {
                    onSuccess();
                }
            },
        };

        // router.post recebe (url, dados, opções); router.delete recebe (url, opções).
        // Passar as opções como 2.º argumento do post fazia com que fossem enviadas como dados
        // e os callbacks (onStart/onFinish/onSuccess) nunca corressem.
        if (method === 'post') {
            router.post(deleteUrl, {}, options);
        } else {
            router.delete(deleteUrl, options);
        }
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
                        {processing ? (confirmLabel ? 'Processando...' : 'Excluindo...') : (confirmLabel || 'Excluir')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
