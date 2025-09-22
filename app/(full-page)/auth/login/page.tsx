'use client';
import { useRouter } from 'next/navigation';
import React, { FormEvent, useContext, useRef, useState } from 'react';
import { apiFetch } from '@/utils/apiClient';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { Password } from 'primereact/password';
import { LayoutContext } from '../../../../layout/context/layoutcontext';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import { Messages } from 'primereact/messages';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const { layoutConfig } = useContext(LayoutContext);
    const message = useRef<Messages>(null);
    const [checked, setChecked] = useState(false);

    const router = useRouter();
    const containerClassName = classNames(
        'surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden',
        { 'p-input-filled': layoutConfig.inputStyle === 'filled' }
    );

    const showErrorMessage = (detail: string) => {
        message.current?.show({ severity: 'error', content: detail });
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
                body: JSON.stringify({ email, password })
            });

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                const detail = data?.detail || data?.error || 'Credenciales inválidas.';
                showErrorMessage(detail);
                return;
            }

            router.push('/');
        } catch (error) {
            console.error('[LOGIN]', error);
            showErrorMessage('No se pudo conectar al servidor. Por favor, inténtalo más tarde.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={containerClassName}>
            <div className="flex flex-column align-items-center justify-content-center">
                <div
                    style={{
                        borderRadius: '56px',
                        padding: '0.3rem',
                        background: 'linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)'
                    }}
                >
                    <div className="w-full surface-card py-8 px-5 sm:px-8" style={{ borderRadius: '53px' }}>
                        <div className="text-center mb-5">
                            <div className="text-900 text-3xl font-medium mb-3">Bienvenidos a Ss&Cía</div>
                            <span className="text-600 font-medium">Inicia sesión para continuar</span>
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-column gap-4" noValidate>
                            <div className="flex flex-column gap-2">
                                <label htmlFor="email1" className="text-900 text-xl font-medium">
                                    Correo Electrónico
                                </label>
                                <InputText
                                    id="email1"
                                    type="email"
                                    placeholder="Dirección Correo Electrónico"
                                    className="w-full md:w-30rem"
                                    style={{ padding: '1rem' }}
                                    value={email}
                                    autoComplete="username"
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="flex flex-column gap-2">
                                <label htmlFor="password1" className="text-900 font-medium text-xl">
                                    Contraseña
                                </label>
                                <Password
                                    inputId="password1"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Contraseña"
                                    toggleMask
                                    className="w-full"
                                    inputClassName="w-full p-3 md:w-30rem"
                                    autoComplete="current-password"
                                    feedback={false}
                                    required
                                />
                            </div>
                            <Messages ref={message} />
                              <div className="flex align-items-center justify-content-between">
                                <div className="flex align-items-center">
                                    <Checkbox inputId="rememberme1" checked={checked} onChange={(e) => setChecked(e.checked ?? false)} className="mr-2" aria-checked={checked} />
                                    <label htmlFor="rememberme1">Recordarme</label>
                                </div>
                            </div>
                            <Button type="submit" label="Ingresar" className="w-full p-3 text-xl" loading={submitting} disabled={submitting} />
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
