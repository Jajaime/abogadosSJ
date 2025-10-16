'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Messages } from 'primereact/messages';
import { Calendar } from 'primereact/calendar';
import { Toolbar } from 'primereact/toolbar';
import { DataTable } from 'primereact/datatable';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import { classNames } from 'primereact/utils';
import { Column } from 'primereact/column';
import { RadioButton } from 'primereact/radiobutton';
import { InputNumber } from 'primereact/inputnumber';
import { MultiSelect } from 'primereact/multiselect';
// imports nuevos
import { useRut } from '@/hooks/useRut';
import { apiFetch } from '@/utils/apiClient';

import type { DemandaDTO, DemandadoSolDTO } from '@/types/demanda';
import MesAnoSelector from '@/components/MesAnoSelector';

type DropdownItem = { name: string; code: string };

// --- util: radios
const stringToBoolean = (v: string | null) => v === 'Sí';
const booleanToString = (b: boolean | null | undefined) => (b ? 'Sí' : 'No');

// --- valores por defecto
const emptyDemandadoSol: DemandadoSolDTO = {
  id: undefined,
  nombreRazonSocial: '',
  rut: '',
  domicilio: '',
  representanteLegal: '',
  runRepresentanteLegal: '',
};

const DemandaForm: React.FC = () => {
  const router = useRouter();
  const params = useParams() as { id?: string };
  const demandaId = params?.id;
  const isEdit = Boolean(demandaId);

  const rutCliente = useRut(); // para formData.run
  const rutDemSol = useRut(); // para demandadoSol.rut
  const rutRepLegal = useRut(); // para demandadoSol.runRepresentanteLegal
  const rutEmpresa = useRut(); // 👉 empresa principal

  const toast = useRef<Toast>(null);
  const message = useRef<Messages>(null);
  const dtDemandadoSol = useRef<DataTable<any>>(null);

  // ---- radios (guardan "Sí"/"No" internamente para el control visual)
  const [radioValueRegAsistencia, setRadioValueRegAsistencia] = useState<string | null>(null);
  const [radioValueLiquidacionSueldo, setRadioValueLiquidacionSueldo] = useState<string | null>(null);
  const [radioValueAnosServicio, setRadioValueAnosServicio] = useState<string | null>(null);
  const [radioValueMesAviso, setRadioValueMesAviso] = useState<string | null>(null);
  const [radioValueFiniquito, setRadioValueFiniquito] = useState<string | null>(null);

  // ---- demandado solidario
  const [demandadoSols, setDemandadoSols] = useState<DemandadoSolDTO[]>([]);
  const [demandadoSolDialog, setDemandadoSolDialog] = useState(false);
  const [demandadoSol, setDemandadoSol] = useState<DemandadoSolDTO>(emptyDemandadoSol);
  const [selectedDemandadoSols, setSelectedDemandadoSols] = useState<DemandadoSolDTO[] | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [globalFilter, setGlobalFilter] = useState('');
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  // ---- prestaciones (MultiSelect guarda objetos; enviamos nombres)
  const [dropdownItemPrestacionesAdeudada, setDropdownItemPrestacionesAdeudada] = useState<DropdownItem[]>([]);

  // ---- materias seleccionadas (tu feature de botones; lo mantengo)
  const [generatedButtons, setGeneratedButtons] = useState<DropdownItem[]>([]);

  // ---- form principal
  const [formData, setFormData] = useState<DemandaDTO>({
    // Datos del cliente
    id: 0,
    nombres: '',
    apPaterno: '',
    apMaterno: '',
    run: '',
    fechaNacimiento: '',
    nacionalidad: '',
    correoElectronico: '',
    estadoCivil: '',
    domicilioParticular: '',

    // Demandados solidarios
    demandadoSols: [],

    // Demandado principal
    nombreRazonSocial: '',
    rutRazonSocial: '',
    domicilioRazonSocial: '',
    representanteLegal: '',
    runRepresentanteLegal: '',

    // Relación laboral
    fechaInicioRelacionLaboral: '',
    naturalezaContrato: '',
    funciones: '',
    lugar: '',
    jornada: '',
    otraJornada: '',
    registroAsistencia: false,
    remuneracion: null,
    formaPago: '',
    liquidacionSueldo: false,
    cotizacionSalud: [] as string[], // ahora es string[] (YYYY-MM)
    cotizacionAfp: [] as string[],
    cotizacionAfc: [] as string[],
    vacaciones: null,
    fuero: '',

    // Término relación
    fechaTerminoRelaLaboral: '',
    motivoTermino: '',
    tipoDespido: '',
    despidoDisciplinario: '',
    otroDespidoDisciplinario: '',
    anosServicios: false,
    mesAviso: false,
    finiquito: false,
    prestacionesAdeudadas: [],
    materias: [],
    createdAt: '',
  });

  // 👇 añade setField y years (nuevo)
  const setField = (name: keyof typeof formData, val: any) =>
    setFormData((prev) => ({ ...prev, [name]: val }));

  const years = [2024, 2025, 2026]; // ajusta a tu caso

  // ===================== Opciones de dropdowns =====================
  const dropdownItemsMateria: DropdownItem[] = useMemo(
    () => [
      { name: 'Asignación de colación', code: '1' },
      { name: 'Asignación  de experiencia', code: '2' },
      { name: 'Asignación de locomoción', code: '3' },
      { name: 'Asignación  de pérdida de caja', code: '4' },
      { name: 'Asignación de perfeccionamiento', code: '5' },
      { name: 'Asignación desgaste de herramientas', code: '6' },
      { name: 'Asignación Familia', code: '7' },
      { name: 'Asignación por desempeño en cond. Difíciles', code: '8' },
      { name: 'Asignación por responsabilidad', code: '9' },
      { name: 'Asignación especiales', code: '10' },
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
      { name: 'Art. 2 CT. Sobre actos de discriminación', code: '57' },
      { name: 'Art. 485 inciso 3° CT', code: '58' },
      { name: 'Accidentes del Trabajo y Enfermedades Profesionales', code: '59' },
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
      { name: 'Chilena', code: 'CL' },
      { name: 'Colombiana', code: 'CO' },
      { name: 'Peruana', code: 'PE' },
      { name: 'Venezolana', code: 'VE' },
      // ... (recorta o completa según tus necesidades)
    ],
    []
  );

  const dropdownItemsNatuContratos: DropdownItem[] = useMemo(
    () => [
      { name: 'Indefinido', code: '1' },
      { name: 'Obra o faena', code: '2' },
      { name: 'Plazo fijo', code: '3' },
    ],
    []
  );

  const dropdownItemsFormaPagos: DropdownItem[] = useMemo(
    () => [
      { name: 'Efectivo', code: '1' },
      { name: 'Transferencia', code: '2' },
    ],
    []
  );

  const dropdownItemsFueros: DropdownItem[] = useMemo(
    () => [
      { name: 'Trabajadora Embarazada', code: '1' },
      { name: 'Dirigente Sindical', code: '2' },
      { name: 'Negociación Colectiva Reglada', code: '3' },
      { name: 'Constitución Sindicato', code: '4' },
    ],
    []
  );

  const dropdownItemsMotivoTerminos: DropdownItem[] = useMemo(
    () => [
      { name: 'Renuncia', code: '1' },
      { name: 'Mutuo Acuerdo', code: '2' },
      { name: 'Despido', code: '3' },
      { name: 'Autodespido', code: '4' },
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
      { name: 'otra especificar', code: '7' },
    ],
    []
  );

  const dropdownItemsEstadoCivil: DropdownItem[] = useMemo(
    () => [
      { name: 'Soltero(a)', code: '1' },
      { name: 'Casado(a)', code: '2' },
      { name: 'Conviviente civil', code: '3' },
      { name: 'Separado(a) judicialmente', code: '4' },
      { name: 'Divorciado(a)', code: '5' },
      { name: 'Viudo(a)', code: '6' },
    ],
    []
  );

  const dropdownItemsCotizacionMeses: DropdownItem[] = useMemo(
    () => Array.from({ length: 12 }, (_, i) => 12 - i).map((n) => ({ name: `${n} meses`, code: `${n}` })),
    []
  );

  const dropdownItemsTipoDespidos: DropdownItem[] = useMemo(
    () => [
      { name: 'Disciplinario', code: '1' },
      { name: 'Necesidades de la Empresa', code: '2' },
      { name: 'Sin Causa', code: '3' },
      { name: 'Término de Plazo', code: '4' },
      { name: 'Término de Obra o Faena', code: '5' },
    ],
    []
  );

  const dropdownItemsDespidoDisciplinarios: DropdownItem[] = useMemo(
    () => [
      { name: 'Incumplimiento Grave', code: '1' },
      { name: 'Ausencia Injustificadas', code: '2' },
      { name: 'Acoso Sexual', code: '3' },
      { name: 'Acoso Laboral', code: '4' },
      { name: 'Injurias', code: '5' },
      { name: 'Negociación Incompatible', code: '6' },
      { name: 'Actos o Imprudencia Temeraria', code: '7' },
      { name: 'Abandono de Trabajo', code: '8' },
      { name: 'Falta de Probidad', code: '9' },
      { name: 'Otros Especificar', code: '10' },
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
      { name: 'Otros', code: '9' },
    ],
    []
  );

  // ===================== Cargar datos si es edición =====================
  useEffect(() => {
    const fetchDemanda = async () => {
      if (!isEdit || !demandaId) return;
      try {
        const res = await apiFetch(`/api/demandas/${demandaId}`, { cache: 'no-store' });
        if (!res.ok) throw new Error(`No se pudo cargar la demanda (HTTP ${res.status})`);
        const data: DemandaDTO = await res.json();

        // radios a "Sí"/"No"
        setRadioValueRegAsistencia(booleanToString(data.registroAsistencia));
        setRadioValueLiquidacionSueldo(booleanToString(data.liquidacionSueldo));
        setRadioValueAnosServicio(booleanToString((data as any).pagoAnosServicios ?? data.anosServicios));
        setRadioValueMesAviso(booleanToString((data as any).pagoMesAviso ?? data.mesAviso));
        setRadioValueFiniquito(booleanToString(data.finiquito));

        setDemandadoSols(data.demandadoSols ?? []);

        // MultiSelect desde string[] a items
        const prePrest = (data.prestacionesAdeudadas ?? []).map((n) => {
          const found = dropdownItemsPrestacionesAdeudadas.find((o) => o.name === n);
          return found ?? { name: n, code: n };
        });
        setDropdownItemPrestacionesAdeudada(prePrest);

        // al recibir data.materias: string[]
        setGeneratedButtons(
          (data.materias ?? []).map((n) => {
            const found = dropdownItemsMateria.find((o) => o.name === n);
            return found ?? { name: n, code: n }; // fallback por si no está en catálogo
          })
        );

        // Inicializa el hook del RUT cliente con lo traído
        rutCliente.setValue(data.run || '');
        rutEmpresa.setValue(data.rutRazonSocial || '');
        setFormData({
          ...data,
          fechaNacimiento: data.fechaNacimiento || '',
          fechaInicioRelacionLaboral: data.fechaInicioRelacionLaboral || '',
          fechaTerminoRelaLaboral: data.fechaTerminoRelaLaboral || '',
          // 👇 asegura que sean arrays de YYYY-MM
          cotizacionSalud: Array.isArray((data as any).cotizacionSalud) ? (data as any).cotizacionSalud : [],
          cotizacionAfp:   Array.isArray((data as any).cotizacionAfp)   ? (data as any).cotizacionAfp   : [],
          cotizacionAfc:   Array.isArray((data as any).cotizacionAfc)   ? (data as any).cotizacionAfc   : [],
        });
      } catch (e: any) {
        toast.current?.show({ severity: 'error', summary: 'Error', detail: e?.message || 'No se pudo cargar', life: 5000 });
      }
    };
    fetchDemanda();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, demandaId]);

  // 3) Mantén formData.run en sync con el hook del cliente
  useEffect(() => {
    setFormData((prev) => ({ ...prev, run: rutCliente.value }));
  }, [rutCliente.value]);

  useEffect(() => {
    setFormData((prev) => ({ ...prev, rutRazonSocial: rutEmpresa.value }));
  }, [rutEmpresa.value]);

  // 4) Al abrir/cargar el diálogo de demandado solidario, sincroniza hooks de RUT
  useEffect(() => {
    if (demandadoSolDialog) {
      rutDemSol.setValue(demandadoSol.rut || '');
      rutRepLegal.setValue(demandadoSol.runRepresentanteLegal || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demandadoSolDialog]);

  useEffect(() => {
    if (formData.motivoTermino !== 'Despido' && (formData.tipoDespido || formData.despidoDisciplinario || formData.otroDespidoDisciplinario)) {
      setFormData((prev) => ({
        ...prev,
        tipoDespido: '',
        despidoDisciplinario: '',
        otroDespidoDisciplinario: ''
      }));
      setRadioValueAnosServicio(null);
      setRadioValueMesAviso(null);
    }
  }, [formData.motivoTermino,formData.tipoDespido, formData.despidoDisciplinario, formData.otroDespidoDisciplinario]);

  useEffect(() => {
    if (formData.tipoDespido !== 'Disciplinario' && (formData.despidoDisciplinario || formData.otroDespidoDisciplinario)) {
      setFormData((prev) => ({ ...prev, despidoDisciplinario: '', otroDespidoDisciplinario: '' }));
    }
    if (formData.tipoDespido !== 'Necesidades de la Empresa' && (radioValueAnosServicio || radioValueMesAviso)) {
      setRadioValueAnosServicio(null);
      setRadioValueMesAviso(null);
      setFormData((prev) => ({ ...prev, anosServicios: false, mesAviso: false }));
    }
  }, [formData.tipoDespido, formData.despidoDisciplinario, formData.otroDespidoDisciplinario, radioValueAnosServicio, radioValueMesAviso]);

  // ===================== Handlers =====================
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement> | { target: { name: string; value: any } }
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      let next = { ...prev, [name]: value };

      // ——— Dependencias de "motivoTermino"
      if (name === 'motivoTermino') {
        if (value !== 'Despido') {
          // Oculta y limpia cascada de "despido"
          next.tipoDespido = '';
          next.despidoDisciplinario = '';
          next.otroDespidoDisciplinario = '';
          // además limpia radios asociados a "Necesidades de la Empresa"
          next.anosServicios = false;
          next.mesAviso = false;
          // limpia estados visuales de radios
          setRadioValueAnosServicio(null);
          setRadioValueMesAviso(null);
        }
      }

      // ——— Dependencias de "tipoDespido"
      if (name === 'tipoDespido') {
        // Si NO es Disciplinario, limpia sub-motivo y "otros"
        if (value !== 'Disciplinario') {
          next.despidoDisciplinario = '';
          next.otroDespidoDisciplinario = '';
        }
        // Si NO es Necesidades de la Empresa, limpia radios
        if (value !== 'Necesidades de la Empresa') {
          next.anosServicios = false;
          next.mesAviso = false;
          setRadioValueAnosServicio(null);
          setRadioValueMesAviso(null);
        }
      }

      // ——— Dependencias de "despidoDisciplinario"
      if (name === 'despidoDisciplinario') {
        if (value !== 'Otros Especificar') {
          next.otroDespidoDisciplinario = '';
        }
      }

      // ——— Dependencias de "jornada"
      if (name === 'jornada') {
        if (value !== 'otra especificar') {
          next.otraJornada = '';
        }
      }

      return next;
    });
  };

  const resetAll = () => {
    setFormData((prev) => ({
      ...prev,
      // cliente
      nombres: '',
      apPaterno: '',
      apMaterno: '',
      run: '',
      fechaNacimiento: '',
      nacionalidad: '',
      correoElectronico: '',
      estadoCivil: '',
      domicilioParticular: '',
      // demandados
      demandadoSols: [],
      // principal
      nombreRazonSocial: '',
      rutRazonSocial: '',
      domicilioRazonSocial: '',
      representanteLegal: '',
      runRepresentanteLegal: '',
      // relación laboral
      fechaInicioRelacionLaboral: '',
      naturalezaContrato: '',
      funciones: '',
      lugar: '',
      jornada: '',
      otraJornada: '',
      registroAsistencia: false,
      remuneracion: null,
      formaPago: '',
      liquidacionSueldo: false,
      cotizacionSalud: [],
      cotizacionAfp: [],
      cotizacionAfc: [],
      vacaciones: null,
      fuero: '',
      // término
      fechaTerminoRelaLaboral: '',
      motivoTermino: '',
      tipoDespido: '',
      despidoDisciplinario: '',
      otroDespidoDisciplinario: '',
      anosServicios: false,
      mesAviso: false,
      finiquito: false,
      prestacionesAdeudadas: [],
      materias: [],
    }));
    // reset radios y listas
    setRadioValueRegAsistencia(null);
    setRadioValueLiquidacionSueldo(null);
    setRadioValueAnosServicio(null);
    setRadioValueMesAviso(null);
    setRadioValueFiniquito(null);
    setDemandadoSols([]);
    setDropdownItemPrestacionesAdeudada([]);
  };

  // ===================== Submit (crear/editar) =====================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    // --- VALIDACIÓN CONDICIONAL (se mantiene igual)
    const missing: string[] = [];

    // helper corto
    const req = (value: any, label: string) => {
      const empty =
        value === null ||
        value === undefined ||
        (typeof value === 'string' && value.trim() === '') ||
        (typeof value === 'number' && Number.isNaN(value));
      if (empty) missing.push(label);
    };

    // ===== Campos base =====
    req(formData.nombres, 'Nombres');
    req(formData.apPaterno, 'Apellido paterno');
    req(formData.apMaterno, 'Apellido materno');
    req(formData.run, 'RUT/Documento');
    req(formData.fechaNacimiento, 'Fecha de nacimiento');
    req(formData.nacionalidad, 'Nacionalidad');
    req(formData.correoElectronico, 'Correo electrónico');
    req(formData.estadoCivil, 'Estado civil');
    req(formData.domicilioParticular, 'Domicilio particular');

    req(formData.nombreRazonSocial, 'Razón social (empleador)');
    req(formData.rutRazonSocial, 'RUT empresa');
    req(formData.domicilioRazonSocial, 'Domicilio empleador');

    req(formData.fechaInicioRelacionLaboral, 'Fecha inicio relación');
    req(formData.naturalezaContrato, 'Naturaleza del contrato');
    req(formData.funciones, 'Funciones');
    req(formData.lugar, 'Lugar de trabajo');
    req(formData.jornada, 'Jornada');

    // radios relación laboral
    if (radioValueRegAsistencia == null) missing.push('Registro de asistencia (Sí/No)');
    req(formData.remuneracion, 'Remuneración');
    req(formData.formaPago, 'Forma de pago');
    if (radioValueLiquidacionSueldo == null) missing.push('Liquidaciones de sueldo (Sí/No)');

    req(formData.cotizacionSalud, 'Cotizaciones Salud');
    req(formData.cotizacionAfp, 'Cotizaciones AFP');
    req(formData.cotizacionAfc, 'Cotizaciones AFC');
    req(formData.vacaciones, 'Vacaciones (meses)');
    req(formData.fuero, 'Fuero');

    req(formData.fechaTerminoRelaLaboral, 'Fecha término relación');
    req(formData.motivoTermino, 'Motivo de término');

    // ===== Condicional: Jornada "otra especificar" =====
    if (formData.jornada === 'otra especificar') {
      req(formData.otraJornada, 'Especificar jornada');
    }

    // ===== Condicional: Motivo = "Despido" =====
    if (formData.motivoTermino === 'Despido') {
      req(formData.tipoDespido, 'Tipo de despido');

      // Subcondicional: Disciplinario
      if (formData.tipoDespido === 'Disciplinario') {
        req(formData.despidoDisciplinario, 'Causal disciplinaria');
        if (formData.despidoDisciplinario === 'Otros Especificar') {
          req(formData.otroDespidoDisciplinario, 'Detalle "Otros Especificar"');
        }
      }

      // Subcondicional: Necesidades de la Empresa → radios obligatorios
      if (formData.tipoDespido === 'Necesidades de la Empresa') {
        if (radioValueAnosServicio == null) missing.push('¿Se pagaron años de servicio? (Sí/No)');
        if (radioValueMesAviso == null) missing.push('¿Se pagó mes de aviso? (Sí/No)');
      }
    }

    // ===== Radio de finiquito (siempre lo pides) =====
    if (radioValueFiniquito == null) missing.push('Finiquito/Reserva (Sí/No)');

    // Si hay faltantes, los mostramos y salimos
    if (missing.length) {
      setMissingFields(missing);
      toast.current?.show({
        severity: 'warn',
        summary: 'Validación',
        detail: `Faltan: ${missing.join(' · ')}`,
        life: 5000,
      });
      return;
    } else {
      setMissingFields([]);
    }

    const prestacionesNombres = dropdownItemPrestacionesAdeudada.map((i) => i.name);
    const materiasNombres = generatedButtons.map((b) => b.name);

    const payload: DemandaDTO = {
      ...formData,
      run: rutCliente.value,
      rutRazonSocial: rutEmpresa.value,
      // fechas a ISO si hay valor Date
      fechaNacimiento:
        formData.fechaNacimiento instanceof Date ? (formData.fechaNacimiento as any as Date).toISOString() : formData.fechaNacimiento || '',
      fechaInicioRelacionLaboral:
        formData.fechaInicioRelacionLaboral instanceof Date ? (formData.fechaInicioRelacionLaboral as any as Date).toISOString() : formData.fechaInicioRelacionLaboral || '',
      fechaTerminoRelaLaboral:
        formData.fechaTerminoRelaLaboral instanceof Date ? (formData.fechaTerminoRelaLaboral as any as Date).toISOString() : formData.fechaTerminoRelaLaboral || '',

      demandadoSols,
      // radios → boolean
      registroAsistencia: stringToBoolean(radioValueRegAsistencia),
      liquidacionSueldo: stringToBoolean(radioValueLiquidacionSueldo),
      anosServicios: stringToBoolean(radioValueAnosServicio),
      mesAviso: stringToBoolean(radioValueMesAviso),
      finiquito: stringToBoolean(radioValueFiniquito),

      prestacionesAdeudadas: prestacionesNombres,
      materias: materiasNombres,
    };

    try {
      const endpoint = isEdit ? `/api/demandas/${demandaId}` : '/api/demandas';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await apiFetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const t = await res.text().catch(() => '');
        throw new Error(t || `Error al ${isEdit ? 'actualizar' : 'registrar'} demanda`);
      }

      toast.current?.show({
        severity: 'success',
        summary: 'Éxito',
        detail: isEdit ? 'Demanda actualizada' : 'Demanda registrada',
        life: 5000,
      });
      const flash = {
        severity: 'success',
        summary: 'Éxito',
        detail: isEdit ? 'Demanda actualizada' : 'Demanda registrada',
        life: 4000,
      };

      resetAll();
      sessionStorage.setItem('flashToast', JSON.stringify(flash));
      setTimeout(() => router.push('/pages/demanda'), 1600);
    } catch (e: any) {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: e?.message || 'Ocurrió un error', life: 5000 });
    }
  };

  // ===================== Materias (botones) =====================
  const addErrorMessage = () => {
    message.current?.show({ severity: 'error', content: 'Esta materia ya ha sido agregada.' });
  };

  const handleAddButton = (item?: DropdownItem) => {
    const current = item ?? null;
    if (!current) return;
    const exists = generatedButtons.some((b) => b.code === current.code);
    if (exists) return addErrorMessage(); // 👉 aquí se lanza el error
    setGeneratedButtons((prev) => [...prev, { name: current.name, code: current.code }]);
  };

  const handleRemoveButton = (code: string) => {
    setGeneratedButtons((prev) => prev.filter((b) => b.code !== code));
  };

  // ===================== Demandado solidario edición/eliminación) =====================
  const editSelectedDemandadoSol = () => {
    if (selectedDemandadoSols?.length === 1) {
      setDemandadoSol(selectedDemandadoSols[0]); // carga el seleccionado al diálogo
      setSubmitted(false);
      setDemandadoSolDialog(true);
    }
  };

  const confirmDeleteSelected = () => {
    if ((selectedDemandadoSols?.length ?? 0) > 0) setDeleteDialog(true);
  };

  const deleteSelectedDemandadoSols = () => {
    setDemandadoSols((prev) => prev.filter((d) => !selectedDemandadoSols?.some((s) => s.id === d.id)));
    setSelectedDemandadoSols(null);
    setDeleteDialog(false);
    toast.current?.show({ severity: 'success', summary: 'Eliminado', detail: 'Demandado(s) eliminado(s)', life: 2500 });
  };

  // ===================== Demandado solidario =====================
  const hideDialog = () => {
    setSubmitted(false);
    setDemandadoSolDialog(false);
  };

  const saveDemandadoSol = () => {
    setSubmitted(true);

    // usa los valores del hook al momento de guardar
    const obj: DemandadoSolDTO = {
      ...demandadoSol,
      rut: rutDemSol.value || '',
      runRepresentanteLegal: rutRepLegal.value || '',
    };

    if (obj.nombreRazonSocial?.trim() && obj.rut?.trim() && obj.domicilio?.trim()) {
      const list = [...demandadoSols];

      if (!obj.id) {
        obj.id = crypto.randomUUID();
        list.push(obj);
        toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Demandado Creado', life: 3000 });
      } else {
        const index = list.findIndex((d) => d.id === obj.id);
        if (index !== -1) {
          list[index] = obj;
          toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Demandado Actualizado', life: 3000 });
        }
      }

      setDemandadoSols(list);
      setDemandadoSolDialog(false);
      setDemandadoSol(emptyDemandadoSol);
    }
  };

  const nombreBodyTemplate = (row: DemandadoSolDTO) => <>{row.nombreRazonSocial}</>;
  const rutBodyTemplate = (row: DemandadoSolDTO) => <>{row.rut}</>;
  const domicilioBodyTemplate = (row: DemandadoSolDTO) => <>{row.domicilio}</>;
  const representanteLegalBodyTemplate = (row: DemandadoSolDTO) => <>{row.representanteLegal}</>;
  const rutRepresentanteLegalBodyTemplate = (row: DemandadoSolDTO) => <>{row.runRepresentanteLegal}</>;

  const toolbarLeftTemplate = () => {
    const canEdit = (selectedDemandadoSols?.length ?? 0) === 1;
    const canDelete = (selectedDemandadoSols?.length ?? 0) > 0;

    return (
      <>
        <Button
          label="Agregar"
          icon="pi pi-plus"
          onClick={() => {
            setDemandadoSol({ ...emptyDemandadoSol }); // asegúrate de que id venga vacío para crear
            setSubmitted(false);
            setDemandadoSolDialog(true);
          }}
          style={{ marginRight: '.5em' }}
        />
        <Button label="Editar" icon="pi pi-pencil" severity="warning" onClick={editSelectedDemandadoSol} disabled={!canEdit} style={{ marginRight: '.5em' }} />
        <Button label="Eliminar" icon="pi pi-trash" severity="danger" onClick={confirmDeleteSelected} disabled={!canDelete} style={{ marginRight: '.5em' }} />
      </>
    );
  };

  // ===================== Render =====================
  return (
    <div className="grid">
      <Toast ref={toast} />

      <div className="col-12">
        <div className="card">
          <h5>{isEdit ? 'EDITAR DEMANDA' : 'DATOS CLIENTE (NUEVA DEMANDA)'}</h5>
          <form onSubmit={handleSubmit} className="p-fluid formgrid grid">
            <div className="p-fluid formgrid grid">
              <div className="field col-12 md:col-4">
                <label htmlFor="nombres">Nombres</label>
                <InputText
                  id="nombres"
                  value={formData.nombres}
                  onChange={(e) => handleChange({ target: { name: 'nombres', value: e.target.value } })}
                  className={classNames({ 'p-invalid': submitted && !formData.nombres })}
                  required
                  placeholder="Ingrese los nombres"
                />
                {submitted && !formData.nombres && <small className="p-invalid">Nombres es requerido.</small>}
              </div>

              <div className="field col-12 md:col-4">
                <label htmlFor="apPaterno">Apellido Paterno</label>
                <InputText
                  id="apPaterno"
                  value={formData.apPaterno} 
                  onChange={(e) => handleChange({ target: { name: 'apPaterno', value: e.target.value } })} 
                  placeholder="Ingrese apellido paterno"
                  className={classNames({ 'p-invalid': missingFields.includes('Apellido paterno') })} 
                />
                {missingFields.includes('Apellido paterno') && <small className="p-invalid">Apellido Paterno es requerido.</small>}
              </div>

              <div className="field col-12 md:col-4">
                <label htmlFor="apMaterno">Apellido Materno</label>
                <InputText
                 id="apMaterno" 
                 value={formData.apMaterno} 
                 onChange={(e) => handleChange({ target: { name: 'apMaterno', value: e.target.value } })} 
                 placeholder="Ingrese apellido materno" />
              </div>

              <div className="field col-12 md:col-4">
                <label htmlFor="run">Rut/Pasaporte/Cédula</label>
                <InputText id="run" value={rutCliente.value} onChange={(e) => rutCliente.onChange(e.target.value)} placeholder="Ingrese Rut/Pasaporte/Cédula" className={classNames({ 'p-invalid': !!rutCliente.error })} />
                {rutCliente.error && <small className="p-error">{rutCliente.error}</small>}
                {!rutCliente.error && rutCliente.hint && <small className="p-helper">{rutCliente.hint}</small>}
              </div>

              <div className="field col-12 md:col-4">
                <label htmlFor="domicilioParticular">Domicilio</label>
                <InputText id="domicilioParticular" value={formData.domicilioParticular} onChange={(e) => handleChange({ target: { name: 'domicilioParticular', value: e.target.value } })} placeholder="Domicilio" />
              </div>

              <div className="field col-12 md:col-4">
                <label htmlFor="nacionalidad">Nacionalidad</label>
                <Dropdown
                  id="nacionalidad"
                  value={formData.nacionalidad}
                  onChange={(e) => handleChange({ target: { name: 'nacionalidad', value: e.value } })}
                  options={dropdownItemsNacionalidades}
                  optionLabel="name"
                  optionValue="name"
                  placeholder="Seleccione Nacionalidad"
                  filter
                />
              </div>

              <div className="field col-12 md:col-4">
                <label htmlFor="estadoCivil">Estado Civil</label>
                <Dropdown
                  id="estadoCivil"
                  value={formData.estadoCivil}
                  onChange={(e) => handleChange({ target: { name: 'estadoCivil', value: e.value } })}
                  options={dropdownItemsEstadoCivil}
                  optionLabel="name"
                  optionValue="name"
                  placeholder="Seleccione Estado Civil"
                />
              </div>

              <div className="field col-12 md:col-4">
                <label htmlFor="nacimiento">Fecha de Nacimiento</label>
                <Calendar
                  id="nacimiento"
                  showIcon
                  showButtonBar
                  value={formData.fechaNacimiento ? new Date(formData.fechaNacimiento) : null}
                  dateFormat="dd/mm/yy"
                  onChange={(e) => handleChange({ target: { name: 'fechaNacimiento', value: e.value ?? null } })}
                  placeholder="dd/mm/yyyy"
                  locale="es"
                />
              </div>

              <div className="field col-12 md:col-4">
                <label htmlFor="email">Correo Electrónico</label>
                <InputText id="email" value={formData.correoElectronico} onChange={(e) => handleChange({ target: { name: 'correoElectronico', value: e.target.value } })} placeholder="ejemplo@direccion.cl" />
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* DEMANDADO PRINCIPAL */}
      <div className="col-12">
        <div className="card">
          <h5>DATOS DEMANDADO PRINCIPAL</h5>
          <div className="p-fluid formgrid grid">
            <div className="field col-12 md:col-4">
              <label htmlFor="nombreRazonSocial">Nombre Razón Social de Empresa</label>
              <InputText
                id="nombreRazonSocial"
                value={formData.nombreRazonSocial}
                onChange={(e) => handleChange({ target: { name: 'nombreRazonSocial', value: e.target.value } })}
                placeholder="Ingrese el Nombre Razón Social de Empresa"
              />
            </div>

            <div className="field col-12 md:col-4">
              <label htmlFor="rutRazonSocial">RUT Empresa</label>
              <InputText id="rutRazonSocial" value={rutEmpresa.value} onChange={(e) => rutEmpresa.onChange(e.target.value)} placeholder="Ingrese RUT de la empresa" className={classNames({ 'p-invalid': !!rutEmpresa.error })} />
              {rutEmpresa.error && <small className="p-error">{rutEmpresa.error}</small>}
              {!rutEmpresa.error && rutEmpresa.hint && <small className="p-helper">{rutEmpresa.hint}</small>}
            </div>

            <div className="field col-12 md:col-4">
              <label htmlFor="domicilioRazonSocial">Domicilio</label>
              <InputText id="domicilioRazonSocial" value={formData.domicilioRazonSocial} onChange={(e) => handleChange({ target: { name: 'domicilioRazonSocial', value: e.target.value } })} placeholder="Ingrese domicilio" />
            </div>
          </div>
        </div>
      </div>

      {/* DEMANDADOS SOLIDARIOS */}
      <div className="col-12">
        <div className="card">
          <h5>DEMANDADO SOLIDARIO</h5>

          <Toolbar start={toolbarLeftTemplate}></Toolbar>

          <DataTable
            ref={dtDemandadoSol}
            value={demandadoSols}
            selection={selectedDemandadoSols as any}
            onSelectionChange={(e) => setSelectedDemandadoSols(e.value as DemandadoSolDTO[])}
            dataKey="id"
            rows={10}
            rowsPerPageOptions={[5, 10, 25]}
            className="datatable-responsive"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            currentPageReportTemplate="Mostrando {first} del {last} de {totalRecords} registros"
            globalFilter={globalFilter}
            emptyMessage="No se encontraron Registros."
            responsiveLayout="scroll"
            filterLocale="es"
            paginator
            onRowDoubleClick={(e) => {
              const row = e.data as DemandadoSolDTO;
              setDemandadoSol(row);
              setSubmitted(false);
              setDemandadoSolDialog(true);
            }}
          >
            <Column selectionMode="multiple" headerStyle={{ width: '4rem' }}></Column>
            <Column header="Razón Social" body={nombreBodyTemplate} headerStyle={{ minWidth: '15rem' }}></Column>
            <Column header="RUT" body={rutBodyTemplate} headerStyle={{ minWidth: '10rem' }}></Column>
            <Column header="Domicilio" body={domicilioBodyTemplate} headerStyle={{ minWidth: '15rem' }}></Column>
            <Column header="Representante Legal" body={representanteLegalBodyTemplate} headerStyle={{ minWidth: '15rem' }}></Column>
            <Column header="Rut Representante Legal" body={rutRepresentanteLegalBodyTemplate} headerStyle={{ minWidth: '15rem' }}></Column>
          </DataTable>

          <Dialog
            visible={demandadoSolDialog}
            style={{ width: '500px' }}
            header="Demandado Solidario"
            modal
            className="p-fluid"
            onHide={hideDialog}
            footer={
              <>
                <Button label="Cancelar" icon="pi pi-times" text onClick={hideDialog} />
                <Button label="Guardar" icon="pi pi-check" text onClick={saveDemandadoSol} />
              </>
            }
          >
            <div className="field">
              <label htmlFor="nombreDemandadoSol">Nombre Razón Social</label>
              <InputText
                id="nombreDemandadoSol"
                value={demandadoSol.nombreRazonSocial}
                onChange={(e) => setDemandadoSol((p) => ({ ...p, nombreRazonSocial: e.target.value }))}
                required
                placeholder="Ingrese nombre de la Razón Social"
                autoFocus
                className={classNames({ 'p-invalid': submitted && !demandadoSol.nombreRazonSocial })}
              />
              {submitted && !demandadoSol.nombreRazonSocial && <small className="p-invalid">Nombre es requerido.</small>}
            </div>
            <div className="field">
              <label htmlFor="rutDemandadoSol">RUT</label>
              <InputText
                id="rutDemandadoSol"
                value={rutDemSol.value}
                onChange={(e) => rutDemSol.onChange(e.target.value)}
                required
                placeholder="Ingrese Rut de la Razón Social"
                className={classNames({ 'p-invalid': (submitted && !rutDemSol.value) || !!rutDemSol.error })}
              />
              {rutDemSol.error && <small className="p-error">{rutDemSol.error}</small>}
            </div>
            <div className="field">
              <label htmlFor="domicilioDemandadoSol">Domicilio</label>
              <InputText
                id="domicilioDemandadoSol"
                value={demandadoSol.domicilio}
                onChange={(e) => setDemandadoSol((p) => ({ ...p, domicilio: e.target.value }))}
                required
                placeholder="Ingrese domicilio de la Razón Social"
                className={classNames({ 'p-invalid': submitted && !demandadoSol.domicilio })}
              />
              {submitted && !demandadoSol.domicilio && <small className="p-invalid">Domicilio es requerido.</small>}
            </div>
            <div className="field">
              <label htmlFor="representanteLegalDemandadoSol">Representante Legal</label>
              <InputText
                id="representanteLegalDemandadoSol"
                value={demandadoSol.representanteLegal}
                onChange={(e) => setDemandadoSol((p) => ({ ...p, representanteLegal: e.target.value }))}
                required
                placeholder="Ingrese nombre del representante legal"
                className={classNames({ 'p-invalid': submitted && !demandadoSol.representanteLegal })}
              />
              {submitted && !demandadoSol.representanteLegal && <small className="p-invalid">Representante Legal es requerido.</small>}
            </div>
            <div className="field">
              <label htmlFor="runRepresentanteLegalDemandadoSol">Rut Representante Legal</label>
              <InputText
                id="runRepresentanteLegalDemandadoSol"
                value={rutRepLegal.value}
                onChange={(e) => rutRepLegal.onChange(e.target.value)}
                required
                placeholder="Ingrese Rut del representante legal"
                className={classNames({ 'p-invalid': (submitted && !rutRepLegal.value) || !!rutRepLegal.error })}
              />
              {rutRepLegal.error && <small className="p-error">{rutRepLegal.error}</small>}
            </div>
          </Dialog>
          <Dialog
            visible={deleteDialog}
            style={{ width: '420px' }}
            header="Confirmar eliminación"
            modal
            onHide={() => setDeleteDialog(false)}
            footer={
              <>
                <Button label="Cancelar" icon="pi pi-times" text onClick={() => setDeleteDialog(false)} />
                <Button label="Eliminar" icon="pi pi-trash" severity="danger" text onClick={deleteSelectedDemandadoSols} />
              </>
            }
          >
            <p>¿Seguro que deseas eliminar el/los Demandado(s) Solidario(s) seleccionado(s)?</p>
          </Dialog>
        </div>
      </div>

      {/* RELACIÓN LABORAL */}
      <div className="col-12">
        <div className="card">
          <h5>RELACIÓN LABORAL</h5>
          <div className="p-fluid formgrid grid">
            <div className="field col-12 md:col-4">
              <label htmlFor="fechaInicioRelacionLaboral">Fecha Inicio Relación Laboral</label>
              <Calendar
                id="fechaInicioRelacionLaboral"
                showIcon
                showButtonBar
                value={formData.fechaInicioRelacionLaboral ? new Date(formData.fechaInicioRelacionLaboral) : null}
                dateFormat="dd/mm/yy"
                onChange={(e) => handleChange({ target: { name: 'fechaInicioRelacionLaboral', value: e.value ?? null } })}
                placeholder="dd/mm/yyyy"
                locale="es"
              />
            </div>

            <div className="field col-12 md:col-4">
              <label htmlFor="naturalezaContrato">Naturaleza del Contrato</label>
              <Dropdown
                id="naturalezaContrato"
                value={formData.naturalezaContrato}
                onChange={(e) => handleChange({ target: { name: 'naturalezaContrato', value: e.value } })}
                options={dropdownItemsNatuContratos}
                optionLabel="name"
                optionValue="name"
                placeholder="Seleccione"
              />
            </div>

            <div className="field col-12 md:col-4">
              <label htmlFor="lugar">Lugar</label>
              <InputText id="lugar" value={formData.lugar} onChange={(e) => handleChange({ target: { name: 'lugar', value: e.target.value } })} placeholder="Domicilio dónde trabajó" />
            </div>

            <div className="field col-12 md:col-12">
              <label htmlFor="funciones">Funciones</label>
              <InputTextarea id="funciones" value={formData.funciones} onChange={(e) => handleChange({ target: { name: 'funciones', value: e.target.value } })} placeholder="Ingrese sus funciones" rows={5} cols={30} />
            </div>

            <div className="field col-12 md:col-4">
              <label htmlFor="jornada">Jornada</label>
              <Dropdown
                id="jornada"
                value={formData.jornada}
                onChange={(e) => handleChange({ target: { name: 'jornada', value: e.value } })}
                options={dropdownItemsJornadaLabs}
                optionLabel="name"
                optionValue="name"
                placeholder="Seleccione"
              />
            </div>

            {formData.jornada === 'otra especificar' && (
              <div className="field col-12 md:col-4">
                <label htmlFor="otraJornada">Especificar:</label>
                <InputText id="otraJornada" value={formData.otraJornada ?? ''} onChange={(e) => handleChange({ target: { name: 'otraJornada', value: e.target.value || null } })} placeholder="Especificar otra jornada" />
              </div>
            )}

            <div className="field col-12 md:col-4">
              <label htmlFor="regAsistencia">Registro de Asistencia</label>
              <div className="field-radiobutton">
                <RadioButton inputId="regAsistencia" name="regAsistencia" value="Sí" checked={radioValueRegAsistencia === 'Sí'} onChange={(e) => setRadioValueRegAsistencia(e.value)} />
                <label htmlFor="regAsistencia">Sí</label>
              </div>
              <div className="field-radiobutton">
                <RadioButton inputId="regAsistencia2" name="regAsistencia" value="No" checked={radioValueRegAsistencia === 'No'} onChange={(e) => setRadioValueRegAsistencia(e.value)} />
                <label htmlFor="regAsistencia2">No</label>
              </div>
            </div>

            <div className="field col-12 md:col-4">
              <label htmlFor="remuneracion">Remuneración</label>
              <InputNumber id="remuneracion" mode="decimal" placeholder="especificar monto" value={formData.remuneracion} onValueChange={(e) => handleChange({ target: { name: 'remuneracion', value: e.value ?? null } })} />
            </div>

            <div className="field col-12 md:col-4">
              <label htmlFor="formaPago">Forma de Pago</label>
              <Dropdown
                id="formaPago"
                value={formData.formaPago}
                onChange={(e) => handleChange({ target: { name: 'formaPago', value: e.value } })}
                options={dropdownItemsFormaPagos}
                optionLabel="name"
                optionValue="name"
                placeholder="Seleccione"
              />
            </div>

            <div className="field col-12 md:col-4">
              <label htmlFor="liquidacionSueldo">Liquidaciones de Sueldo</label>
              <div className="field-radiobutton">
                <RadioButton inputId="liquidacionSueldo" name="liquidacionSueldo" value="Sí" checked={radioValueLiquidacionSueldo === 'Sí'} onChange={(e) => setRadioValueLiquidacionSueldo(e.value)} />
                <label htmlFor="liquidacionSueldo">Sí</label>
              </div>
              <div className="field-radiobutton">
                <RadioButton inputId="liquidacionSueldo2" name="liquidacionSueldo" value="No" checked={radioValueLiquidacionSueldo === 'No'} onChange={(e) => setRadioValueLiquidacionSueldo(e.value)} />
                <label htmlFor="liquidacionSueldo2">No</label>
              </div>
            </div>

            {/* ====== NUEVOS SELECTORES DE MESES/AÑO ====== */}
            <div className="field col-12">
              <label className="mb-2 block">Cotizaciones de Salud (meses impagos)</label>
              <MesAnoSelector
                label="Cotizaciones de Salud (meses impagos)"
                value={formData.cotizacionSalud}
                onChange={(v: string[]) => setField('cotizacionSalud', v)}
                years={years}
              />
            </div>

            <div className="field col-12">
              <label className="mb-2 block">Cotizaciones AFP (meses impagos)</label>
              <MesAnoSelector
                label="Cotizaciones AFP (meses impagos)"
                value={formData.cotizacionAfp}
                onChange={(v: string[]) => setField('cotizacionAfp', v)}
                years={years}
              />
            </div>

            <div className="field col-12">
              <label className="mb-2 block">Cotizaciones AFC (meses impagos)</label>
              <MesAnoSelector
                label="Cotizaciones AFC (meses impagos)"
                value={formData.cotizacionAfc}
                onChange={(v: string[]) => setField('cotizacionAfc', v)}
                years={years}
              />
            </div>
            {/* ====== /NUEVOS SELECTORES ====== */}

            <div className="field col-12 md:col-4">
              <label htmlFor="vacaciones">Vacaciones</label>
              <InputNumber
                id="vacaciones"
                value={formData.vacaciones}
                onValueChange={(e) => handleChange({ target: { name: 'vacaciones', value: e.value ?? null } })}
                showButtons
                tooltip="Meses sin tener vacaciones"
                tooltipOptions={{ position: 'bottom' }}
              />
            </div>

            <div className="field col-12 md:col-4">
              <label htmlFor="fuero">Fuero</label>
              <Dropdown id="fuero" value={formData.fuero} onChange={(e) => handleChange({ target: { name: 'fuero', value: e.value } })} options={dropdownItemsFueros} optionLabel="name" optionValue="name" placeholder="Seleccione" />
            </div>
          </div>
        </div>
      </div>

      {/* TÉRMINO RELACIÓN LABORAL */}
      <div className="col-12">
        <div className="card">
          <h5>TÉRMINO RELACIÓN LABORAL</h5>
          <div className="p-fluid formgrid grid">
            <div className="field col-12 md:col-4">
              <label htmlFor="fechaTerminoRelaLaboral">Fecha Término Relación Laboral</label>
              <Calendar
                id="fechaTerminoRelaLaboral"
                showIcon
                showButtonBar
                value={formData.fechaTerminoRelaLaboral ? new Date(formData.fechaTerminoRelaLaboral) : null}
                dateFormat="dd/mm/yy"
                onChange={(e) => handleChange({ target: { name: 'fechaTerminoRelaLaboral', value: e.value ?? null } })}
                placeholder="dd/mm/yyyy"
                locale="es"
              />
            </div>

            <div className="field col-12 md:col-4">
              <label htmlFor="motivoTermino">Motivo Término</label>
              <Dropdown
                id="motivoTermino"
                value={formData.motivoTermino}
                onChange={(e) => handleChange({ target: { name: 'motivoTermino', value: e.value } })}
                options={dropdownItemsMotivoTerminos}
                optionLabel="name"
                optionValue="name"
                placeholder="Seleccione"
              />
            </div>

            {formData.motivoTermino === 'Despido' && (
              <div className="field col-12 md:col-4">
                <label htmlFor="tipoDespido">Tipo Despido</label>
                <Dropdown
                  id="tipoDespido"
                  value={formData.tipoDespido}
                  onChange={(e) => handleChange({ target: { name: 'tipoDespido', value: e.value } })}
                  options={dropdownItemsTipoDespidos}
                  optionLabel="name"
                  optionValue="name"
                  placeholder="Seleccione"
                />
              </div>
            )}

            {formData.tipoDespido === 'Disciplinario' && (
              <div className="field col-12 md:col-4">
                <label htmlFor="despidoDisciplinario">Despido Disciplinario</label>
                <Dropdown
                  id="despidoDisciplinario"
                  value={formData.despidoDisciplinario}
                  onChange={(e) => handleChange({ target: { name: 'despidoDisciplinario', value: e.value } })}
                  options={dropdownItemsDespidoDisciplinarios}
                  optionLabel="name"
                  optionValue="name"
                  placeholder="Seleccione"
                />
              </div>
            )}

            {formData.tipoDespido === 'Disciplinario' && formData.despidoDisciplinario === 'Otros Especificar' && (
              <div className="field col-12 md:col-4">
                <label htmlFor="otroDespidoDisciplinario">Especificar:</label>
                <InputText
                  id="otroDespidoDisciplinario"
                  value={formData.otroDespidoDisciplinario ?? ''}
                  onChange={(e) => handleChange({ target: { name: 'otroDespidoDisciplinario', value: e.target.value || null } })}
                  placeholder="Especificar otra motivo"
                />
              </div>
            )}

            {formData.tipoDespido === 'Necesidades de la Empresa' && (
              <div className="field col-12 md:col-4">
                <label htmlFor="anosServicios">Se pagaron años de Servicios</label>
                <div className="field-radiobutton">
                  <RadioButton inputId="anosServicios" name="anosServicios" value="Sí" checked={radioValueAnosServicio === 'Sí'} onChange={(e) => setRadioValueAnosServicio(e.value)} />
                  <label htmlFor="anosServicios">Sí</label>
                </div>
                <div className="field-radiobutton">
                  <RadioButton inputId="anosServicios2" name="anosServicios" value="No" checked={radioValueAnosServicio === 'No'} onChange={(e) => setRadioValueAnosServicio(e.value)} />
                  <label htmlFor="anosServicios2">No</label>
                </div>
                <label htmlFor="mesAviso">Se pagó mes de aviso</label>
                <div className="field-radiobutton">
                  <RadioButton inputId="mesAviso" name="mesAviso" value="Sí" checked={radioValueMesAviso === 'Sí'} onChange={(e) => setRadioValueMesAviso(e.value)} />
                  <label htmlFor="mesAviso">Sí</label>
                </div>
                <div className="field-radiobutton">
                  <RadioButton inputId="mesAviso2" name="mesAviso" value="No" checked={radioValueMesAviso === 'No'} onChange={(e) => setRadioValueMesAviso(e.value)} />
                  <label htmlFor="mesAviso2">No</label>
                </div>
              </div>
            )}

            <div className="field col-12 md:col-4">
              <label htmlFor="finiquito">Finiquito/Entrega Reserva</label>
              <div className="field-radiobutton">
                <RadioButton inputId="finiquito" name="finiquito" value="Sí" checked={radioValueFiniquito === 'Sí'} onChange={(e) => setRadioValueFiniquito(e.value)} />
                <label htmlFor="finiquito">Sí</label>
              </div>
              <div className="field-radiobutton">
                <RadioButton inputId="finiquito2" name="finiquito" value="No" checked={radioValueFiniquito === 'No'} onChange={(e) => setRadioValueFiniquito(e.value)} />
                <label htmlFor="finiquito2">No</label>
              </div>
            </div>

            <div className="field col-12 md:col-4">
              <label htmlFor="prestacionesAdeudadas">Prestaciones Adeudadas</label>
              <MultiSelect
                id="prestacionesAdeudadas"
                value={dropdownItemPrestacionesAdeudada}
                onChange={(e) => setDropdownItemPrestacionesAdeudada(e.value)}
                options={dropdownItemsPrestacionesAdeudadas}
                optionLabel="name"
                placeholder="Seleccione"
                maxSelectedLabels={3}
                className="w-full md:w-20rem"
                selectedItemsLabel='{0} elementos seleccionados'
              />
            </div>
          </div>
        </div>
      </div>
      <Button
        icon="pi pi-save"
        label={isEdit ? 'Actualizar Demanda' : 'Registrar Demanda'}
        className="p-button-rounded p-button-success"
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 9999,
        }}
        onClick={handleSubmit as any}
      />
      {isEdit && (
        <>
          {/* === MATERIAS (selección y botones generados) === */}
          <div className="col-12">
            <div className="card">
              <h5>Materias</h5>

              {/* Mensajes de error */}
              <Messages ref={message} />

              <div className="p-fluid formgrid grid">
                <div className="field col-12 md:col-6">
                  <Dropdown id="materia" value={null} options={dropdownItemsMateria} optionLabel="name" placeholder="Seleccione una materia" onChange={(e) => handleAddButton(e.value)} />
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {generatedButtons.map((item) => (
                  <Button key={item.code} label={item.name} icon="pi pi-times" className="p-button-outlined p-button-sm" onClick={() => handleRemoveButton(item.code)} />
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DemandaForm;
