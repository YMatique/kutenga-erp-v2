import { usePage, useForm } from '@inertiajs/react';
import { Lock, Loader2, User } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export function InactivityLock() {
    const { auth } = usePage<any>().props;
    const [locked, setLocked] = useState(false);
    const [time, setTime] = useState(new Date());

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        password: '',
    });

    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // 1 minutes of inactivity limit
    const INACTIVITY_LIMIT = 5 * 60 * 1000;

    const resetTimer = () => {
        if (locked) {
return;
}

        if (timeoutRef.current) {
clearTimeout(timeoutRef.current);
}

        timeoutRef.current = setTimeout(() => {
            setLocked(true);
            sessionStorage.setItem('screen_locked', 'true');
            fetch('/lock-screen', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.head.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '',
                },
            });
        }, INACTIVITY_LIMIT);
    };

    useEffect(() => {
        if (sessionStorage.getItem('screen_locked') === 'true') {
            setLocked(true);
        }
    }, []);

    useEffect(() => {
        const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
        events.forEach((event) => window.addEventListener(event, resetTimer));
        resetTimer();

        return () => {
            events.forEach((event) => window.removeEventListener(event, resetTimer));

            if (timeoutRef.current) {
clearTimeout(timeoutRef.current);
}
        };
    }, [locked]);

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (locked) {
            setTime(new Date());
            interval = setInterval(() => {
                setTime(new Date());
            }, 1000);
        }

        return () => clearInterval(interval);
    }, [locked]);

    // Only render if there's a logged-in user
    if (!auth?.user) {
return null;
}

    const handleUnlock = (e: React.FormEvent) => {
        e.preventDefault();

        post('/unlock-screen', {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setLocked(false);
                sessionStorage.removeItem('screen_locked');
                reset('password');
                clearErrors();
                resetTimer();
            }
        });
    };

    if (!locked) {
return null;
}

    const formattedTime = time.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
    const formattedDate = time.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' });

    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-zinc-950/95 backdrop-blur-xl animate-in fade-in duration-300">
            {/* Clock Section */}
            <div className="absolute top-20 flex flex-col items-center text-white/90">
                <Lock className="h-6 w-6 mb-4 opacity-50" />
                <h1 className="text-8xl font-light tracking-tighter mb-2">{formattedTime}</h1>
                <p className="text-xl font-medium opacity-70 capitalize">{formattedDate}</p>
            </div>

            {/* Unlock Section */}
            <div className="mt-32 flex flex-col items-center w-full max-w-sm px-6">
                <div className="h-24 w-24 rounded-full bg-zinc-800 border-4 border-zinc-900 shadow-xl overflow-hidden flex items-center justify-center mb-6">
                    {auth.user.profile_photo_url ? (
                        <img src={auth.user.profile_photo_url} alt={auth.user.name} className="h-full w-full object-cover" />
                    ) : (
                        <User className="h-10 w-10 text-zinc-400" />
                    )}
                </div>

                <h2 className="text-2xl font-semibold text-white mb-1">{auth.user.name}</h2>
                <p className="text-zinc-400 mb-8 text-center text-sm">
                    A sua sessão foi bloqueada devido à inatividade.
                </p>

                <form onSubmit={handleUnlock} className="w-full space-y-4">
                    <div className="space-y-2">
                        <Input
                            type="password"
                            placeholder="Introduza a sua senha para desbloquear..."
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            disabled={processing}
                            autoFocus
                            className={cn(
                                "h-12 bg-zinc-900/50 border-zinc-700 text-white placeholder:text-zinc-500 text-center text-lg",
                                errors.password && "border-red-500/50 focus-visible:ring-red-500"
                            )}
                        />
                        {errors.password && (
                            <p className="text-sm text-red-400 font-medium text-center">{errors.password}</p>
                        )}
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-12 bg-[#2DB8A0] hover:bg-[#259b86] text-white text-base rounded-full shadow-lg shadow-[#2DB8A0]/20 transition-all hover:scale-[1.02]"
                        disabled={processing || !data.password}
                    >
                        {processing ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Desbloquear Sessão'}
                    </Button>
                </form>
            </div>
        </div>
    );
}
