import type { Metadata } from 'next';
import React from 'react';
import Layout from '../../layout/layout';

interface AppLayoutProps {
    children: React.ReactNode;
}

export const metadata: Metadata = {
    title: 'Ss&Cía-Abogados',
    description: 'Agencia juridica que ofrece servicios legales de alta calidad.',
    robots: { index: false, follow: false },
    openGraph: {
        type: 'website',
        title: 'Abogados Ss&Cía',
        url: 'https://www.ssycia.cl',
        description: '',
        images: ['https://www.primefaces.org/static/social/sakai-react.png'],
        ttl: 604800
    },
    icons: {
        icon: '/favicon.ico'
    }
};

export const viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false
  };

export default function AppLayout({ children }: AppLayoutProps) {
    return <Layout>{children}</Layout>;
}
