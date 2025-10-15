/* eslint-disable @next/next/no-img-element */
'use client';
import { useSearchParams, useRouter } from 'next/navigation';
import React, { useMemo } from 'react';
import { Button } from 'primereact/button';
import { errorCodeToMessage } from '@/lib/auth-messages';
import { asset } from '@/utils/asset';

const ErrorPage = () => {
  const router = useRouter();
  const sp = useSearchParams();

  const code = sp.get('code') || 'unknown';
  const detail = sp.get('detail') || '';
  const next = sp.get('next') || '/';

  const msg = useMemo(() => errorCodeToMessage[code] ?? errorCodeToMessage.unknown, [code]);

  return (
    <div className="surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden">
      <div className="flex flex-column align-items-center justify-content-center">
        <div
          style={{
            borderRadius: '56px',
            padding: '0.3rem',
            background: 'linear-gradient(180deg, rgba(233, 30, 99, 0.4) 10%, rgba(33, 150, 243, 0) 30%)'
          }}
        >
          <div className="w-full surface-card py-8 px-5 sm:px-8 flex flex-column align-items-center" style={{ borderRadius: '53px' }}>
            <div className="flex justify-content-center align-items-center bg-pink-500 border-circle" style={{ height: '3.2rem', width: '3.2rem' }}>
              <i className="pi pi-fw pi-exclamation-circle text-2xl text-white"></i>
            </div>
            <h1 className="text-900 font-bold text-5xl mb-2">Ocurrió un Error</h1>
            <div className="text-600 mb-3">{msg}</div>
            {detail && (
              <pre className="text-xs bg-gray-50 p-3 rounded mb-4 overflow-auto w-full max-w-2xl">{detail}</pre>
            )}
            <img src={asset('/demo/images/error/asset-error.svg')} alt="Error" className="mb-5" width="80%" />
            <div className="flex gap-2">
              <Button icon="pi pi-sign-in" label="Ir a Login" text onClick={() => router.push(`/auth/login?next=${encodeURIComponent(next)}`)} />
              <Button icon="pi pi-home" label="Volver al Inicio" text onClick={() => router.push(next)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;
