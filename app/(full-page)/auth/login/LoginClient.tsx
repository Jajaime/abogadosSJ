'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import type { FormEvent } from 'react';
import React, { useContext, useMemo, useRef, useState } from 'react';
import { apiFetch } from '@/utils/apiClient';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { Password } from 'primereact/password';
import { LayoutContext } from '../../../../layout/context/layoutcontext';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import { Messages } from 'primereact/messages';
import { loginCodeToMessage } from '@/lib/auth-messages';
import NextImage from 'next/image';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { layoutConfig } = useContext(LayoutContext);
  const message = useRef<Messages>(null);
  const [checked, setChecked] = useState(false);

  const router = useRouter();
  const sp = useSearchParams();

  // next destino (por defecto home) y code opcional para explicar por qué cayó aquí
  const next = sp.get('next') || '/';
  const code = sp.get('code') || '';
  const welcomeMsg = useMemo(() => (code ? loginCodeToMessage[code] ?? '' : ''), [code]);

  const containerClassName = classNames(
    'surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden',
    { 'p-input-filled': layoutConfig.inputStyle === 'filled' }
  );

  const showErrorMessage = (detail: string) => {
    message.current?.show({ severity: 'error', content: detail });
  };
  const showInfoMessage = (detail: string) => {
    if (!detail) return;
    message.current?.show({ severity: 'info', content: detail });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!email || !password) {
      showErrorMessage('Correo y contraseña son obligatorios.');
      return;
    }

    try {
      setSubmitting(true);
      const response = await apiFetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // si usas CSRF, añade encabezado con el valor de la cookie:
        // headers: { 'Content-Type': 'application/json', 'x-csrf-token': getCookie('csrf') ?? '' },
        body: JSON.stringify({ email, password, remember: checked }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const detail = data?.detail || data?.error || 'Credenciales inválidas.';
        showErrorMessage(detail);
        return;
      }

      // éxito: ir a next
      router.push(next);
    } catch (err) {
      console.error('[LOGIN]', err);
      showErrorMessage('No se pudo conectar al servidor. Por favor, inténtalo más tarde.');
    } finally {
      setSubmitting(false);
    }
  };

  // Muestra el motivo si vino con ?code=...
  React.useEffect(() => {
    if (welcomeMsg) showInfoMessage(welcomeMsg);

  }, [welcomeMsg]);

  return (
    <div className={containerClassName}>
      {/* FONDO */}
      <div className="bg">
        <div className="blob b1" />
        <div className="blob b2" />
        <div className="grain" />
      </div>

      {/* CONTENIDO */}
      <div className="flex flex-column align-items-center justify-content-center relative z-1">
        <div className="glass p-0_3">
          <div className="card">
            {/* Logo */}
            <div className="mb-3 flex justify-content-center">
              <span
                className="border-round-2xl p-3 flex align-items-center justify-content-center"
                style={{ background: 'rgba(66,133,244,.12)', boxShadow: '0 0 0 1px rgba(255,255,255,.08) inset' }}
              >
                <NextImage
                  src="/layout/images/abogados/logo_200x200.png"
                  alt="Ss&Cía"
                  width={56}
                  height={56}
                  priority
                  className="rounded-full"
                />
              </span>
            </div>

            <div className="text-center mb-5">
              <div className="text-0 text-3xl font-medium mb-3">Bienvenidos a Ss&Cía</div>
              <span className="text-0 font-medium">Inicia sesión para continuar</span>
            </div>

            {/* --- TU FORMULARIO TAL CUAL --- */}
            <form onSubmit={handleSubmit} className="flex flex-column gap-4" noValidate>
              <div className="flex flex-column gap-2">
                <label htmlFor="email1" className="text-0 text-xl font-medium">Correo Electrónico</label>
                <InputText id="email1" type="email" placeholder="Dirección Correo Electrónico" className="w-full md:w-30rem"
                  style={{ padding: '1rem' }} value={email} autoComplete="username"
                  onChange={(e) => setEmail(e.target.value)} required />
              </div>

              <div className="flex flex-column gap-2">
                <label htmlFor="password1" className="text-0 font-medium text-xl">Contraseña</label>
                <Password inputId="password1" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Contraseña" toggleMask className="w-full" inputClassName="w-full p-3 md:w-30rem"
                  autoComplete="current-password" feedback={false} required />
              </div>

              <Messages ref={message} />

              <div className="flex align-items-center justify-content-between">
                <div className="flex align-items-center">
                  <Checkbox inputId="rememberme1" checked={checked} onChange={(e) => setChecked(e.checked ?? false)} className="mr-2" aria-checked={checked} />
                  <label htmlFor="rememberme1" className="text-0">Recordarme</label>
                </div>
              </div>

              <Button type="submit" label="Ingresar" className="w-full p-3 text-xl" loading={submitting} disabled={submitting} />
            </form>
          </div>
        </div>
      </div>

      <style jsx>{`
      .bg{
        position:fixed; inset:0;
        background:
          radial-gradient(1200px 600px at 80% 10%, rgba(66,133,244, .20), transparent 60%),
          radial-gradient(900px 600px at 10% 90%, rgba(79,195,247, .18), transparent 60%),
          linear-gradient(180deg, #0b1220 0%, #0e1a36 100%);
        overflow:hidden;
      }
      .blob{position:absolute; filter:blur(50px); opacity:.55; border-radius:9999px; mix-blend-mode:screen; animation:float 12s ease-in-out infinite}
      .b1{width:38rem;height:38rem;left:-10rem;top:-8rem;background:radial-gradient(circle at 30% 30%, #4285f4, rgba(66,133,244,0.2));animation-delay:-2s}
      .b2{width:34rem;height:34rem;right:-12rem;bottom:-10rem;background:radial-gradient(circle at 70% 70%, #00c2ff, rgba(0,194,255,0.15));animation-delay:2s}
      @keyframes float{0%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(0,-12px,0) scale(1.03)}100%{transform:translate3d(0,0,0) scale(1)}}
      .grain{position:absolute; inset:0; opacity:.35; mix-blend-mode:soft-light; pointer-events:none;
        background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/><feComponentTransfer><feFuncA type='table' tableValues='0 0 0 0.08 0.12 0.08 0'/></feComponentTransfer></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
      }
      .glass{position:relative; border-radius:56px; padding:.3rem;
        background:linear-gradient(180deg, rgba(66,133,244,.9) 0%, rgba(66,133,244,.35) 60%, rgba(66,133,244,0) 100%);
        box-shadow:0 10px 30px rgba(8,12,40,.45), 0 0 0 1px rgba(255,255,255,.08) inset;
      }
      .card{border-radius:53px; backdrop-filter:blur(10px); background:rgba(16,24,48,.55);
        padding:2rem; box-shadow:0 6px 18px rgba(0,0,0,.25) inset, 0 2px 0 rgba(255,255,255,.06);
      }
      :global(.text-0){color:#eaf2ff}
      @media (min-width:640px){ .card{padding:2.5rem 3rem} }
    `}</style>
    </div>
  );


};

export default LoginPage;
