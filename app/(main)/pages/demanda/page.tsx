/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/utils/apiClient';
import type { DemandaDTO } from '@/types/demanda';

import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable, type DataTableFilterMeta } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { FilterMatchMode } from 'primereact/api';
import { safeSerializeDemanda, safeSerializeDemandados } from '@/utils/serializeDemanda';

export default function DemandasPage() {
    const router = useRouter();

    // Tabla
    const [demandas, setDemandas] = useState<DemandaDTO[]>([]);
    const [selectedDemandas, setSelectedDemandas] = useState<DemandaDTO[] | null>(null);
    const [globalFilter, setGlobalFilter] = useState('');
    const deferredGlobalFilter = useDeferredValue(globalFilter);
    const [loading, setLoading] = useState(true);
    const dt = useRef<DataTable<any>>(null);
    const filters = useMemo<DataTableFilterMeta>(() => ({
        global: { value: deferredGlobalFilter, matchMode: FilterMatchMode.CONTAINS }
    }), [deferredGlobalFilter]);

    // Toast & diálogos
    const toast = useRef<Toast>(null);
    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [deleteManyDialogVisible, setDeleteManyDialogVisible] = useState(false);
    const [demandaToDelete, setDemandaToDelete] = useState<DemandaDTO | null>(null);

    // Generar/descargar documentos
    const [generatingDoc, setGeneratingDoc] = useState<number | null>(null);

    // ====== Fetch ======
    const fetchDemandas = useCallback(async () => {
        try {
            setLoading(true);
            const res = await apiFetch('/api/demandas', { cache: 'no-store' });
            if (res.status === 401) {
                setDemandas([]);
                router.push('/auth/login');
                return;
            }
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data: DemandaDTO[] = await res.json();
            setDemandas(data ?? []);
        } catch (e: any) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: e?.message || 'No se pudo cargar la lista', life: 5000 });
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        const raw = sessionStorage.getItem('flashToast');
        if (raw) {
            const data = JSON.parse(raw);
            toast.current?.show(data);
            sessionStorage.removeItem('flashToast');
        }
        fetchDemandas();
    }, [fetchDemandas]);

    // ====== Helpers ======
    const formatFecha = (row: DemandaDTO) => {
        if (!row.createdAt) return '-';
        const d = new Date(row.createdAt);
        return d.toLocaleString('es-ES', {
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
    const goNew = () => router.push('/pages/demanda/new');
    const goEdit = (d: DemandaDTO) => router.push(`/pages/demanda/${d.id}/edit`);

    // ====== Documentos ======
    const handleGenerarDocumento = useCallback(async (d: DemandaDTO) => {
        try {
            setGeneratingDoc(d.id);

            const demandaPayload = safeSerializeDemanda(d);
            const demandadosPayload = safeSerializeDemandados(d.demandadoSols ?? []);

            const response = await apiFetch('/api/generate_doc', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    // Mantén el ID (fuente de verdad del backend si luego quieres volver a cargar desde DB)
                    demandaId: d.id,
                    // Nombre archivo
                    nombreArchivo: `Documento_${d.run}_${new Date().toISOString().slice(0, 10)}.docx`,
                    // Pasa TODO tu DTO serializado:
                    demanda: demandaPayload,
                    demandadoSolidarios: demandadosPayload // <- arreglo
                })
            });

            if (response.status === 401) {
                router.push('/auth/login');
                return;
            }

            const result = await response.json();
            if (!response.ok || !result?.success) throw new Error(result?.error || 'Error al generar documento');

            toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Documento generado y guardado', life: 3000 });
        } catch (e: any) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: e?.message || 'Error al generar documento', life: 5000 });
        } finally {
            setGeneratingDoc(null);
        }
    }, [router]);

    const handleDescargarDocumento = useCallback(async (d: DemandaDTO) => {
        try {
            const response = await apiFetch(`/api/download_doc?demandaId=${d.id}`);
            if (response.status === 401) {
                router.push('/auth/login');
                return;
            }
            if (!response.ok) throw new Error('Error al descargar el documento');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.rel = 'noopener';
            link.setAttribute('aria-hidden', 'true');
            link.download = `documento_${d.run || d.id}.docx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.setTimeout(() => window.URL.revokeObjectURL(url), 0);
            toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Documento descargado', life: 3000 });
        } catch (e: any) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: e?.message || 'No se pudo descargar', life: 5000 });
        }
    }, [router]);

    const documentoBodyTemplate = useCallback((row: DemandaDTO) => (
        <Button label="Generar DOC" icon="pi pi-file-word" className="p-button-primary p-button-sm" loading={generatingDoc === row.id} onClick={() => handleGenerarDocumento(row)} />
    ), [generatingDoc, handleGenerarDocumento]);

    const descargarBodyTemplate = useCallback((row: DemandaDTO) => (
        <Button label="Descargar" icon="pi pi-download" className="p-button-help p-button-sm" onClick={() => handleDescargarDocumento(row)} />
    ), [handleDescargarDocumento]);


    // ====== Eliminar (uno) ======
    const confirmDeleteOne = (d: DemandaDTO) => {
        setDemandaToDelete(d);
        setDeleteDialogVisible(true);
    };

    const deleteOne = async () => {
        if (!demandaToDelete) return;
        try {
            const res = await apiFetch(`/api/demandas/${demandaToDelete.id}`, { method: 'DELETE' });
            if (!res.ok) {
                const t = await res.text().catch(() => '');
                throw new Error(t || `Error eliminando demanda`);
            }
            toast.current?.show({ severity: 'success', summary: 'Eliminada', detail: 'Demanda eliminada', life: 2500 });
            await fetchDemandas();
        } catch (e: any) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: e?.message || 'No se pudo eliminar', life: 5000 });
        } finally {
            setDeleteDialogVisible(false);
            setDemandaToDelete(null);
        }
    };

    // ====== Eliminar (varias) ======
    const confirmDeleteSelected = () => {
        if (!selectedDemandas || selectedDemandas.length === 0) return;
        setDeleteManyDialogVisible(true);
    };

    const deleteSelected = async () => {
        if (!selectedDemandas || selectedDemandas.length === 0) return;
        try {
            for (const d of selectedDemandas) {
                // eslint-disable-next-line no-await-in-loop
                const res = await apiFetch(`/api/demandas/${d.id}`, { method: 'DELETE' });
                if (!res.ok) throw new Error(`No se pudo eliminar id=${d.id}`);
            }
            toast.current?.show({ severity: 'success', summary: 'Eliminadas', detail: 'Demandas eliminadas', life: 2500 });
            setSelectedDemandas(null);
            await fetchDemandas();
        } catch (e: any) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: e?.message || 'No se completó la eliminación', life: 5000 });
        } finally {
            setDeleteManyDialogVisible(false);
        }
    };

    // ====== Templates UI ======
    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0">DEMANDAS</h5>
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
                <InputText type="search" value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} placeholder="Buscar..." aria-label="Buscar demanda" />
            </span>
        </div>
    );

    const leftToolbarTemplate = () => (
        <div className="my-2 flex gap-2">
            <Button label="Nueva Demanda" icon="pi pi-plus" severity="success" onClick={goNew} />

            <Button
                label="Editar Demanda"
                icon="pi pi-pencil"
                severity="warning"
                onClick={() => {
                    if (selectedDemandas && selectedDemandas.length === 1) {
                        const id = selectedDemandas[0].id;
                        router.push(`/pages/demanda/${id}/edit`); // 👈 con /edit al final
                    }
                }}
                disabled={!selectedDemandas || selectedDemandas.length !== 1} // solo cuando hay una selección
            />

            <Button label="Eliminar Demanda(s)" icon="pi pi-trash" severity="danger" onClick={confirmDeleteSelected} disabled={!selectedDemandas || selectedDemandas.length === 0} />
        </div>
    );

    const rightToolbarTemplate = () => <></>;

    const actionsTemplate = (row: DemandaDTO) => (
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
                        value={demandas}
                        selection={selectedDemandas as any}
                        onSelectionChange={(e) => setSelectedDemandas(e.value as DemandaDTO[])}
                        dataKey="id"
                        paginator
                        rows={10}
                        rowsPerPageOptions={[5, 10, 25]}
                        className="datatable-responsive"
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Mostrando {first} al {last} de {totalRecords} demandas"
                        filters={filters}
                        globalFilterFields={['nombres', 'apPaterno', 'apMaterno', 'run', 'correoElectronico', 'nombreRazonSocial', 'rutRazonSocial']}
                        emptyMessage="No se encontraron demandas."
                        header={header}
                        responsiveLayout="scroll"
                        filterLocale="es"
                        loading={loading}
                    >
                        {/* Selección múltiple */}
                        <Column selectionMode="multiple" headerStyle={{ width: '3.5rem' }}></Column>

                        <Column field="nombres" header="Nombres" sortable headerStyle={{ minWidth: '14rem' }} />
                        <Column field="run" header="RUN" sortable headerStyle={{ minWidth: '12rem' }} />
                        <Column field="correoElectronico" header="Correo" sortable headerStyle={{ minWidth: '16rem' }} />
                        <Column field="createdAt" header="Creada" body={formatFecha} sortable headerStyle={{ minWidth: '14rem' }} />

                        <Column header="Documento" body={documentoBodyTemplate} headerStyle={{ minWidth: '12rem' }} />
                        {/*<Column header="Descargar" body={descargarBodyTemplate as any} headerStyle={{ minWidth: '12rem' }} />*/}

                        {/*<Column header="Acciones" body={actionsTemplate} headerStyle={{ minWidth: '10rem' }} />*/}
                    </DataTable>

                    {/* Eliminar una */}
                    <Dialog visible={deleteDialogVisible} style={{ width: 450 }} header="Confirmar" modal footer={deleteOneFooter} onHide={() => setDeleteDialogVisible(false)}>
                        <div className="flex align-items-center justify-content-center">
                            <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                            {demandaToDelete && (
                                <span>
                                    ¿Seguro que deseas eliminar la demanda de <b>{demandaToDelete.nombres}</b> ({demandaToDelete.run})?
                                </span>
                            )}
                        </div>
                    </Dialog>

                    {/* Eliminar varias */}
                    <Dialog visible={deleteManyDialogVisible} style={{ width: 450 }} header="Confirmar" modal footer={deleteManyFooter} onHide={() => setDeleteManyDialogVisible(false)}>
                        <div className="flex align-items-center justify-content-center">
                            <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                            <span>¿Seguro que deseas eliminar las demandas seleccionadas?</span>
                        </div>
                    </Dialog>
                </div>
            </div>
        </div>
    );
}
