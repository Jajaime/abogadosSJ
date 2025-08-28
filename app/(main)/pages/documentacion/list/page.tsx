/* eslint-disable @next/next/no-img-element */
'use client';
import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { InputNumber, InputNumberValueChangeEvent } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { RadioButton, RadioButtonChangeEvent } from 'primereact/radiobutton';
import { Rating } from 'primereact/rating';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { classNames } from 'primereact/utils';
import React, { useEffect, useRef, useState } from 'react';

/* @todo Used 'as any' for types here. Will fix in next version due to onSelectionChange event type issue. */
const Documentacion = () => {

    const router = useRouter();

    const [products, setProducts] = useState(null);
    const [productDialog, setProductDialog] = useState(false);
    const [deleteProductDialog, setDeleteProductDialog] = useState(false);
    const [deleteProductsDialog, setDeleteProductsDialog] = useState(false);
    const [selectedProducts, setSelectedProducts] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [globalFilter, setGlobalFilter] = useState('');
    const toast = useRef<Toast>(null);
    const dt = useRef<DataTable<any>>(null);

    // Agrega este estado para controlar la generación de documentos
    const [generatingDoc, setGeneratingDoc] = useState<string | null>(null);

    /*DEMANDAS INICIO*/
    const [demandas, setDemandas] = useState([]);
    const [selectDemandas, setSelectDemandas] = useState([]);

    const fetchDemandas = async () => {
        const response = await fetch("/api/demandas");
        const data = await response.json();
        setDemandas(data);
    };

    useEffect(() => {
        fetchDemandas();
    }, []);

    // Columna para descargar documentos
    const descargarBodyTemplate = (rowData: any) => {
        return (
            <Button
                label="Descargar"
                icon="pi pi-download"
                className="p-button-success p-button-sm"
                onClick={() => handleDescargarDocumento(rowData.id)}
            />
        );
    };

    // Función para descargar el documento
    const handleDescargarDocumento = async (demandaId: string) => {
        try {
            const response = await fetch(`/api/download_doc?demandaId=${demandaId}`);

            if (!response.ok) {
                throw new Error('Error al descargar el documento');
            }

            // Procesa la respuesta como un blob (archivo binario)
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;

            // Extrae el nombre del archivo desde el encabezado Content-Disposition
            const disposition = response.headers.get('Content-Disposition');
            let filename = 'documento_descargado.docx';

            if (disposition && disposition.includes('filename=')) {
                const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                if (match != null && match[1]) {
                    filename = match[1].replace(/['"]/g, ''); // Limpia comillas si las hay
                }
            }

            link.download = filename;
            link.click();
            link.remove();

            toast.current?.show({
                severity: 'success',
                summary: 'Éxito',
                detail: 'Documento descargado correctamente',
                life: 3000,
            });
        } catch (error) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: (error as any)?.message || 'Error al descargar documento',
                life: 5000,
            });
        }
    };

    /*USUARIOS FINAL*/
    const openNew = () => {
        router.push('/pages/demanda'); // Navega a la ruta específica
    };

/*     const openNew = () => {
        setProduct(emptyProduct);
        setSubmitted(false);
        setProductDialog(true);
    }; */

    

    const hideDialog = () => {
        setSubmitted(false);
        setProductDialog(false);
    };

    const hideDeleteProductDialog = () => {
        setDeleteProductDialog(false);
    };

    const hideDeleteProductsDialog = () => {
        setDeleteProductsDialog(false);
    };

    const findIndexById = (id: string) => {
        let index = -1;
        for (let i = 0; i < (products as any)?.length; i++) {
            if ((products as any)[i].id === id) {
                index = i;
                break;
            }
        }

        return index;
    };

    const createId = () => {
        let id = '';
        let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 5; i++) {
            id += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return id;
    };

    const exportCSV = () => {
        dt.current?.exportCSV();
    };

    const confirmDeleteSelected = () => {
        setDeleteProductsDialog(true);
    };

    const deleteSelectedProducts = () => {
        let _products = (products as any)?.filter((val: any) => !(selectedProducts as any)?.includes(val));
        setProducts(_products);
        setDeleteProductsDialog(false);
        setSelectedProducts(null);
        toast.current?.show({
            severity: 'success',
            summary: 'Successful',
            detail: 'Products Deleted',
            life: 3000
        });
    };

    const leftToolbarTemplate = () => {
        return (
            <React.Fragment>
                <div className="my-2">
                    <Button label="Nueva Demanda" icon="pi pi-plus" severity="success" className=" mr-2" onClick={openNew} />
                    <Button label="Eliminar Demanda" icon="pi pi-trash" severity="danger" onClick={confirmDeleteSelected} disabled={!selectedProducts || !(selectedProducts as any).length} />
                </div>
            </React.Fragment>
        );
    };

    const rightToolbarTemplate = () => {
        return (
            <React.Fragment>
                {/* <FileUpload mode="basic" accept="image/*" maxFileSize={1000000} chooseLabel="Import" className="mr-2 inline-block" /> */}
                {/* <Button label="Export" icon="pi pi-upload" severity="help" onClick={exportCSV} /> */}
            </React.Fragment>
        );
    };

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0">Documentación</h5>
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
                <InputText type="search" onInput={(e) => setGlobalFilter(e.currentTarget.value)} placeholder="Buscar..." />
            </span>
        </div>
    );

    return (
        <div className="grid crud-demo">
            <div className="col-12">
                <div className="card">
                    <Toast ref={toast} />
                    <DataTable
                        ref={dt}
                        value={demandas}
                        selection={selectDemandas}
                        selectionMode="single"
                        onSelectionChange={(e) => setSelectDemandas(e.value as any)}
                        dataKey="id"
                        paginator
                        rows={10}
                        rowsPerPageOptions={[5, 10, 25]}
                        className="datatable-responsive"
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Mostrando {first} del {last} de {totalRecords} demandas"
                        globalFilter={globalFilter}
                        emptyMessage="No se encontraron demandas."
                        header={header}
                        responsiveLayout="scroll"
                        filterLocale='es'
                    >
                        <Column selectionMode="multiple" headerStyle={{ width: '4rem' }}></Column>
                        <Column field="id" header="Identificador" sortable headerStyle={{ minWidth: '15rem' }}></Column>
                        <Column field="nombres" header="Nombre" sortable headerStyle={{ minWidth: '15rem' }}></Column>
                        <Column field="run" header="RUN" sortable headerStyle={{ minWidth: '15rem' }}></Column>
                        <Column field="correoElectronico" header="Correo Electrónico" sortable headerStyle={{ minWidth: '15rem' }}></Column>
                        <Column header="Documento" body={descargarBodyTemplate} headerStyle={{ minWidth: '15rem' }}></Column>
                        {/* <Column body={actionBodyTemplate} headerStyle={{ minWidth: '10rem' }}></Column> */}
                    </DataTable>
                </div>
            </div>
        </div>
    );
};

export default Documentacion;
