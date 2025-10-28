 
'use client';

import { apiFetch } from '@/utils/apiClient';
import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';

export interface UsuarioDTO {
    id: string;
    email: string;
    name?: string;
    createdAt: string; // ISO string
}
export interface CreateUsuarioDTO {
    email: string;
    name?: string;
}
export interface UpdateUsuarioDTO {
    email?: string;
    name?: string | null;
}

export default function UsuariosPage() {
    const router = useRouter();

    // ---- Tabla & filtros
    const [usuarios, setUsuarios] = useState<UsuarioDTO[]>([]);
    const [selectedUsuarios, setSelectedUsuarios] = useState<UsuarioDTO[] | null>(null);
    const [globalFilter, setGlobalFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const dt = useRef<DataTable<any>>(null);

    // ---- Toast & diálogos
    const toast = useRef<Toast>(null);
    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [deleteManyDialogVisible, setDeleteManyDialogVisible] = useState(false);
    const [usuarioToDelete, setUsuarioToDelete] = useState<UsuarioDTO | null>(null);

    // ---- Generación / descarga de documentos
    const [generatingDoc, setGeneratingDoc] = useState<string | null>(null);

    // ====== Data fetch ======
    const fetchUsuarios = async () => {
        try {
            setLoading(true);
            const res = await apiFetch('/api/usuario', { cache: 'no-store' });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data: UsuarioDTO[] = await res.json();
            setUsuarios(data ?? []);
        } catch (e: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: e?.message || 'No se pudo cargar la lista',
                life: 5000
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsuarios();
    }, []);

    // ====== Helpers ======
    const formatFecha = (row: UsuarioDTO) => {
        const fecha = new Date(row.createdAt);
        return fecha.toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    };

    // ====== Navegación ======
    const goNew = () => router.push('/pages/usuario/new');
    const goEdit = (u: UsuarioDTO) => router.push(`/pages/usuario/${u.id}/edit`);

    // ====== Documentos ======

    // ====== Eliminar (uno) ======
    const confirmDeleteOne = (u: UsuarioDTO) => {
        setUsuarioToDelete(u);
        setDeleteDialogVisible(true);
    };

    const deleteOne = async () => {
        if (!usuarioToDelete) return;
        try {
            const res = await apiFetch(`/api/usuario/${usuarioToDelete.id}`, { method: 'DELETE' });
            if (!res.ok) {
                const t = await res.text().catch(() => '');
                throw new Error(t || `Error eliminando usuario`);
            }
            toast.current?.show({ severity: 'success', summary: 'Eliminado', detail: 'Usuario eliminado', life: 2500 });
            await fetchUsuarios();
        } catch (e: any) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: e?.message || 'No se pudo eliminar', life: 5000 });
        } finally {
            setDeleteDialogVisible(false);
            setUsuarioToDelete(null);
        }
    };

    // ====== Eliminar (varios) ======
    const confirmDeleteSelected = () => {
        if (!selectedUsuarios || selectedUsuarios.length === 0) return;
        setDeleteManyDialogVisible(true);
    };

    const deleteSelected = async () => {
        if (!selectedUsuarios || selectedUsuarios.length === 0) return;
        try {
            // Si no tienes endpoint batch, elimina uno por uno
            for (const u of selectedUsuarios) {
                 
                const res = await apiFetch(`/api/usuario/${u.id}`, { method: 'DELETE' });
                if (!res.ok) throw new Error(`No se pudo eliminar id=${u.id}`);
            }
            toast.current?.show({ severity: 'success', summary: 'Eliminados', detail: 'Usuarios eliminados', life: 2500 });
            setSelectedUsuarios(null);
            await fetchUsuarios();
        } catch (e: any) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: e?.message || 'No se completó la eliminación', life: 5000 });
        } finally {
            setDeleteManyDialogVisible(false);
        }
    };

    // ====== Templates ======
    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0">Usuarios</h5>
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
                <InputText type="search" onInput={(e) => setGlobalFilter(e.currentTarget.value)} placeholder="Buscar..." />
            </span>
        </div>
    );

    const leftToolbarTemplate = () => (
        <div className="my-2 flex gap-2">
            <Button label="Nuevo Usuario" icon="pi pi-plus" severity="success" onClick={goNew} />
            <Button label="Eliminar Usuario(s)" icon="pi pi-trash" severity="danger" onClick={confirmDeleteSelected} disabled={!selectedUsuarios || selectedUsuarios.length === 0} />
        </div>
    );

    const rightToolbarTemplate = () => <></>;

    const actionsTemplate = (row: UsuarioDTO) => (
        <div className="flex gap-2">
            <Button icon="pi pi-pencil" rounded severity="success" onClick={() => goEdit(row)} tooltip="Editar" />
            <Button icon="pi pi-trash" rounded severity="danger" onClick={() => confirmDeleteOne(row)} tooltip="Eliminar" />
        </div>
    );

    // ====== Footers diálogos ======
    const deleteOneFooter = (
        <>
            <Button label="No" icon="pi pi-times" text onClick={() => setDeleteDialogVisible(false)} />
            <Button label="Sí, eliminar" icon="pi pi-check" text onClick={deleteOne} />
        </>
    );

    const deleteManyFooter = (
        <>
            <Button label="No" icon="pi pi-times" text onClick={() => setDeleteManyDialogVisible(false)} />
            <Button label="Sí, eliminar" icon="pi pi-check" text onClick={deleteSelected} />
        </>
    );

    return (
        <div className="grid crud-demo">
            <div className="col-12">
                <div className="card">
                    <Toast ref={toast} />

                    <Toolbar className="mb-4" left={leftToolbarTemplate} right={rightToolbarTemplate} />

                    <DataTable
                        ref={dt}
                        value={usuarios}
                        selection={selectedUsuarios as any}
                        onSelectionChange={(e) => setSelectedUsuarios(e.value as UsuarioDTO[])}
                        dataKey="id"
                        paginator
                        rows={10}
                        rowsPerPageOptions={[5, 10, 25]}
                        className="datatable-responsive"
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Mostrando {first} al {last} de {totalRecords} usuarios"
                        globalFilter={globalFilter}
                        emptyMessage="No se encontraron usuarios."
                        header={header}
                        responsiveLayout="scroll"
                        filterLocale="es"
                        loading={loading}
                    >
                        {/* Selección múltiple */}
                        <Column selectionMode="multiple" headerStyle={{ width: '3.5rem' }}></Column>

                        <Column field="name" header="Nombre" sortable headerStyle={{ minWidth: '14rem' }} />
                        <Column field="email" header="Correo" sortable headerStyle={{ minWidth: '16rem' }} />
                        <Column field="roles" header="Privilegios" sortable headerStyle={{ minWidth: '14rem' }} />

                        {/* Acciones CRUD */}
                        <Column header="Acciones" body={actionsTemplate} headerStyle={{ minWidth: '10rem' }} />
                    </DataTable>

                    {/* Diálogo eliminar uno */}
                    <Dialog visible={deleteDialogVisible} style={{ width: 450 }} header="Confirmar" modal footer={deleteOneFooter} onHide={() => setDeleteDialogVisible(false)}>
                        <div className="flex align-items-center justify-content-center">
                            <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                            {usuarioToDelete && (
                                <span>
                                    ¿Seguro que deseas eliminar a <b>{usuarioToDelete.name ?? usuarioToDelete.email}</b>?
                                </span>
                            )}
                        </div>
                    </Dialog>

                    {/* Diálogo eliminar varios */}
                    <Dialog visible={deleteManyDialogVisible} style={{ width: 450 }} header="Confirmar" modal footer={deleteManyFooter} onHide={() => setDeleteManyDialogVisible(false)}>
                        <div className="flex align-items-center justify-content-center">
                            <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                            <span>¿Seguro que deseas eliminar los usuarios seleccionados?</span>
                        </div>
                    </Dialog>
                </div>
            </div>
        </div>
    );
}
