import { createInertiaApp } from '@inertiajs/react';

import { initializeTheme } from '@/hooks/use-appearance';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import SettingsLayout from '@/layouts/settings/layout';
import 'ziggy-js'; // Adicione esta linha para inicializar o Ziggy

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    layout: (name) => {
        switch (true) {
            case name === 'welcome':
                return null;
            case name === 'index':
                return null;
            case name === 'pos/Index':
                return null; // POS has its own full-screen layout
            case name.startsWith('onboarding'):
                return null;
            case name.startsWith('auth/'):
                return AuthLayout;
            case name === 'settings/audits':
                return AppLayout;
            case name.startsWith('settings/'):
                return [AppLayout, SettingsLayout];
            default:
                return AppLayout;
        }
    },
    strictMode: true,
    withApp(app) {
        return <>{app}</>;
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
