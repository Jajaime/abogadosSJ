// Demandado solidario
export interface DemandadoSolDTO {
    id?: number | string | null;
    nombreRazonSocial: string;
    rut: string;
    domicilio: string;
    representanteLegal: string;
    runRepresentanteLegal: string;
    [key: string]: string | number | null | undefined;
}

// Demanda principal completa
export interface DemandaDTO {
    // Datos del cliente demandante
    id: number;
    usuarioId?: string;
    nombres: string;
    apPaterno: string;
    apMaterno: string;
    run: string;
    fechaNacimiento: string | Date;
    nacionalidad: string;
    correoElectronico: string;
    estadoCivil: string;
    domicilioParticular: string;

    // Demandados solidarios
    demandadoSols: DemandadoSolDTO[];

    // Demandado principal
    nombreRazonSocial: string;
    rutRazonSocial: string;
    domicilioRazonSocial: string;
    representanteLegal: string;
    runRepresentanteLegal: string;

    // Relación laboral
    fechaInicioRelacionLaboral: string | Date | null;
    naturalezaContrato: string;
    funciones: string;
    lugar: string;
    jornada: string;
    otraJornada?: string | null;
    registroAsistencia: boolean;
    remuneracion: number | null;
    formaPago: string;
    liquidacionSueldo: boolean;
    cotizacionSalud: string;
    cotizacionAfp: string;
    cotizacionAfc: string;
    vacaciones: number | null;
    fuero: string;

    // Término de relación laboral
    fechaTerminoRelaLaboral: string | Date | null;
    motivoTermino: string;
    tipoDespido?: string | null;
    despidoDisciplinario?: string | null;
    otroDespidoDisciplinario?: string | null;
    anosServicios?: boolean;
    mesAviso?: boolean;
    finiquito?: boolean;
    prestacionesAdeudadas: string[]; // códigos o nombres de prestaciones
    materias: string[];
    createdAt?: string | Date;

    [key: string]: unknown;
}

