 

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { classNames } from 'primereact/utils';
import React, { forwardRef, useContext, useImperativeHandle, useRef } from 'react';
import { apiFetch } from '@/utils/apiClient';
import type { AppTopbarRef } from '@/types';
import { LayoutContext } from './context/layoutcontext';

const AppTopbar = forwardRef<AppTopbarRef>((props, ref) => {
    const router = useRouter();
    const { layoutConfig, layoutState, onMenuToggle, showProfileSidebar } = useContext(LayoutContext);
    const menubuttonRef = useRef(null);
    const topbarmenuRef = useRef(null);
    const topbarmenubuttonRef = useRef(null);

    useImperativeHandle(ref, () => ({
        menubutton: menubuttonRef.current,
        topbarmenu: topbarmenuRef.current,
        topbarmenubutton: topbarmenubuttonRef.current
    }));

    const handleLogout = async () => {
        try {
            const response = await apiFetch('/api/logout', { method: 'POST' });
            if (!response.ok) {
                console.warn('[LOGOUT_FAILED]', await response.text().catch(() => ''));
            }
        } catch (error) {
            console.error('[LOGOUT_ERROR]', error);
        } finally {
            router.push('/auth/login');
        }
    };

    return (
        <div className="layout-topbar">
            <Link href="/" className="layout-topbar-logo justify-center">
                <div className="text-white leading-tight">
                    <div className="text font-bold" style={{ fontSize: '1.15rem', fontWeight: 'bold', justifySelf: 'center' }}>
                        SALAS & JERIA
                    </div>
                    <div className="text tracking-wide" style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>
                        ABOGADOS LABORALES
                    </div>
                </div>
            </Link>

            <button ref={menubuttonRef} type="button" className="p-link layout-menu-button layout-topbar-button" onClick={onMenuToggle}>
                <i className="pi pi-bars" />
            </button>

            <button ref={topbarmenubuttonRef} type="button" className="p-link layout-topbar-menu-button layout-topbar-button" onClick={showProfileSidebar}>
                <i className="pi pi-ellipsis-v" />
            </button>

            <div ref={topbarmenuRef} className={classNames('layout-topbar-menu', { 'layout-topbar-menu-mobile-active': layoutState.profileSidebarVisible })}>
                <button type="button" className="p-link layout-topbar-button">
                    <i className="pi pi-calendar"></i>
                    <span>Calendar</span>
                </button>
                <button type="button" className="p-link layout-topbar-button">
                    <i className="pi pi-user"></i>
                    <span>Profile</span>
                </button>
                <button type="button" className="p-link layout-topbar-button" onClick={handleLogout}>
                    <i className="pi pi-sign-out"></i>
                    <span>Salir</span>
                </button>
            </div>
        </div>
    );
});

AppTopbar.displayName = 'AppTopbar';

export default AppTopbar;
