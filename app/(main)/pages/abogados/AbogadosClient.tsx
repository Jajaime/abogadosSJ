'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { InputSwitch } from 'primereact/inputswitch';
import { InputText } from 'primereact/inputtext';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { apiFetch } from '@/utils/apiClient';

type Abogado = {
  id: string;
  nombreCompleto: string;
  run: string;
  domicilioProfesional: string;
  correoElectronico: string | null;
  telefono: string | null;
  activo: boolean;
};

type FormState = {
  nombreCompleto: string;
  run: string;
  domicilioProfesional: string;
  correoElectronico: string;
  telefono: string;
  activo: boolean;
};

const formVacio: FormState = {
  nombreCompleto: '',
  run: '',
  domicilioProfesional: '',
  correoElectronico: '',
  telefono: '',
  activo: true,
};

async function obtenerError(response: Response): Promise<string> {
  const body: unknown = await response.json().catch(() => null);
  if (body && typeof body === 'object') {
    const data = body as {
      error?: unknown;
      issues?: { message?: string }[];
    };
    if (Array.isArray(data.issues) && data.issues.length) {
      const mensajes = data.issues.map((issue) => issue.message).filter(Boolean);
      if (mensajes.length) return mensajes.join('; ');
    }
    if (typeof data.error === 'string') return data.error;
  }
  return `No se pudo completar la operación (HTTP ${response.status}).`;
}

