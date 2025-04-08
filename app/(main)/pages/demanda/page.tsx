'use client';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Messages } from 'primereact/messages';
import { Calendar } from "primereact/calendar";
import { Toolbar } from 'primereact/toolbar';
import { DataTable } from 'primereact/datatable';
import { Toast } from 'primereact/toast';
import { DemandadoSolService } from '../../../../demo/service/DemandadoSolService';
import { Demo } from '@/types';
import { Dialog } from 'primereact/dialog';
import { classNames } from 'primereact/utils';
import { Column } from 'primereact/column';
import { RadioButton, RadioButtonChangeEvent } from 'primereact/radiobutton';
import { InputNumber } from "primereact/inputnumber";
import { MultiSelect } from 'primereact/multiselect';
        

interface DropdownItem {
    name: string;
    code: string;
}

const DemandaPage = () => {
    const [dropdownItemMateria, setDropdownItemMateria] = useState<DropdownItem | null>(null);
    const [dropdownItemNacionalidad, setDropdownItemNacionalidad] = useState<DropdownItem | null>(null);
    const [dropdownItemNatuContrato, setDropdownItemNatuContrato] = useState<DropdownItem | null>(null);
    const [dropdownItemEstadoCivil, setDropdownItemEstadoCivil] = useState<DropdownItem | null>(null);
    const [dropdownItemJornadaLab, setDropdownItemJornadaLab] = useState<DropdownItem | null>(null);
    const [dropdownItemFormaPago, setDropdownItemFormaPago] = useState<DropdownItem | null>(null);
    const [dropdownItemFuero, setDropdownItemFuero] = useState<DropdownItem | null>(null);
    const [dropdownItemMotivoTermino, setDropdownItemMotivoTermino] = useState<DropdownItem | null>(null);
    const [dropdownItemCotizacionSalud, setDropdownItemCotizacionSalud] = useState<DropdownItem | null>(null);
    const [dropdownItemCotizacionAfp, setDropdownItemCotizacionAfp] = useState<DropdownItem | null>(null);
    const [dropdownItemCotizacionAfc, setDropdownItemCotizacionAfc] = useState<DropdownItem | null>(null);
    const [dropdownItemDespidoDisciplinario, setDropdownItemDespidoDisciplinario] = useState<DropdownItem | null>(null);
    const [dropdownItemTipoDespido, setDropdownItemTipoDespido] = useState<DropdownItem | null>(null);
    const [dropdownItemPrestacionesAdeudada, setDropdownItemPrestacionesAdeudada] = useState<DropdownItem[]>([]);
    const [generatedButtons, setGeneratedButtons] = useState<DropdownItem[]>([]);
    const message = useRef<Messages>(null);
    const [calendarValueFNac, setCalendarValueFNac] = useState<any>(null);
    const [calendarValueRLab, setCalendarValueRLab] = useState<any>(null);
    const [calendarValueRTerLab, setCalendarValueRTerLab] = useState<any>(null);
    const [inputNumberValueRemuneracion, setInputNumberValueRemuneracion] = useState<number | null>(
        null
    ); const [inputNumberValueVacaciones, setInputNumberValueVacaciones] = useState<number | null>(
        null
    );

    let emptyDemnadadoSol: Demo.DemandadoSol = {
        id: '',
        nombre: '',
        rut: '',
        domicilio: '',
    };

    const [demandadoSols, setDemandadoSols] = useState(null);
    const [demandadoSolDialog, setDemandadoSolDialog] = useState(false);
    const [deleteDemanadoSolDialog, setDeleteDemandadoSolDialog] = useState(false);
    const [deleteDemanadoSolsDialog, setDeleteDemanadoSolsDialog] = useState(false);
    const [demandadoSol, setDemandadoSol] = useState<Demo.DemandadoSol>(emptyDemnadadoSol);
    const [selectedDemandadoSols, setSelectedDemandadoSols] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [globalFilter, setGlobalFilter] = useState('');
    const toast = useRef<Toast>(null);
    const dtDemandadoSol = useRef<DataTable<any>>(null);
    const [radioValueRegAsistencia, setRadioValueRegAsistencia] = useState(null);
    const [radioValueLiquidacionSueldo, setRadioValueLiquidacionSueldo] = useState(null);
    const [radioValueAnosServicio, setRadioValueAnosServicio] = useState(null);
    const [radioValueMesAviso, setRadioValueMesAviso] = useState(null);
    const [radioValueFiniquito, setRadioValueFiniquito] = useState(null);

    useEffect(() => {
        DemandadoSolService.getDemandadoSols().then((data) => setDemandadoSols(data as any));
    }, []);

    const hideDialog = () => {
        setSubmitted(false);
        setDemandadoSolDialog(false);
    };

    const dropdownItemsMateria: DropdownItem[] = useMemo(
        () => [
            { name: 'Asignación de colación', code: '1' },
            { name: 'Asignación  de experiencia', code: '2' },
            { name: 'Asignación de locomoción', code: '3' },
            { name: 'Asignación  de pérdida de caja', code: '4' },
            { name: 'Asignación de perfeccionamiento', code: '5' },
            { name: 'Asignación desgaste de harramientas', code: '6' },
            { name: 'Asignación Familia', code: '7' },
            { name: 'Asignaciónpor desempeño en cond. Difíciles', code: '8' },
            { name: 'Asignación por responsabilidad', code: '9' },
            { name: 'Asignacion especiales', code: '10' },
            { name: 'Bonos', code: '11' },
            { name: 'Comisiones', code: '12' },
            { name: 'Costas', code: '13' },
            { name: 'Cuota Sindical', code: '14' },
            { name: 'Daño Moral', code: '15' },
            { name: 'Descanso compensatorio', code: '16' },
            { name: 'Descanso dominical', code: '17' },
            { name: 'Despedido indirecto', code: '18' },
            { name: 'Despido Injustificado', code: '19' },
            { name: 'Feriado Legal', code: '20' },
            { name: 'Feriado Progresivo', code: '21' },
            { name: 'Feriado Proporcional', code: '22' },
            { name: 'Fuero maternal', code: '23' },
            { name: 'Fuero sindical', code: '24' },
            { name: 'Gratificaciones legales', code: '25' },
            { name: 'Horas Extras', code: '26' },
            { name: 'Indemnización convencional', code: '27' },
            { name: 'Indemnización de trabajadora de casa particular', code: '28' },
            { name: 'Indemnización del artículo 87 del Estatuto Docente', code: '29' },
            { name: 'Indemnización por años de servicios', code: '30' },
            { name: 'Indemnización sustitutiva de aviso previo', code: '31' },
            { name: 'Multa', code: '32' },
            { name: 'Nulidad de despido', code: '33' },
            { name: 'Otras Gratificaciones', code: '34' },
            { name: 'Otras Indemnizaciones', code: '35' },
            { name: 'Participación', code: '36' },
            { name: 'Prestaciones', code: '37' },
            { name: 'Recálculo de pensiones', code: '38' },
            { name: 'Recargos', code: '39' },
            { name: 'Regalías', code: '40' },
            { name: 'Reincorporación', code: '41' },
            { name: 'Remuneraciones', code: '42' },
            { name: 'Semana corrida', code: '43' },
            { name: 'Subterfugio', code: '44' },
            { name: 'Sueldo', code: '45' },
            { name: 'Trato', code: '46' },
            { name: 'Viáticos', code: '47' },
            { name: 'Desafuero Maternal', code: '48' },
            { name: 'Desafuero Sindical', code: '49' },
            { name: 'Art. 19 N° 12 CPR. Libertad de opinión e información', code: '50' },
            { name: 'Otras Materias Sindicales', code: '51' },
            { name: 'Art. 19 N° 1 Derecho a la vida y la integridad', code: '52' },
            { name: 'Art. 19 N° 16 CPR. Libertad de Trabajo y su protección', code: '53' },
            { name: 'Art. 19 N° 4 Vida Privada y Honra', code: '54' },
            { name: 'Art. 19 N° 5 Inviolabilidad de la comunicación privada', code: '55' },
            { name: 'Art. 19 N° 6 CPR. Libertad de creencias', code: '56' },
            { name: 'Art. 2 CT. Sobre actos de discriminación', code: '56' },
            { name: 'Art. 485 inciso 3° CT', code: '56' },
            { name: 'Accidentes Del Trabajo Y Enfermedades Profesionales', code: '56' }
        ],
        []
    );

    const dropdownItemsNacionalidades: DropdownItem[] = useMemo(
        () => [
            { name: 'Afgana', code: 'AF' },
            { name: 'Alemana', code: 'DE' },
            { name: 'Andorrana', code: 'AD' },
            { name: 'Angoleña', code: 'AO' },
            { name: 'Argentina', code: 'AR' },
            { name: 'Armenia', code: 'AM' },
            { name: 'Australiana', code: 'AU' },
            { name: 'Austriaca', code: 'AT' },
            { name: 'Bangladesí', code: 'BD' },
            { name: 'Belga', code: 'BE' },
            { name: 'Boliviana', code: 'BO' },
            { name: 'Brasileña', code: 'BR' },
            { name: 'Búlgara', code: 'BG' },
            { name: 'Canadiense', code: 'CA' },
            { name: 'Chilena', code: 'CL' },
            { name: 'China', code: 'CN' },
            { name: 'Colombiana', code: 'CO' },
            { name: 'Coreana', code: 'KR' },
            { name: 'Costarricense', code: 'CR' },
            { name: 'Cubana', code: 'CU' },
            { name: 'Danesa', code: 'DK' },
            { name: 'Dominicana', code: 'DO' },
            { name: 'Ecuatoriana', code: 'EC' },
            { name: 'Egipcia', code: 'EG' },
            { name: 'Española', code: 'ES' },
            { name: 'Estadounidense', code: 'US' },
            { name: 'Etíope', code: 'ET' },
            { name: 'Filipina', code: 'PH' },
            { name: 'Francesa', code: 'FR' },
            { name: 'Griega', code: 'GR' },
            { name: 'Guatemalteca', code: 'GT' },
            { name: 'Hondureña', code: 'HN' },
            { name: 'India', code: 'IN' },
            { name: 'Indonesa', code: 'ID' },
            { name: 'Irlandesa', code: 'IE' },
            { name: 'Israelí', code: 'IL' },
            { name: 'Italiana', code: 'IT' },
            { name: 'Japonesa', code: 'JP' },
            { name: 'Marroquí', code: 'MA' },
            { name: 'Mexicana', code: 'MX' },
            { name: 'Nicaragüense', code: 'NI' },
            { name: 'Neozelandesa', code: 'NZ' },
            { name: 'Noruega', code: 'NO' },
            { name: 'Panameña', code: 'PA' },
            { name: 'Paraguaya', code: 'PY' },
            { name: 'Peruana', code: 'PE' },
            { name: 'Polaca', code: 'PL' },
            { name: 'Portuguesa', code: 'PT' },
            { name: 'Rumana', code: 'RO' },
            { name: 'Rusa', code: 'RU' },
            { name: 'Salvadoreña', code: 'SV' },
            { name: 'Sudafricana', code: 'ZA' },
            { name: 'Sueca', code: 'SE' },
            { name: 'Suiza', code: 'CH' },
            { name: 'Tailandesa', code: 'TH' },
            { name: 'Turca', code: 'TR' },
            { name: 'Uruguaya', code: 'UY' },
            { name: 'Venezolana', code: 'VE' },
            { name: 'Vietnamita', code: 'VN' },
        ],
        []
    );

    const dropdownItemsNatuContratos: DropdownItem[] = useMemo(
        () => [
            { name: 'Indefinido', code: '1' },
            { name: 'Obra o faena', code: '2' },
            { name: 'Plazo fijo', code: '3' }
        ],
        []
    );

    const dropdownItemsFormaPagos: DropdownItem[] = useMemo(
        () => [
            { name: 'Efectivo', code: '1' },
            { name: 'Transferencia', code: '2' }
        ],
        []
    );

    const dropdownItemsFueros: DropdownItem[] = useMemo(
        () => [
            { name: 'Trabajadora Embarazada', code: '1' },
            { name: 'Dirigente Sindical', code: '2' },
            { name: 'Negociación Colectiva Reglada', code: '3' },
            { name: 'Constitución Sindicato', code: '4' }
        ],
        []
    );

    const dropdownItemsMotivoTerminos: DropdownItem[] = useMemo(
        () => [
            { name: 'Renuncia', code: '1' },
            { name: 'Mutuo Acuerdo', code: '2' },
            { name: 'Despido', code: '3' },
            { name: 'Autodespido', code: '4' }
        ],
        []
    );

    const dropdownItemsJornadaLabs: DropdownItem[] = useMemo(
        () => [
            { name: '44 horas jornada ordinaria', code: '1' },
            { name: 'siete por siete', code: '2' },
            { name: 'diez por diez', code: '3' },
            { name: 'cuatro por cuatro', code: '4' },
            { name: 'bisemanal', code: '5' },
            { name: 'jornada parcial', code: '6' },
            { name: 'otra especificar', code: '7' }
        ],
        []
    );

    const dropdownItemsEstadoCivil: DropdownItem[] = useMemo(
        () => [
            { name: 'Solerto(a)', code: '1' },
            { name: 'Casado(a)', code: '2' },
            { name: 'Conviviente civil', code: '3' },
            { name: 'Separado(a) judicialmente', code: '4' },
            { name: 'Divorciado(a)', code: '5' },
            { name: 'Viudo(a)', code: '6' }
        ],
        []
    );

    const dropdownItemsCotizacionSaluds: DropdownItem[] = useMemo(
        () => [
            { name: '12 meses', code: '12' },
            { name: '11 meses', code: '11' },
            { name: '10 meses', code: '10' },
            { name: '9 meses', code: '9' },
            { name: '8 meses', code: '8' },
            { name: '7 meses', code: '7' },
            { name: '6 meses', code: '6' },
            { name: '5 meses', code: '5' },
            { name: '4 meses', code: '4' },
            { name: '3 meses', code: '3' },
            { name: '2 meses', code: '2' },
            { name: '1 meses', code: '1' }
        ],
        []
    );

    const dropdownItemsCotizacionAfps: DropdownItem[] = useMemo(
        () => [
            { name: '12 meses', code: '12' },
            { name: '11 meses', code: '11' },
            { name: '10 meses', code: '10' },
            { name: '9 meses', code: '9' },
            { name: '8 meses', code: '8' },
            { name: '7 meses', code: '7' },
            { name: '6 meses', code: '6' },
            { name: '5 meses', code: '5' },
            { name: '4 meses', code: '4' },
            { name: '3 meses', code: '3' },
            { name: '2 meses', code: '2' },
            { name: '1 meses', code: '1' }
        ],
        []
    );

    const dropdownItemsCotizacionAfcs: DropdownItem[] = useMemo(
        () => [
            { name: '12 meses', code: '12' },
            { name: '11 meses', code: '11' },
            { name: '10 meses', code: '10' },
            { name: '9 meses', code: '9' },
            { name: '8 meses', code: '8' },
            { name: '7 meses', code: '7' },
            { name: '6 meses', code: '6' },
            { name: '5 meses', code: '5' },
            { name: '4 meses', code: '4' },
            { name: '3 meses', code: '3' },
            { name: '2 meses', code: '2' },
            { name: '1 meses', code: '1' }
        ],
        []
    );

    const dropdownItemsTipoDespidos: DropdownItem[] = useMemo(
        () => [
            { name: 'Disciplinario', code: '1' },
            { name: 'Necesidades de la Empresa', code: '2' },
            { name: 'Sin Causa', code: '3' },
            { name: 'Término de Plazo', code: '4' },
            { name: 'Término de Obra o Faena', code: '5' }
        ],
        []
    );

    const dropdownItemsDespidoDisciplinarios: DropdownItem[] = useMemo(
        () => [
            { name: 'Incumplimiento Grave', code: '1' },
            { name: 'Ausencia Injustificadas', code: '2' },
            { name: 'Acaso Sexual', code: '3' },
            { name: 'Acoso Laboral', code: '4' },
            { name: 'Injurias', code: '5' },
            { name: 'Negociación Incompatible', code: '6' },
            { name: 'Actos o Imprudencia Temeraria', code: '7' },
            { name: 'Abandono de Trabajo', code: '8' },
            { name: 'Falta de Probidad', code: '9' },
            { name: 'Otros Especificar', code: '10' }
        ],
        []
    );

    const dropdownItemsPrestacionesAdeudadas: DropdownItem[] = useMemo(
        () => [
            { name: 'Feriados', code: '1' },
            { name: 'Remuneraciones', code: '2' },
            { name: 'Gratificaciones', code: '3' },
            { name: 'Indemnizaciones', code: '4' },
            { name: 'Bonos', code: '5' },
            { name: 'Años de Servicios', code: '6' },
            { name: 'Horas Extraordinarias', code: '7' },
            { name: 'Comisiones', code: '8' },
            { name: 'Otros', code: '9' }
        ],
        []
    );

    /* useEffect(() => {
        setDropdownItem(dropdownItemsMateria[0]);
    }, [dropdownItemsMateria]); */

    const addErrorMessage = () => {
        message.current?.show({ severity: 'error', content: 'Esta materia ya ha sido agregada.' });
    };

    const handleAddButton = () => {
        if (dropdownItemMateria) {
            // Verificar si la materia ya existe en los botones generados
            const alreadyExists = generatedButtons.some(
                (button) => button.code === dropdownItemMateria.code
            );

            if (alreadyExists) {
                addErrorMessage();
                return; // Salir sin agregar el botón
            }

            // Agregar la materia al estado si no existe
            setGeneratedButtons((prev) => [
                ...prev,
                { name: dropdownItemMateria.name, code: dropdownItemMateria.code },
            ]);
        }
    };

    const handleRemoveButton = (code: string) => {
        setGeneratedButtons((prev) =>
            prev.filter((button) => button.code !== code)
        );
    };

    const toolbarLeftTemplate = () => {
        return (
            <>
                <Button label="Agregar" icon="pi pi-plus" style={{ marginRight: '.5em' }} />

                <i className="pi pi-bars p-toolbar-separator" style={{ marginRight: '.5em' }}></i>

                <Button icon="pi pi-pencil" severity="warning" style={{ marginRight: '.5em' }} />
                <Button icon="pi pi-trash" severity="danger" style={{ marginRight: '.5em' }} />
            </>
        );
    };

    const saveDemandadoSol = () => {
        setSubmitted(true);

        // Verificamos que el campo 'rut' no esté vacío
        if (demandadoSol.rut.trim()) {
            let _demandadoSols = [...(demandadoSols as any)];
            let _demandadoSol = { ...demandadoSol };

            if (demandadoSol.id) {
                // Si existe un id, actualizamos el demandado existente
                const index = findIndexById(demandadoSol.id);
                _demandadoSols[index] = _demandadoSol;

                toast.current?.show({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: 'Demandado Actualizado',
                    life: 3000
                });
            } else {
                // Si no existe id, creamos un nuevo demandado
                _demandadoSol.id = createId(); // Asignar un nuevo ID
                _demandadoSols.push(_demandadoSol);

                toast.current?.show({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: 'Demandado Creado',
                    life: 3000
                });
            }

            // Actualizamos el estado con la lista de demandados
            setDemandadoSols(_demandadoSols as any);
            setDemandadoSolDialog(false); // Cerrar el diálogo de creación/edición
            setDemandadoSol(emptyDemnadadoSol); // Reiniciar el formulario
        }
    };

    const findIndexById = (id: string) => {
        let index = -1;
        for (let i = 0; i < (demandadoSols as any)?.length; i++) {
            if ((demandadoSols as any)[i].id === id) {
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

    const onInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, name: string) => {
        const val = (e.target && e.target.value) || '';
        let _demandadoSol = { ...demandadoSol };
        _demandadoSol[`${name}`] = val;

        setDemandadoSol(_demandadoSol);
    };


    const demandadoSolDialogFooter = (
        <>
            <Button label="Cancel" icon="pi pi-times" text onClick={hideDialog} />
            <Button label="Save" icon="pi pi-check" text onClick={saveDemandadoSol} />
        </>
    );

    const nombreBodyTemplate = (rowData: Demo.DemandadoSol) => {
        return (
            <>
                <span className="p-column-title">Nombre Razón Social de Empresa</span>
                {rowData.nombre}
            </>
        );
    };

    const rutBodyTemplate = (rowData: Demo.DemandadoSol) => {
        return (
            <>
                <span className="p-column-title">RUT</span>
                {rowData.rut}
            </>
        );
    };

    const domicilioBodyTemplate = (rowData: Demo.DemandadoSol) => {
        return (
            <>
                <span className="p-column-title">Domicilio</span>
                {rowData.domicilio}
            </>
        );
    };

    const editDemandadoSol = (DemandadoSol: Demo.DemandadoSol) => {
        setDemandadoSol({ ...DemandadoSol });
        setDemandadoSolDialog(true);
    };

    const confirmDeleteDemandadoSol = (DemandadoSol: Demo.DemandadoSol) => {
        setDemandadoSol(DemandadoSol);
        setDeleteDemandadoSolDialog(true);
    };

    const actionBodyTemplate = (rowData: Demo.DemandadoSol) => {
        return (
            <>
                <Button icon="pi pi-pencil" rounded severity="success" className="mr-2" onClick={() => editDemandadoSol(rowData)} />
                <Button icon="pi pi-trash" rounded severity="warning" onClick={() => confirmDeleteDemandadoSol(rowData)} />
            </>
        );
    };

    return (
        <div className="grid">
            <div className="col-12">
                <div className="card">
                    <h5>DATOS CLIENTE</h5>
                    <div className="p-fluid formgrid grid">
                        <div className="field col-12 md:col-4">
                            <label htmlFor="nombres">Nombres</label>
                            <InputText
                                id="nombres"
                                type="text"
                                placeholder='Ingrese los nombres' />
                        </div>
                        <div className="field col-12 md:col-4">
                            <label htmlFor="apPaterno">Apellido Paterno</label>
                            <InputText
                                id="apPaterno"
                                type="text"
                                placeholder='Ingrese apellido paterno' />
                        </div>
                        <div className="field col-12 md:col-4">
                            <label htmlFor="apMaterno">Apellido Materno</label>
                            <InputText
                                id="apMaterno"
                                type="text"
                                placeholder='Ingrese apellido materno' />
                        </div>
                        <div className="field col-12 md:col-4">
                            <label htmlFor="run">Rut/Pasaporte/Cédula</label>
                            <InputText
                                id="run"
                                type="text"
                                placeholder='Ingrese Rut/Pasaporte/Cédula' />
                        </div>
                        <div className="field col-12 md:col-4">
                            <label htmlFor="nacionalidad">Nacionalidad</label>
                            <Dropdown
                                id="nacionalidad"
                                value={dropdownItemNacionalidad}
                                onChange={(e) => setDropdownItemNacionalidad(e.value)}
                                options={dropdownItemsNacionalidades}
                                optionLabel="name"
                                placeholder="Selecccione Nacionalidad"
                                filter></Dropdown>
                        </div>
                        <div className="field col-12 md:col-4">
                            <label htmlFor="estadoCivil">Estado Civil</label>
                            <Dropdown
                                id="estadoCivil"
                                value={dropdownItemEstadoCivil}
                                onChange={(e) => setDropdownItemEstadoCivil(e.value)}
                                options={dropdownItemsEstadoCivil}
                                optionLabel="name"
                                placeholder="Selecccione Estado Civil">
                            </Dropdown>
                        </div>
                        <div className="field col-12 md:col-4">
                            <label htmlFor="nacimiento">Fecha de Nacimiento</label>
                            <Calendar
                                id="nacimiento"
                                showIcon
                                showButtonBar
                                value={calendarValueFNac}
                                dateFormat='dd/mm/yy'
                                onChange={(e) => setCalendarValueFNac(e.value ?? null)}
                                placeholder='dd/mm/yyyy'
                                locale='es' />
                        </div>
                        <div className="field col-12 md:col-6">
                            <label htmlFor="run">Correo Electrónico</label>
                            <InputText
                                id="run"
                                type="text"
                                placeholder='ejemplo@direccion.cl' />
                        </div>
                    </div>
                </div>

                {/* <div className="card">
                    <h5>DATOS DEMANDADO PRINCIPAL</h5>
                    <div className="p-fluid formgrid grid">
                        <div className="field col-12 md:col-4">
                            <label htmlFor="nombreRazonSocial">Nombre Razón Social de Empresa</label>
                            <InputText 
                                id="nombreRazonSocial" 
                                type="text" 
                                placeholder='Ingrese el Nombre Razón Social de Empresa'/>
                        </div>
                        <div className="field col-12 md:col-4">
                            <label htmlFor="rutRazonSocial">Rut</label>
                            <InputText 
                                id="rutRazonSocial" 
                                type="text" 
                                placeholder='Ingrese rut'/>
                        </div>
                        <div className="field col-12 md:col-4">
                            <label htmlFor="domicilioRazonSocial">Domicilio</label>
                            <InputText 
                                id="domicilioRazonSocial" 
                                type="text" 
                                placeholder='Ingrese domicilio'/>
                        </div>
                        <div className="field col-12 md:col-4">
                            <label htmlFor="representanteLegal">Representante Legal</label>
                            <InputText 
                                id="representanteLegal" 
                                type="text" 
                                placeholder='Ingrese nombre del representante legal'/>
                        </div>
                        <div className="field col-12 md:col-4">
                            <label htmlFor="run">Rut Representante Legal</label>
                            <InputText 
                                id="run" 
                                type="text" 
                                placeholder='Ingrese Rut del representante legal'/>
                        </div>
                    </div>
                </div> */}
                {/*inicio de pagina con 2 columnas
                <div className="card">
                    <h5>INGRESO DE DEMANDA</h5>
                    <div className="p-fluid formgrid grid">
                        <div className="field col-12 md:col-6">
                            <label htmlFor="materia">Materia</label>
                            <Dropdown
                                id="materia"
                                value={dropdownItemMateria}
                                onChange={(e) => setDropdownItemMateria(e.value)}
                                options={dropdownItemsMateria}
                                optionLabel="name"
                                placeholder="Selecccione Materia"
                                filter></Dropdown>
                        </div>
                        <div className="field col-6 md:col-3">
                            <label htmlFor="addmateria" style={{ color: "#fff" }}>.</label>
                            <Button
                                id="addmateria"
                                label="Agregar"
                                icon="pi pi-plus"
                                severity="success"
                                onClick={handleAddButton}></Button>
                        </div>
                        <Messages ref={message} />
                    </div>
                </div>
                <div className="card">
                    <h5>MATERIAS SELECCIONADA</h5>
                    <div className="flex flex-wrap gap-2">
                        {generatedButtons.map((button) => (
                            <Button
                                key={button.code}
                                label={button.name}
                                severity="info"
                                className="p-mr-2 p-mb-2"
                                onClick={() => handleRemoveButton(button.code)}
                            />
                        ))}
                    </div>
                </div>*/}
            </div>
            {/*inicio de pagina con 2 columnas*/}
            <div className="col-12 md:col-6">
                <div className="card p-fluid">
                    <h5>DATOS DEMANDADO PRINCIPAL</h5>
                    <div className="field">
                        <label htmlFor="nombreRazonSocial">Nombre Razón Social de Empresa</label>
                        <InputText
                            id="nombreRazonSocial"
                            type="text"
                            placeholder='Ingrese el Nombre Razón Social de Empresa' />
                    </div>
                    <div className="field">
                        <label htmlFor="rutRazonSocial">Rut</label>
                        <InputText
                            id="rutRazonSocial"
                            type="text"
                            placeholder='Ingrese rut' />
                    </div>
                    <div className="field">
                        <label htmlFor="domicilioRazonSocial">Domicilio</label>
                        <InputText
                            id="domicilioRazonSocial"
                            type="text"
                            placeholder='Ingrese domicilio' />
                    </div>
                    <div className="field">
                        <label htmlFor="representanteLegal">Representante Legal</label>
                        <InputText
                            id="representanteLegal"
                            type="text"
                            placeholder='Ingrese nombre del representante legal' />
                    </div>
                    <div className="field">
                        <label htmlFor="run">Rut Representante Legal</label>
                        <InputText
                            id="run"
                            type="text"
                            placeholder='Ingrese Rut del representante legal' />
                    </div>
                </div>
            </div>
            <div className="col-12 md:col-6">
                <div className="card">
                    <h5>DEMANADO SOLIDARIO</h5>
                    <Toolbar start={toolbarLeftTemplate}></Toolbar>
                    <DataTable
                        ref={dtDemandadoSol}
                        value={demandadoSols}
                        selection={selectedDemandadoSols}
                        onSelectionChange={(e) => setSelectedDemandadoSols(e.value as any)}
                        dataKey="id"
                        rows={10}
                        rowsPerPageOptions={[5, 10, 25]}
                        className="datatable-responsive"
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Mostrando {first} del {last} de {totalRecords} registros"
                        globalFilter={globalFilter}
                        emptyMessage="No se encontraron Registros."
                        responsiveLayout="scroll"
                        filterLocale='es'
                    >
                        <Column selectionMode="multiple" headerStyle={{ width: '4rem' }}></Column>
                        <Column field="NombresRazonSocial" header="Razon Social" body={nombreBodyTemplate} headerStyle={{ minWidth: '15rem' }}></Column>
                        <Column field="RUT" header="RUT" body={rutBodyTemplate} headerStyle={{ minWidth: '10rem' }}></Column>
                        <Column field="Domicilio" header="Domicilio" body={domicilioBodyTemplate} headerStyle={{ minWidth: '15rem' }}></Column>
                        {/*<Column body={actionBodyTemplate} headerStyle={{ minWidth: '10rem' }}></Column>*/}
                    </DataTable>
                    <Dialog visible={demandadoSolDialog} style={{ width: '450px' }} header="Demandado Solidario" modal className="p-fluid" footer={demandadoSolDialogFooter} onHide={hideDialog}>
                        <div className="field">
                            <label htmlFor="nombreDemandadoSol">Nombre Razon Social</label>
                            <InputText
                                id="nombreDemandadoSol"
                                value={demandadoSol.nombre}
                                onChange={(e) => onInputChange(e, 'nombre')}
                                required
                                autoFocus
                                className={classNames({
                                    'p-invalid': submitted && !demandadoSol.nombre
                                })}
                            />
                            {submitted && !demandadoSol.nombre && <small className="p-invalid">Nombre es requerido.</small>}
                        </div>
                        <div className="field">
                            <label htmlFor="rutDemandadoSol">RUT</label>
                            <InputText
                                id="rutDemandadoSol"
                                value={demandadoSol.rut}
                                onChange={(e) => onInputChange(e, 'rut')}
                                required
                                autoFocus
                                className={classNames({
                                    'p-invalid': submitted && !demandadoSol.rut
                                })}
                            />
                            {submitted && !demandadoSol.rut && <small className="p-invalid">RUT es requerido.</small>}
                        </div>
                        <div className="field">
                            <label htmlFor="domicilioDemandadoSol">Domicilio</label>
                            <InputText
                                id="domicilioDemandadoSol"
                                value={demandadoSol.domicilio}
                                onChange={(e) => onInputChange(e, 'domicilio')}
                                required
                                autoFocus
                                className={classNames({
                                    'p-invalid': submitted && !demandadoSol.domicilio
                                })}
                            />
                            {submitted && !demandadoSol.domicilio && <small className="p-invalid">Domicilio es requerido.</small>}
                        </div>
                    </Dialog>
                </div>
            </div>
            {/*termino de pagina con 2 columnas*/}

            {/*Inicio Seccion Relacion Laboral*/}
            <div className="col-12">
                "<div className="card">
                    <h5>RELACION LABORAL</h5>
                    <div className="p-fluid formgrid grid">
                        <div className="field col-12 md:col-3">
                            <label htmlFor="fechaRelaLaboral">Fecha Inicio Relación Laboral</label>
                            <Calendar
                                id="fechaRelaLaboral"
                                showIcon
                                showButtonBar
                                value={calendarValueRLab}
                                dateFormat='dd/mm/yy'
                                onChange={(e) => setCalendarValueRLab(e.value ?? null)}
                                placeholder='dd/mm/yyyy'
                                locale='es' />
                        </div>
                        <div className="field col-12 md:col-3">
                            <label htmlFor="natuContrato">Naturaleza del Contrato</label>
                            <Dropdown
                                id="natuContrato"
                                value={dropdownItemNatuContrato}
                                onChange={(e) => setDropdownItemNatuContrato(e.value)}
                                options={dropdownItemsNatuContratos}
                                optionLabel="name"
                                placeholder="Selecccione">
                            </Dropdown>
                        </div>
                        <div className="field col-12 md:col-6">
                            <label htmlFor="funciones">Funciones</label>
                            <InputTextarea
                                id="funciones"
                                placeholder="Ingrese sus funciones"
                                rows={5}
                                cols={30}
                            />
                        </div>
                        <div className="field col-12 md:col-4">
                            <label htmlFor="lugar">Lugar</label>
                            <InputText
                                id="lugar"
                                type="text"
                                placeholder='Domicilio dónde trabajó' />
                        </div>
                        <div className="field col-12 md:col-4">
                            <label htmlFor="jornada">Jornada</label>
                            <Dropdown
                                id="jornada"
                                value={dropdownItemJornadaLab}
                                onChange={(e) => setDropdownItemJornadaLab(e.value)}
                                options={dropdownItemsJornadaLabs}
                                optionLabel="name"
                                placeholder="Selecccione">
                            </Dropdown>
                        </div>
                        {dropdownItemJornadaLab?.name === 'otra especificar' && (
                            <div className="field col-12 md:col-4">
                                <label htmlFor="otraJornada">Especificar:</label>
                                <InputText
                                    id="otraJornada"
                                    type="text"
                                    placeholder='Especificar otra jornada' />
                            </div>
                        )}
                        <div className="field col-12 md:col-4">
                            <label htmlFor="regAsistencia">Registro de Asistencia</label>
                            <div className="field-radiobutton">
                                <RadioButton
                                    inputId="regAsistencia"
                                    name="option"
                                    value="Sí"
                                    checked={radioValueRegAsistencia === "Sí"}
                                    onChange={(e) => setRadioValueRegAsistencia(e.value)}
                                />
                                <label htmlFor="regAsistencia">Sí</label>
                            </div>
                            <div className="field-radiobutton">
                                <RadioButton
                                    inputId="regAsistencia2"
                                    name="option"
                                    value="No"
                                    checked={radioValueRegAsistencia === "No"}
                                    onChange={(e) => setRadioValueRegAsistencia(e.value)}
                                />
                                <label htmlFor="regAsistencia2">No</label>
                            </div>
                        </div>
                        <div className="field col-12 md:col-4">
                            <label htmlFor="remuneracion">Remuneración</label>
                            <InputNumber
                                value={inputNumberValueRemuneracion}
                                onValueChange={(e) =>
                                    setInputNumberValueRemuneracion(e.value ?? null)
                                }
                                mode="decimal"
                                placeholder='especificar monto'
                            ></InputNumber>
                        </div>
                        <div className="field col-12 md:col-4">
                            <label htmlFor="formaPago">Forma de Pago</label>
                            <Dropdown
                                id="formaPago"
                                value={dropdownItemFormaPago}
                                onChange={(e) => setDropdownItemFormaPago(e.value)}
                                options={dropdownItemsFormaPagos}
                                optionLabel="name"
                                placeholder="Selecccione">
                            </Dropdown>
                        </div>
                        <div className="field col-12 md:col-4">
                            <label htmlFor="liquidacionSueldo">Liquidaciones de Sueldo</label>
                            <div className="field-radiobutton">
                                <RadioButton
                                    inputId="liquidacionSueldo"
                                    name="option"
                                    value="Sí"
                                    checked={radioValueLiquidacionSueldo === "Sí"}
                                    onChange={(e) => setRadioValueLiquidacionSueldo(e.value)}
                                />
                                <label htmlFor="liquidacionSueldo">Sí</label>
                            </div>
                            <div className="field-radiobutton">
                                <RadioButton
                                    inputId="liquidacionSueldo2"
                                    name="option"
                                    value="No"
                                    checked={radioValueLiquidacionSueldo === "No"}
                                    onChange={(e) => setRadioValueLiquidacionSueldo(e.value)}
                                />
                                <label htmlFor="liquidacionSueldo2">No</label>
                            </div>
                        </div>
                        <div className="field col-12 md:col-4">
                            <label htmlFor="cotizacionSalud">Cotizaciones de Salud</label>
                            <Dropdown
                                id="cotizaciones"
                                value={dropdownItemCotizacionSalud}
                                onChange={(e) => setDropdownItemCotizacionSalud(e.value)}
                                options={dropdownItemsCotizacionSaluds}
                                optionLabel="name"
                                tooltip="Estado de cotizaciones Fonasa o Isapre(pagadas o no pagadas)"
                                tooltipOptions={{ position: 'bottom' }}
                                placeholder="Selecccione">
                            </Dropdown>
                        </div>
                        <div className="field col-12 md:col-4">
                            <label htmlFor="cotizacionAfp">Cotizaciones AFP</label>
                            <Dropdown
                                id="cotizacionesAfp"
                                value={dropdownItemCotizacionAfp}
                                onChange={(e) => setDropdownItemCotizacionAfp(e.value)}
                                options={dropdownItemsCotizacionAfps}
                                optionLabel="name"
                                tooltip="Estado de cotizaciones AFP(pagadas o no pagadas)"
                                tooltipOptions={{ position: 'bottom' }}
                                placeholder="Selecccione">
                            </Dropdown>
                        </div>
                        <div className="field col-12 md:col-4">
                            <label htmlFor="cotizacionAfc">Cotizaciones AFC</label>
                            <Dropdown
                                id="cotizacionesAfc"
                                value={dropdownItemCotizacionAfc}
                                onChange={(e) => setDropdownItemCotizacionAfc(e.value)}
                                options={dropdownItemsCotizacionAfcs}
                                optionLabel="name"
                                tooltip="Estado de cotizaciones Seguro Cesantía AFC(pagadas o no pagadas)"
                                tooltipOptions={{ position: 'bottom' }}
                                placeholder="Selecccione">
                            </Dropdown>
                        </div>

                        <div className="field col-12 md:col-4">
                            <label htmlFor="vacaciones">Vacaciones</label>
                            <InputNumber
                                value={inputNumberValueVacaciones}
                                onValueChange={(e) =>
                                    setInputNumberValueVacaciones(e.value ?? null)
                                }
                                showButtons
                                tooltip="Meses sin tener vacaciones"
                                tooltipOptions={{ position: 'bottom' }}
                            ></InputNumber>
                        </div>
                        <div className="field col-12 md:col-4">
                            <label htmlFor="fuero">Fuero</label>
                            <Dropdown
                                id="fuero"
                                value={dropdownItemFuero}
                                onChange={(e) => setDropdownItemFuero(e.value)}
                                options={dropdownItemsFueros}
                                optionLabel="name"
                                placeholder="Selecccione">
                            </Dropdown>
                        </div>
                    </div>
                </div>
            </div>
            {/*Inicio Seccion Termino Relacion Laboral*/}
            <div className="col-12">
                <div className="card">
                    <h5>TERMINO RELACION LABORAL</h5>
                    <div className="p-fluid formgrid grid">
                        <div className="field col-12 md:col-4">
                            <label htmlFor="fechaTerminoRelaLaboral">Fecha Término Relación Laboral</label>
                            <Calendar
                                id="fechaTerminoRelaLaboral"
                                showIcon
                                showButtonBar
                                value={calendarValueRTerLab}
                                dateFormat='dd/mm/yy'
                                onChange={(e) => setCalendarValueRTerLab(e.value ?? null)}
                                placeholder='dd/mm/yyyy'
                                locale='es' />
                        </div>
                        <div className="field col-12 md:col-4">
                            <label htmlFor="motivoTermino">Motivo Término</label>
                            <Dropdown
                                id="motivoTermino"
                                value={dropdownItemMotivoTermino}
                                onChange={(e) => setDropdownItemMotivoTermino(e.value)}
                                options={dropdownItemsMotivoTerminos}
                                optionLabel="name"
                                placeholder="Selecccione">
                            </Dropdown>
                        </div>
                        {dropdownItemMotivoTermino?.name === 'Despido' && (
                            <div className="field col-12 md:col-4">
                                <label htmlFor="tipoDespido">Tipo Despido</label>
                                <Dropdown
                                    id="tipoDespido"
                                    value={dropdownItemTipoDespido}
                                    onChange={(e) => setDropdownItemTipoDespido(e.value)}
                                    options={dropdownItemsTipoDespidos}
                                    optionLabel="name"
                                    placeholder="Selecccione">
                                </Dropdown>
                            </div>
                        )}

                        {dropdownItemTipoDespido?.name === 'Disciplinario' && (

                            <div className="field col-12 md:col-4">
                                <label htmlFor="despidoDisciplinario">Despido Disciplinario</label>
                                <Dropdown
                                    id="despidoDisciplinario"
                                    value={dropdownItemDespidoDisciplinario}
                                    onChange={(e) => setDropdownItemDespidoDisciplinario(e.value)}
                                    options={dropdownItemsDespidoDisciplinarios}
                                    optionLabel="name"
                                    placeholder="Selecccione">
                                </Dropdown>
                            </div>
                        )}
                        {dropdownItemDespidoDisciplinario?.name === 'Otros Especificar' && dropdownItemTipoDespido?.name === 'Disciplinario' && (
                            <div className="field col-12 md:col-4">
                                <label htmlFor="otroDespidoDisciplinario">Especificar:</label>
                                <InputText
                                    id="otroDespidoDisciplinario"
                                    type="text"
                                    placeholder='Especificar otra motivo' />
                            </div>
                        )}
                        {dropdownItemTipoDespido?.name === 'Necesidades de la Empresa' && (

                            <div className="field col-12 md:col-4">
                                <label htmlFor="anosServicios">Se pagaron años de Servicios</label>
                                <div className="field-radiobutton">
                                    <RadioButton
                                        inputId="anosServicios"
                                        name="option"
                                        value="Sí"
                                        checked={radioValueAnosServicio === "Sí"}
                                        onChange={(e) => setRadioValueAnosServicio(e.value)}
                                    />
                                    <label htmlFor="anosServicios">Sí</label>
                                </div>
                                <div className="field-radiobutton">
                                    <RadioButton
                                        inputId="anosServicios2"
                                        name="option"
                                        value="No"
                                        checked={radioValueAnosServicio === "No"}
                                        onChange={(e) => setRadioValueAnosServicio(e.value)}
                                    />
                                    <label htmlFor="anosServicios2">No</label>
                                </div>
                            </div>


                        )}
                        {dropdownItemTipoDespido?.name === 'Necesidades de la Empresa' && (

                            <div className="field col-12 md:col-4">
                                <label htmlFor="mesAviso">Se pago mes de aviso</label>
                                <div className="field-radiobutton">
                                    <RadioButton
                                        inputId="mesAviso"
                                        name="option"
                                        value="Sí"
                                        checked={radioValueMesAviso === "Sí"}
                                        onChange={(e) => setRadioValueMesAviso(e.value)}
                                    />
                                    <label htmlFor="mesAviso">Sí</label>
                                </div>
                                <div className="field-radiobutton">
                                    <RadioButton
                                        inputId="mesAviso2"
                                        name="option"
                                        value="No"
                                        checked={radioValueMesAviso === "No"}
                                        onChange={(e) => setRadioValueMesAviso(e.value)}
                                    />
                                    <label htmlFor="mesAviso2">No</label>
                                </div>
                            </div>

                        )}

                        <div className="field col-12 md:col-4">
                            <label htmlFor="finiquito">Finiquito/Entrega Reserva</label>
                            <div className="field-radiobutton">
                                <RadioButton
                                    inputId="finiquito"
                                    name="option"
                                    value="Sí"
                                    checked={radioValueFiniquito === "Sí"}
                                    onChange={(e) => setRadioValueFiniquito(e.value)}
                                />
                                <label htmlFor="finiquito">Sí</label>
                            </div>
                            <div className="field-radiobutton">
                                <RadioButton
                                    inputId="finiquito2"
                                    name="option"
                                    value="No"
                                    checked={radioValueFiniquito === "No"}
                                    onChange={(e) => setRadioValueFiniquito(e.value)}
                                />
                                <label htmlFor="finiquito2">No</label>
                            </div>
                        </div>
                        <div className="field col-12 md:col-4">
                            <label htmlFor="prestacionesAdeudadas">Prestaciones Adeudadas</label>
                            <MultiSelect
                                id="prestacionesAdeudadas"
                                value={dropdownItemPrestacionesAdeudada}  // Ahora es un array
                                onChange={(e) => setDropdownItemPrestacionesAdeudada(e.value)}
                                options={dropdownItemsPrestacionesAdeudadas}
                                optionLabel="name"
                                placeholder="Seleccione"
                                maxSelectedLabels={3}  // Muestra hasta 3 etiquetas seleccionadas
                                className="w-full md:w-20rem"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DemandaPage;
