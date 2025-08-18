'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';

type Usuario = {
  id?: string;
  email: string;
  name?: string | null;
};

const UsuarioForm: React.FC = () => {
  const router = useRouter();
  const params = useParams();              // /usuario/[id]/edit
  const searchParams = useSearchParams();  // (por si luego usas ?id=...)
  const toast = useRef<Toast>(null);

  const paramIdFromRoute = (params as any)?.id as string | undefined;
  const paramIdFromQuery = searchParams?.get('id') ?? undefined;
  const userId = useMemo(() => paramIdFromRoute ?? paramIdFromQuery ?? undefined, [paramIdFromRoute, paramIdFromQuery]);

  const isEdit = Boolean(userId);

  const [formData, setFormData] = useState<Usuario>({ email: '', name: '' });
  const [loading, setLoading] = useState<boolean>(isEdit);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Cargar datos al editar
  useEffect(() => {
    const fetchUsuario = async () => {
      if (!isEdit || !userId) return;
      try {
        setLoading(true);
        setError('');
        const res = await fetch(`/api/usuario/${userId}`, { cache: 'no-store' });
        if (!res.ok) throw new Error(`No se pudo cargar el usuario (HTTP ${res.status})`);
        const data: Usuario = await res.json();
        setFormData({ email: data.email ?? '', name: data.name ?? '' });
      } catch (e: any) {
        setError(e.message || 'Error al cargar el usuario');
      } finally {
        setLoading(false);
      }
    };
    fetchUsuario();
  }, [isEdit, userId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const endpoint = isEdit ? `/api/usuario/${userId}` : '/api/usuario';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const t = await res.text().catch(() => '');
        throw new Error(t || `Error al ${isEdit ? 'actualizar' : 'registrar'} usuario`);
      }

      toast.current?.show({
        severity: 'success',
        summary: 'Éxito',
        detail: isEdit ? 'Usuario actualizado' : 'Usuario creado',
        life: 2000,
      });

      setTimeout(() => router.push('/pages/usuario'), 600);
    } catch (e: any) {
      setError(e.message || 'Ocurrió un error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card p-fluid">
      <Toast ref={toast} />
      <h5>{isEdit ? 'EDITAR USUARIO' : 'NUEVO USUARIO'}</h5>

      {loading ? (
        <div className="flex align-items-center justify-content-center" style={{ minHeight: 160 }}>
          <ProgressSpinner />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-fluid formgrid grid">
          {error && (
            <div className="col-12">
              <Message severity="error" text={error} />
            </div>
          )}

          <div className="field col-12">
            <label htmlFor="name">Nombre</label>
            <InputText
              id="name"
              name="name"
              value={formData.name ?? ''}
              onChange={handleChange}
              placeholder="Ingrese el nombre del usuario"
              disabled={submitting}
            />
          </div>

          <div className="field col-12">
            <label htmlFor="email">Correo Electrónico</label>
            <InputText
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Ingrese correo electrónico"
              required
              disabled={submitting}
            />
          </div>

          <div className="field col-12 text-center">
            <div className="flex gap-2 justify-content-center">
              <Button
                type="button"
                label="Cancelar"
                className="p-button-secondary"
                onClick={() => router.push('/pages/usuario')}
                disabled={submitting}
              />
              <Button
                type="submit"
                label={isEdit ? 'Actualizar' : 'Registrar'}
                className="p-button-success"
                loading={submitting}
              />
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default UsuarioForm;
