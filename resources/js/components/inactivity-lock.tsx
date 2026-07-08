import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lock, Loader2 } from 'lucide-react';
import { usePage, useForm } from '@inertiajs/react';

export function InactivityLock() {
    const { auth } = usePage<any>().props;
    const [locked, setLocked] = useState(false);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        password: '',
    });

    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const INACTIVITY_LIMIT = 1 * 60 * 1000; // 1 minutes

    const resetTimer = () => {
        if (locked) return;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            setLocked(true);
        }, INACTIVITY_LIMIT);
    };

    useEffect(() => {
        const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
        events.forEach((event) => window.addEventListener(event, resetTimer));
        resetTimer();

        return () => {
            events.forEach((event) => window.removeEventListener(event, resetTimer));
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [locked]);

    // Only render if there's a logged-in user
    if (!auth?.user) return null;

    const handleUnlock = (e: React.FormEvent) => {
        e.preventDefault();

        post('/unlock-screen', {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setLocked(false);
                reset('password');
                clearErrors();
                resetTimer();
            }
        });
    };

    return (
        <Dialog open={locked} onOpenChange={() => { }}>
            <DialogContent
                className="sm:max-w-md [&>button]:hidden"
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <DialogHeader className="flex flex-col items-center justify-center pt-8 pb-4">
                    <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <Lock className="h-8 w-8 text-slate-600" />
                    </div>
                    <DialogTitle className="text-xl">Sessão Bloqueada</DialogTitle>
                    <DialogDescription className="text-center mt-2">
                        Por motivos de segurança, a sua sessão foi bloqueada devido à inatividade.
                        <br /> Digite a sua senha para continuar.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleUnlock} className="space-y-4 px-2 pb-6">
                    <div className="space-y-2">
                        <Input
                            type="password"
                            placeholder="Sua senha..."
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            disabled={processing}
                            autoFocus
                        />
                        {errors.password && <p className="text-sm text-red-500 font-medium">{errors.password}</p>}
                    </div>

                    <Button type="submit" className="w-full bg-[#2DB8A0] hover:bg-[#259b86] text-white" disabled={processing || !data.password}>
                        {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Desbloquear'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
