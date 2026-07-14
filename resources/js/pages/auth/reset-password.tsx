import { Head, useForm } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Props = {
    token: string;
    email: string;
    passwordRules?: string;
};

export default function ResetPassword({ token, email, passwordRules }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/reset-password', {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <>
            <Head title="Redefinir Palavra-passe" />

            <div className="space-y-6">
                <div className="text-center">
                    <h1 className="text-2xl font-semibold tracking-tight">Nova Palavra-passe</h1>
                    <p className="text-sm text-slate-500 mt-2">
                        Por favor, introduz a tua nova palavra-passe abaixo.
                    </p>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    <div className="grid gap-2">
                        <Label htmlFor="email">Endereço de e-mail</Label>
                        <Input
                            id="email"
                            type="email"
                            name="email"
                            autoComplete="email"
                            value={data.email}
                            className="bg-slate-50 text-slate-500"
                            readOnly
                        />
                        <InputError message={errors.email} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password">Nova Palavra-passe</Label>
                        <PasswordInput
                            id="password"
                            name="password"
                            autoComplete="new-password"
                            autoFocus
                            placeholder="A tua nova palavra-passe"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            passwordrules={passwordRules}
                        />
                        <InputError message={errors.password} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password_confirmation">Confirmar Palavra-passe</Label>
                        <PasswordInput
                            id="password_confirmation"
                            name="password_confirmation"
                            autoComplete="new-password"
                            placeholder="Repete a nova palavra-passe"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            passwordrules={passwordRules}
                        />
                        <InputError message={errors.password_confirmation} />
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-[#2DB8A0] hover:bg-[#259b86] text-white"
                        disabled={processing || !data.password || !data.password_confirmation}
                    >
                        {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Guardar Palavra-passe
                    </Button>
                </form>
            </div>
        </>
    );
}

ResetPassword.layout = {
    title: 'Redefinir Palavra-passe',
    description: 'Por favor, introduz a tua nova palavra-passe.',
};
