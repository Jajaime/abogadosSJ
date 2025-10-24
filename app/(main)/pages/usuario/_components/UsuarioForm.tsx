'use client';

import { apiFetch } from '@/utils/apiClient';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { MultiSelect, MultiSelectChangeEvent } from 'primereact/multiselect';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';

type Usuario = {
  id?: string;
  email: string;
  name?: string | null;
  roles: string[];        // Prisma: String[]
  // No guardamos passwordHash aquí; el backend lo genera.
};

type UsuarioPayload = {
  email: string;
  name?: string | null;
  roles: string[];
  password?: string;      // Se envía en claro para que el API lo hashee
};

const ROLE_OPTIONS = [
  { label: 'admin', value: 'admin' },
  { label: 'user', value: 'user' },
];

const UsuarioForm: React.FC = () => {
  const router = useRouter();
  const params = useParams(); // /usuario/[id]/edit
  const searchParams = useSearchParams(); // por si usas ?id=...
  const toast = useRef<Toast>(null);

  const paramIdFromRoute = (params as any)?.id as string | undefined;
  const paramIdFromQuery = searchParams?.get('id') ?? undefined;
  const userId = useMemo(
    () => paramIdFromRoute ?? paramIdFromQuery ?? undefined,
    [paramIdFromRoute, paramIdFromQuery]
  );

  const isEdit = Boolean(userId);

  const [formData, setFormData] = useState<Usuario>({
    email: '',
    name: '',
    roles: ['user'], // valor por defecto según tu modelo
  });
  const [password, setPassword] = useState<string>(''); // solo para crear/actualizar
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
        const res = await apiFetch(`/api/usuario/${userId}`, { cache: 'no-store' });
        if (!res.ok) throw new Error(`No se pudo cargar el usuario (HTTP ${res.status})`);
        const data = (await res.json()) as Partial<Usuario>;
        setFormData({
          email: data.email ?? '',
          name: data.name ?? '',
          roles: Array.isArray(data.roles) && data.roles.length ? data.roles : ['user'],
        });
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

  const handleRolesChange = (e: MultiSelectChangeEvent) => {
    const nextRoles = (e.value as string[]) ?? [];
    // Asegura que al menos tenga 'user' si se dejan vacíos (puedes quitar esta línea si quieres permitir vacío)
    setFormData(prev => ({ ...prev, roles: nextRoles.length ? nextRoles : ['user'] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const endpoint = isEdit ? `/api/usuario/${userId}` : '/api/usuario';
      const method = isEdit ? 'PUT' : 'POST';

      // Construimos payload para que el backend genere passwordHash
      const payload: UsuarioPayload = {
        email: formData.email.trim(),
        name: formData.name?.trim() || undefined,
        roles: formData.roles?.length ? formData.roles : ['user'],
        ...(password ? { password } : {}), // si está vacío (editar), no se envía
      };

      const res = await apiFetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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

          <div className="field col-12 md:col-6">
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

          <div className="field col-12 md:col-6">
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

          <div className="field col-12 md:col-6">
            <label htmlFor="roles">Roles</label>
            <MultiSelect
              id="roles"
              display="chip"
              value={formData.roles}
              options={ROLE_OPTIONS}
              onChange={handleRolesChange}
              placeholder="Selecciona roles"
              filter
              disabled={submitting}
            />
            <small className="text-color-secondary">Si no seleccionas, se usará <b>user</b> por defecto.</small>
          </div>

          <div className="field col-12 md:col-6">
            <label htmlFor="password">{isEdit ? 'Cambiar contraseña (opcional)' : 'Contraseña'}</label>
            <Password
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              toggleMask
              feedback
              placeholder={isEdit ? 'Deja vacío para no modificar' : 'Ingresa una contraseña segura'}
              disabled={submitting}
              inputStyle={{ width: '100%' }}
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
