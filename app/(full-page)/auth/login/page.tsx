'use client';
import { useRouter } from 'next/navigation';
import React, { useRef, useContext, useState } from 'react';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import { Password } from 'primereact/password';
import { LayoutContext } from '../../../../layout/context/layoutcontext';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import { Messages } from 'primereact/messages';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [checked, setChecked] = useState(false);
    const { layoutConfig } = useContext(LayoutContext);
    const message = useRef<Messages>(null);

    const router = useRouter();
    const containerClassName = classNames('surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden', { 'p-input-filled': layoutConfig.inputStyle === 'filled' });

    const addErrorMessage = () => {
        message.current?.show({ severity: 'error', content: 'Hubo un problema al iniciar sesión. Por favor, inténtalo de nuevo.' });
    };

    const addErrorMessage2 = () => {
        message.current?.show({ severity: 'error', content: 'No se pudo conectar al servidor. Por favor, inténtalo más tarde.' });
    };

    const addErrorMessage3 = () => {
        message.current?.show({ severity: 'error', content: 'Credenciales incorrectas.' });
    };

    const handleLogin = async () => {
        console.log('Login attempt with:', email, password);
    
        if (email === 'demo@example.com' && password === '12345') {
            console.log('Login successful');
            const token = 'fake-jwt-token';
    
            try {
                // Enviar solicitud al backend para configurar el token como cookie
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ token })
                });
    
                if (response.ok) {
                    console.log('Token saved as HttpOnly cookie:', token);
                    router.push('/'); // Redirigir al dashboard
                } else {
                    console.error('Error al establecer el token en la cookie.');
                    addErrorMessage();
                }
            } catch (error) {
                console.error('Error al comunicarse con el servidor:', error);
                addErrorMessage2();
                alert('No se pudo conectar al servidor. Por favor, inténtalo más tarde.');
            }
        } else {
            console.error('Login failed. Incorrect credentials.');
            addErrorMessage3();
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
                            {/* <img src="/demo/images/login/avatar.png" alt="Image" height="50" className="mb-3" /> */}
                            <div className="text-900 text-3xl font-medium mb-3">Bienvenidos a Ss&Cía</div>
                            <span className="text-600 font-medium">Inicia sesión para continuar</span>
                        </div>

                        <div>
                            <label htmlFor="email1" className="block text-900 text-xl font-medium mb-2">
                                Correo Electrónico
                            </label>
                            <InputText
                                id="email1"
                                type="text"
                                placeholder="Dirección Correo Electrónico"
                                className="w-full md:w-30rem mb-5"
                                style={{ padding: '1rem' }}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />

                            <label htmlFor="password1" className="block text-900 font-medium text-xl mb-2">
                                Contraseña
                            </label>
                            <Password
                                inputId="password1"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Contraseña"
                                toggleMask
                                className="w-full mb-5"
                                inputClassName="w-full p-3 md:w-30rem"
                            />
                            <Messages ref={message} />
                            <div className="flex align-items-center justify-content-between mb-5 gap-5">
                                <div className="flex align-items-center">
                                    <Checkbox inputId="rememberme1" checked={checked} onChange={(e) => setChecked(e.checked ?? false)} className="mr-2"></Checkbox>
                                    <label htmlFor="rememberme1">Recordarme</label>
                                </div>
                            </div>
                            <Button label="Ingresar" className="w-full p-3 text-xl" onClick={handleLogin}></Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
