import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
};

export default function Login({
    status,
    canResetPassword,
    canRegister,
}: Props) {
    return (
        <>
            <Head title="Iniciar Sessão" />

            {status && (
                <div className="mb-4 text-center text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-[4px] px-4 py-2">
                    {status}
                </div>
            )}

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-5"
            >
                {({ processing, errors }) => (
                    <>
                        {/* Email */}
                        <div className="grid gap-1.5">
                            <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                                Endereço de email
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                name="email"
                                required
                                autoFocus
                                tabIndex={1}
                                autoComplete="email"
                                placeholder="email@empresa.com"
                                className="border border-slate-200 rounded-[4px] focus:ring-1 focus:ring-[#2DB8A0] focus:border-[#2DB8A0] h-10 text-sm"
                            />
                            <InputError message={errors.email} />
                        </div>

                        {/* Password */}
                        <div className="grid gap-1.5">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                                    Palavra-passe
                                </Label>
                                {canResetPassword && (
                                    <TextLink
                                        href={request()}
                                        className="text-xs text-[#2DB8A0] hover:text-[#24a08c] font-medium"
                                        tabIndex={5}
                                    >
                                        Esqueceu a senha?
                                    </TextLink>
                                )}
                            </div>
                            <PasswordInput
                                id="password"
                                name="password"
                                required
                                tabIndex={2}
                                autoComplete="current-password"
                                placeholder="••••••••"
                                className="border border-slate-200 rounded-[4px] focus:ring-1 focus:ring-[#2DB8A0] focus:border-[#2DB8A0] h-10 text-sm"
                            />
                            <InputError message={errors.password} />
                        </div>

                        {/* Remember me */}
                        <div className="flex items-center gap-2.5">
                            <Checkbox
                                id="remember"
                                name="remember"
                                tabIndex={3}
                                className="rounded-[4px] border-slate-300 data-[state=checked]:bg-[#2DB8A0] data-[state=checked]:border-[#2DB8A0]"
                            />
                            <Label htmlFor="remember" className="text-sm text-slate-600 cursor-pointer">
                                Lembrar-me
                            </Label>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            tabIndex={4}
                            disabled={processing}
                            data-test="login-button"
                            className="inline-flex items-center justify-center gap-2 w-full h-10 px-4 text-sm font-semibold text-white bg-[#2DB8A0] rounded-[4px] hover:bg-[#24a08c] disabled:opacity-60 disabled:cursor-not-allowed transition-colors mt-1"
                        >
                            {processing && <Spinner />}
                            Iniciar Sessão
                        </button>
                    </>
                )}
            </Form>

            {canRegister && (
                <p className="mt-5 text-center text-sm text-slate-500">
                    Não tem conta?{' '}
                    <TextLink href={register()} tabIndex={5} className="text-[#2DB8A0] hover:text-[#24a08c] font-medium">
                        Criar conta
                    </TextLink>
                </p>
            )}
        </>
    );
}

Login.layout = {
    title: 'Iniciar sessão na sua conta',
    description: 'Insira o seu email e palavra-passe para entrar',
};
