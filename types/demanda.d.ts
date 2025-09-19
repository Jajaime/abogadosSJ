// Demandado solidario
export interface DemandadoSolDTO {
    id?: string;
    nombreRazonSocial?: string;
    nombre?: string;
    rut: string;
    domicilio: string;
    representanteLegal: string;
    runRepresentanteLegal: string;
    [key: string]: string | undefined;
}

// Demanda principal completa
export interface DemandaDTO {
    // Datos del cliente demandante
    id: string;
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
    fechaInicioRelacionLaboral: string | Date;
    naturalezaContrato: string;
    funciones: string;
    lugar: string;
    jornada: string;
    otraJornada?: string;
    registroAsistencia: boolean;
    remuneracion: number;
    formaPago: string;
    liquidacionSueldo: boolean;
    cotizacionSalud: string;
    cotizacionAfp: string;
    cotizacionAfc: string;
    vacaciones: number;
    fuero: string;

    // Término de relación laboral
    fechaTerminoRelaLaboral: string | Date;
    motivoTermino: string;
    tipoDespido?: string;
    despidoDisciplinario?: string;
    otroDespidoDisciplinario?: string;
    anosServicios?: boolean;
    mesAviso?: boolean;
    finiquito?: boolean;
    prestacionesAdeudadas: string[]; // códigos o nombres de prestaciones
    materias: string[];
    createdAt?: string | Date; // 👈 agrega esto

    [key: string]: string | string[] | number | Date | boolean | DemandadoSolDTO[] | undefined;
}
