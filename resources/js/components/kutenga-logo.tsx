import React from 'react';
import { cn } from '@/lib/utils';

interface KutengaLogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {}

export function KutengaLogo({ className, ...props }: KutengaLogoProps) {
    return (
        <img
            src="/kutenga-logo.png"
            alt="Kutenga Logo"
            className={cn("h-8 w-auto object-contain", className)}
            {...props}
        />
    );
}
