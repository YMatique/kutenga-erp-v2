import { Link } from '@inertiajs/react';
import { User, Shield, Palette, Building2, Users, KeyRound, CreditCard } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn, toUrl } from '@/lib/utils';
import { edit as editAppearance } from '@/routes/appearance';
import { edit as editCompany } from '@/routes/company-settings';
import { edit } from '@/routes/profile';
import { index as rolesIndex } from '@/routes/roles';
import { edit as editSecurity } from '@/routes/security';
import { index as usersIndex } from '@/routes/users';
import type { NavItem } from '@/types';

const sidebarNavItems: NavItem[] = [
    { title: 'Perfil',      href: edit(),           icon: User },
    { title: 'Segurança',   href: editSecurity(),   icon: Shield },
    { title: 'Aparência',   href: editAppearance(), icon: Palette },
    { title: 'Empresa',     href: editCompany(),    icon: Building2 },
    { title: 'Subscrição',  href: '/settings/subscription', icon: CreditCard },
    { title: 'Equipa',      href: usersIndex(),     icon: Users },
    { title: 'Papéis',      href: rolesIndex(),     icon: KeyRound },
];

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { isCurrentOrParentUrl } = useCurrentUrl();

    return (
        <div className="">
            {/* Page header */}
            <div className="bg-white border border-slate-200 rounded-[4px] shadow-xs px-6 py-4 mb-6">
                <h1 className="text-[18px] font-semibold text-slate-900 leading-tight">Definições</h1>
                <p className="text-sm text-slate-500 mt-0.5">Gerencie o seu perfil e preferências da conta</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Settings sidebar nav */}
                <aside className="w-full lg:w-52 flex-shrink-0">
                    <div className="bg-white border border-slate-200 rounded-[4px] shadow-xs overflow-hidden">
                        <nav aria-label="Definições" className="divide-y divide-slate-100">
                            {sidebarNavItems.map((item, index) => {
                                const active = isCurrentOrParentUrl(item.href ?? '');

                                return (
                                    <Link
                                        key={`${toUrl(item.href)}-${index}`}
                                        href={item.href ?? ''}
                                        className={cn(
                                            'flex items-center gap-3 px-4 py-3 text-sm transition-colors',
                                            active
                                                ? 'bg-[#2DB8A0]/8 text-[#2DB8A0] font-medium border-l-2 border-[#2DB8A0]'
                                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                                        )}
                                    >
                                        {item.icon && (
                                            <item.icon className={cn('h-4 w-4 flex-shrink-0', active ? 'text-[#2DB8A0]' : 'text-slate-400')} />
                                        )}
                                        {item.title}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                </aside>

                {/* Content area */}
                <div className="flex-1 min-w-0">
                    <div className="bg-white border border-slate-200 rounded-[4px] shadow-xs p-6 max-w-4xl">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