export default function AbogadosClient() {
  const toast = useRef<Toast>(null);
  const [abogados, setAbogados] = useState<Abogado[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(formVacio);
  const [accionPendiente, setAccionPendiente] = useState<Abogado | null>(null);

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      const response = await apiFetch('/api/abogados', { cache: 'no-store' });
      if (!response.ok) throw new Error(await obtenerError(response));
      const lista: Abogado[] = await response.json();
      setAbogados(lista);
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'No se pudo cargar el catálogo',
        detail: error instanceof Error ? error.message : 'Error inesperado',
        life: 5000,
      });
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const crear = () => {
    setEditandoId(null);
    setForm({ ...formVacio });
    setModalAbierto(true);
  };

  const editar = (abogado: Abogado) => {
    setEditandoId(abogado.id);
    setForm({
      nombreCompleto: abogado.nombreCompleto,
      run: abogado.run,
      domicilioProfesional: abogado.domicilioProfesional,
      correoElectronico: abogado.correoElectronico ?? '',
      telefono: abogado.telefono ?? '',
      activo: abogado.activo,
    });
    setModalAbierto(true);
  };

  const guardar = async () => {
    setGuardando(true);
    try {
      const response = await apiFetch(
        editandoId ? `/api/abogados/${editandoId}` : '/api/abogados',
        {
          method: editandoId ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombreCompleto: form.nombreCompleto,
            run: form.run,
            domicilioProfesional: form.domicilioProfesional,
            correoElectronico: form.correoElectronico || null,
            telefono: form.telefono || null,
            activo: form.activo,
          }),
        },
      );
      if (!response.ok) throw new Error(await obtenerError(response));
      setModalAbierto(false);
      toast.current?.show({
        severity: 'success',
        summary: editandoId ? 'Abogado actualizado' : 'Abogado registrado',
        life: 2500,
      });
      await cargar();
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'No se pudo guardar',
        detail: error instanceof Error ? error.message : 'Error inesperado',
        life: 5000,
      });
    } finally {
      setGuardando(false);
    }
  };

  const cambiarEstado = async () => {
    if (!accionPendiente) return;
    setGuardando(true);
    try {
      const response = await apiFetch(`/api/abogados/${accionPendiente.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !accionPendiente.activo }),
      });
      if (!response.ok) throw new Error(await obtenerError(response));
      toast.current?.show({ severity: 'success', summary: 'Estado actualizado', life: 2500 });
      setAccionPendiente(null);
      await cargar();
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'No se pudo cambiar el estado',
        detail: error instanceof Error ? error.message : 'Error inesperado',
        life: 5000,
      });
    } finally {
      setGuardando(false);
    }
  };

  const actualizar = (clave: keyof FormState, valor: string | boolean) => {
    setForm((anterior) => ({ ...anterior, [clave]: valor }));
  };

  return (
    <div className="grid">
      <div className="col-12">
        <div className="card">
          <Toast ref={toast} />
          <div className="flex flex-column md:flex-row justify-content-between md:align-items-center gap-3 mb-4">
            <div>
              <h4 className="m-0">Abogados patrocinantes</h4>
              <p className="text-color-secondary mt-2 mb-0">
                Catálogo de profesionales para asignar a las demandas.
              </p>
            </div>
            <Button label="Nuevo abogado" icon="pi pi-plus" onClick={crear} />
          </div>
          <div className="mb-3">
            <span className="p-input-icon-left w-full md:w-20rem">
              <i className="pi pi-search" />
              <InputText
                className="w-full"
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
                placeholder="Buscar por nombre, RUN o correo"
                aria-label="Buscar abogados"
              />
            </span>
          </div>
          <DataTable
            value={abogados}
            dataKey="id"
            loading={cargando}
            globalFilter={busqueda}
            globalFilterFields={['nombreCompleto', 'run', 'correoElectronico']}
            paginator
            rows={10}
            responsiveLayout="scroll"
            emptyMessage="No hay abogados registrados."
          >
            <Column field="nombreCompleto" header="Nombre" sortable />
            <Column field="run" header="RUN" sortable />
            <Column field="correoElectronico" header="Correo electrónico" />
            <Column
              header="Estado"
              body={(abogado: Abogado) => (
                <Tag value={abogado.activo ? 'Activo' : 'Inactivo'} severity={abogado.activo ? 'success' : 'warning'} />
              )}
            />
            <Column
              header="Acciones"
              body={(abogado: Abogado) => (
                <div className="flex gap-2">
                  <Button icon="pi pi-pencil" rounded text onClick={() => editar(abogado)} aria-label={`Editar ${abogado.nombreCompleto}`} />
                  <Button
                    icon={abogado.activo ? 'pi pi-ban' : 'pi pi-check-circle'}
                    rounded
                    text
                    severity={abogado.activo ? 'warning' : 'success'}
                    onClick={() => setAccionPendiente(abogado)}
                    aria-label={`${abogado.activo ? 'Desactivar' : 'Activar'} ${abogado.nombreCompleto}`}
                  />
                </div>
              )}
            />
          </DataTable>
        </div>
      </div>

      <Dialog
        header={editandoId ? 'Editar abogado' : 'Nuevo abogado'}
        visible={modalAbierto}
        onHide={() => { if (!guardando) setModalAbierto(false); }}
        modal
        style={{ width: 'min(95vw, 42rem)' }}
        footer={(
          <div className="flex justify-content-end gap-2">
            <Button label="Cancelar" text disabled={guardando} onClick={() => setModalAbierto(false)} />
            <Button label="Guardar" icon="pi pi-check" loading={guardando} onClick={() => void guardar()} />
          </div>
        )}
      >
        <div className="p-fluid formgrid grid mt-2">
          <div className="field col-12">
            <label htmlFor="abogado-nombre">Nombre completo *</label>
            <InputText id="abogado-nombre" value={form.nombreCompleto} maxLength={160} onChange={(event) => actualizar('nombreCompleto', event.target.value)} />
          </div>
          <div className="field col-12 md:col-6">
            <label htmlFor="abogado-run">RUN *</label>
            <InputText id="abogado-run" value={form.run} placeholder="12.345.678-5" onChange={(event) => actualizar('run', event.target.value)} />
          </div>
          <div className="field col-12 md:col-6">
            <label htmlFor="abogado-telefono">Teléfono</label>
            <InputText id="abogado-telefono" value={form.telefono} maxLength={40} onChange={(event) => actualizar('telefono', event.target.value)} />
          </div>
          <div className="field col-12">
            <label htmlFor="abogado-domicilio">Domicilio profesional *</label>
            <InputText id="abogado-domicilio" value={form.domicilioProfesional} maxLength={240} onChange={(event) => actualizar('domicilioProfesional', event.target.value)} />
          </div>
          <div className="field col-12">
            <label htmlFor="abogado-correo">Correo electrónico</label>
            <InputText id="abogado-correo" type="email" value={form.correoElectronico} maxLength={254} onChange={(event) => actualizar('correoElectronico', event.target.value)} />
          </div>
          <div className="field col-12 flex align-items-center gap-3">
            <InputSwitch inputId="abogado-activo" checked={form.activo} onChange={(event) => actualizar('activo', Boolean(event.value))} />
            <label htmlFor="abogado-activo" className="mb-0">Abogado activo</label>
          </div>
        </div>
        <small className="text-color-secondary">* Campos obligatorios. El RUN será validado por la API.</small>
      </Dialog>

      <Dialog
        header="Confirmar cambio de estado"
        visible={Boolean(accionPendiente)}
        onHide={() => { if (!guardando) setAccionPendiente(null); }}
        modal
        style={{ width: 'min(95vw, 30rem)' }}
        footer={(
          <div className="flex justify-content-end gap-2">
            <Button label="Cancelar" text disabled={guardando} onClick={() => setAccionPendiente(null)} />
            <Button label="Confirmar" loading={guardando} onClick={() => void cambiarEstado()} />
          </div>
        )}
      >
        {accionPendiente && (
          <p>
            ¿Deseas {accionPendiente.activo ? 'desactivar' : 'activar'} a <strong>{accionPendiente.nombreCompleto}</strong>?
            Las demandas existentes conservarán su referencia al profesional.
          </p>
        )}
      </Dialog>
    </div>
  );
}
