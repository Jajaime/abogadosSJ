/* eslint-disable @next/next/no-img-element */
'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useMemo } from 'react';
import { Button } from 'primereact/button';
import { accessReasonToMessage } from '@/lib/auth-messages';

const AccessDeniedPage = () => {
  const router = useRouter();
  const sp = useSearchParams();

  const reason = sp.get('reason') || '';
  const back = sp.get('back') || '/';

  const code = sp.get('code') || 'unknown';
  const detail = sp.get('detail') || '';
  const next = sp.get('next') || '/';

  const msg = useMemo(() => accessReasonToMessage[code] ?? 'No tienes acceso a esta sección.', [code]);

  return (
    <div className="surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden">
      <div className="flex flex-column align-items-center justify-content-center">
        <div
          style={{
            borderRadius: '56px',
            padding: '0.3rem',
            background: 'linear-gradient(180deg, rgba(247, 149, 48, 0.4) 10%, rgba(247, 149, 48, 0) 30%)'
          }}
        >
          <div className="w-full surface-card py-8 px-5 sm:px-8 flex flex-column align-items-center" style={{ borderRadius: '53px' }}>
            <div className="flex justify-content-center align-items-center bg-pink-500 border-circle" style={{ height: '3.2rem', width: '3.2rem' }}>
              <i className="pi pi-fw pi-exclamation-circle text-2xl text-white"></i>
            </div>
            <h1 className="text-900 font-bold text-5xl mb-2">Acceso Denegado</h1>
            <div className="text-600 mb-5">{msg}</div>
            {detail && (
              <pre className="text-xs bg-gray-50 p-3 rounded mb-4 overflow-auto w-full max-w-2xl">{detail}</pre>
            )}
            <img src="/demo/images/access/asset-access.svg" alt="Acceso denegado" className="mb-5" width="80%" />
            <div className="flex gap-2">
              <Button icon="pi pi-arrow-left" label="Volver" text onClick={() => router.push(next)} />
              <Button icon="pi pi-user" label="Cambiar de cuenta" text onClick={() => router.push('/auth/login')} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessDeniedPage;
