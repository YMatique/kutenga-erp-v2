import { Link } from '@inertiajs/react';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="flex min-h-svh">
            {/* ── Left Panel (hidden on mobile) ─────────────────── */}
            <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center bg-[#1A2332] relative overflow-hidden">
                {/* Subtle decorative circles */}
                <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-[#2DB8A0]/10 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-32 -right-16 h-80 w-80 rounded-full bg-[#E8A020]/10 blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col items-center text-center px-12 gap-8">
                    {/* Logo */}
                    <Link href={home()} className="flex flex-col items-center gap-4">
                        <div className="h-20 w-20 rounded-[4px] bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden backdrop-blur-sm">
                            <img
                                src="/kutenga-logo.png"
                                alt="Kutenga Logo"
                                className="h-14 w-14 object-contain"
                                onError={(e) => {
                                    // fallback to SVG icon if image not found
                                    e.currentTarget.style.display = 'none';
                                }}
                            />
                            {/* Fallback SVG (always rendered but hidden when image loads) */}
                            {/* <svg viewBox="0 0 40 42" xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 fill-[#2DB8A0] absolute">
                                <path
                                    fillRule="evenodd"
                                    clipRule="evenodd"
                                    d="M17.2 5.63325L8.6 0.855469L0 5.63325V32.1434L16.2 41.1434L32.4 32.1434V23.699L40 19.4767V9.85547L31.4 5.07769L22.8 9.85547V18.2999L17.2 21.411V5.63325ZM38 18.2999L32.4 21.411V15.2545L38 12.1434V18.2999ZM36.9409 10.4439L31.4 13.5221L25.8591 10.4439L31.4 7.36561L36.9409 10.4439ZM24.8 18.2999V12.1434L30.4 15.2545V21.411L24.8 18.2999ZM23.8 20.0323L29.3409 23.1105L16.2 30.411L10.6591 27.3328L23.8 20.0323ZM7.6 27.9212L15.2 32.1434V38.2999L2 30.9666V7.92116L7.6 11.0323V27.9212ZM8.6 9.29991L3.05913 6.22165L8.6 3.14339L14.1409 6.22165L8.6 9.29991ZM30.4 24.8101L17.2 32.1434V38.2999L30.4 30.9666V24.8101ZM9.6 11.0323L15.2 7.92117V22.5221L9.6 25.6333V11.0323Z"
                                />
                            </svg> */}
                        </div>
                    </Link>

                    {/* App name */}
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Kutenga ERP</h1>
                        <p className="text-[#2DB8A0] text-base mt-2 font-medium">Gestão empresarial integrada</p>
                    </div>

                    {/* Decorative divider */}
                    <div className="w-16 h-0.5 bg-gradient-to-r from-[#2DB8A0] to-[#E8A020] rounded-full" />

                    {/* Tagline */}
                    <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
                        A plataforma completa para gerir inventário, vendas, faturação e muito mais — tudo num só lugar.
                    </p>
                </div>
            </div>

            {/* ── Right Panel (form area) ───────────────────────── */}
            <div className="flex flex-1 flex-col items-center justify-center bg-slate-50 px-6 py-12 lg:px-12">
                <div className="w-full max-w-sm">
                    {/* Mobile logo */}
                    <div className="flex lg:hidden flex-col items-center mb-8">
                        <Link href={home()} className="flex flex-col items-center gap-3">
                            <div className="h-12 w-12 rounded-[4px] bg-[#1A2332] flex items-center justify-center overflow-hidden">
                                <img
                                    src="/kutenga-logo.png"
                                    alt="Kutenga Logo"
                                    className="h-9 w-9 object-contain"
                                    onError={(e) => {
 e.currentTarget.style.display = 'none'; 
}}
                                />
                                <svg viewBox="0 0 40 42" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 fill-[#2DB8A0] absolute">
                                    <path
                                        fillRule="evenodd"
                                        clipRule="evenodd"
                                        d="M17.2 5.63325L8.6 0.855469L0 5.63325V32.1434L16.2 41.1434L32.4 32.1434V23.699L40 19.4767V9.85547L31.4 5.07769L22.8 9.85547V18.2999L17.2 21.411V5.63325ZM38 18.2999L32.4 21.411V15.2545L38 12.1434V18.2999ZM36.9409 10.4439L31.4 13.5221L25.8591 10.4439L31.4 7.36561L36.9409 10.4439ZM24.8 18.2999V12.1434L30.4 15.2545V21.411L24.8 18.2999ZM23.8 20.0323L29.3409 23.1105L16.2 30.411L10.6591 27.3328L23.8 20.0323ZM7.6 27.9212L15.2 32.1434V38.2999L2 30.9666V7.92116L7.6 11.0323V27.9212ZM8.6 9.29991L3.05913 6.22165L8.6 3.14339L14.1409 6.22165L8.6 9.29991ZM30.4 24.8101L17.2 32.1434V38.2999L30.4 30.9666V24.8101ZM9.6 11.0323L15.2 7.92117V22.5221L9.6 25.6333V11.0323Z"
                                    />
                                </svg>
                            </div>
                            <span className="text-lg font-bold text-[#1A2332]">Kutenga ERP</span>
                        </Link>
                    </div>

                    {/* Title and Description */}
                    <div className="text-center mb-8">
                        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
                        {description && (
                            <p className="text-sm text-slate-500 mt-1">{description}</p>
                        )}
                    </div>

                    {/* Form children */}
                    <div className="bg-white border border-slate-200 rounded-[4px] shadow-xs p-6">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
