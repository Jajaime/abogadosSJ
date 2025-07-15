/* eslint-disable @next/next/no-img-element */
'use client';
import { useRouter } from 'next/navigation';
import { locale, addLocale } from 'primereact/api';
import { Button } from 'primereact/button';
import { Chart } from 'primereact/chart';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Menu } from 'primereact/menu';
import React, { useContext, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Demo } from '@/types';
import { ChartData, ChartOptions } from 'chart.js';
import { InputText } from 'primereact/inputtext';

const UsuarioPage = () => {

    const router = useRouter();

    const [products, setProducts] = useState<Demo.Product[]>([]);
    const menu1 = useRef<Menu>(null);
    const menu2 = useRef<Menu>(null);
    const [lineOptions, setLineOptions] = useState<ChartOptions>({});
    const [formData, setFormData] = useState({ email: "", name: "" });
    const [usuarios, setUsuarios] = useState([]);

    const handleChange = (e: any) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const response = await fetch("/api/usuario", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
        });

        if (response.ok) {
            alert("Usuario registrado exitosamente");
            setFormData({ email: "", name: "" });
            router.push('/pages/usuario/list'); // Navega a la ruta específica
        } else {
            alert("Error al registrar usuario");
        }
    };

    const fetchUsuarios = async () => {
        const response = await fetch("/api/usuario");
        const data = await response.json();
        setUsuarios(data);
    };

    const formatCurrency = (value: number) => {
        return value?.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD'
        });
    };

    return (
        <div className="grid">
            <div className="col-12 md:col-6">
                <div className="card p-fluid">
                    <h5>DATOS NUEVO USUARIO</h5>
                    <form onSubmit={handleSubmit} className="p-fluid formgrid grid">
                        <div className="field">
                            <label htmlFor="name">Nombre Usuario</label>
                            <InputText
                                id="name"
                                name="name"
                                type="text"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Ingrese el nombre del usuario"
                                required
                            />
                        </div>
                        <div className="field">
                            <label htmlFor="email">Correo Electrónico</label>
                            <InputText
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Ingrese correo electrónico"
                                required
                            />
                        </div>
                        <div className="field" style={{
                            textAlign: 'center'
                        }}>
                            <label htmlFor="email" style={{
                            color: 'white',
                        }}>X</label>
                            <Button type="submit" label="Registrar Usuario" className="p-button-success" />
                        </div>
                    </form>

                </div>
            </div>
        </div>
    );
};

export default UsuarioPage;
