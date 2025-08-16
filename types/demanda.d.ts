// Demandado solidario
export interface DemandadoSolDTO {
    id?: string;
    nombre: string;
    rut: string;
    domicilio: string;
    [key: string]: string | undefined;
}

// Demanda principal completa
export interface DemandaDTO {
    // Datos del cliente demandante
    nombres: string;
    apPaterno: string;
    apMaterno: string;
    run: string;
    fechaNacimiento: string; // o Date si manejas formato Date en el backend
    nacionalidad: string;
    correoElectronico: string;
    estadoCivil: string;

    // Demandados solidarios
    demandadoSols: DemandadoSol[];

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
    cotizacionSalud: boolean;
    cotizacionAfp: boolean;
    cotizacionAfc: boolean;
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
    finiquito: boolean;
    prestacionesAdeudadas: string[]; // códigos o nombres de prestaciones

    [key: string]: string | string[] | number | Date | boolean | DemandadoSol[] | undefined;
}
