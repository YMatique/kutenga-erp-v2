import { Head, useForm } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { login } from '@/routes';

export default function ForgotPassword({ status }: { status?: string }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/forgot-password');
    };

    return (
        <>
            <Head title="Recuperar Palavra-passe" />

            {status && (
                <div className="mb-4 text-center text-sm font-medium text-[#2DB8A0] bg-[#2DB8A0]/10 p-3 rounded-md">
                    {status}
                </div>
            )}

            <div className="space-y-6">
                <div className="text-center">
                    <h1 className="text-2xl font-semibold tracking-tight">Recuperar Palavra-passe</h1>
                    <p className="text-sm text-slate-500 mt-2">
                        Esqueceste-te da tua palavra-passe? Sem problema. Basta indicares o teu endereço de e-mail e enviaremos um link para definires uma nova.
                    </p>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    <div className="grid gap-2">
                        <Label htmlFor="email">Endereço de e-mail</Label>
                        <Input
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            autoComplete="email"
                            autoFocus
                            placeholder="exemplo@empresa.com"
                        />

                        <InputError message={errors.email} />
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-[#2DB8A0] hover:bg-[#259b86] text-white"
                        disabled={processing || !data.email}
                    >
                        {processing && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Enviar Link de Recuperação
                    </Button>
                </form>

                <div className="text-center text-sm text-slate-500">
                    <span>Lembraste-te da palavra-passe?</span>{' '}
                    <TextLink href={login()} className="text-[#2DB8A0] hover:text-[#259b86]">Iniciar Sessão</TextLink>
                </div>
            </div>
        </>
    );
}

ForgotPassword.layout = {
    title: 'Recuperar palavra-passe',
    description: 'Insere o teu e-mail para receberes o link de recuperação.',
};
