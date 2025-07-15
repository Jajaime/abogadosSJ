import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Método para crear un usuario (POST)
export async function POST(req: Request) {
  console.log("Recibiendo petición POST en /api/demandas");
    try {
        const data = await req.json();
        console.log("nacionalidad:", data.nacionalidad.name);

        // Validaciones básicas (puedes agregar más según tus necesidades)
        if (!data.run || !data.correoElectronico) {
            return NextResponse.json(
                { error: "Faltan campos obligatorios (run, correo, rut razón social)" },
                { status: 400 }
            );
        }

        const nuevaDemanda = await prisma.demanda.create({
            data: {
                nombres: data.nombres,
                apPaterno: data.apPaterno,
                apMaterno: data.apMaterno,
                run: data.run,
                nacionalidad: data.nacionalidad?.name || '',
                estadoCivil: data.estadoCivil?.name || '',
                fechaNacimiento: new Date(data.fechaNacimiento),
                correoElectronico: data.correoElectronico,
                nombreRazonSocial: data.nombreRazonSocial || '',
                rutRazonSocial: data.rutRazonSocial || '',
                domicilioRazonSocial: data.domicilioRazonSocial || '',
                representanteLegal: data.representanteLegal || '',
                runRepresentanteLegal: data.runRepresentanteLegal || '',
                fechaInicioRelacionLaboral: data.fechaInicioRelacionLaboral ? new Date(data.fechaInicioRelacionLaboral) : null, 
                naturalezaContrato: data.naturalezaContrato || '',
                funciones: data.funciones || '',
                lugar: data.lugar || '',
                jornada: data.jornada || '',
                otraJornada: data.otraJornada || null,
                registroAsistencia: data.registroAsistencia || '',
                remuneracion: data.remuneracion ? parseFloat(data.remuneracion) : null,
                formaPago: data.formaPago || '',
                liquidacionSueldo: data.liquidacionSueldo || '',
                cotizacionSalud: data.cotizacionSalud || '',
                cotizacionAfp: data.cotizacionAfp || '',
                cotizacionAfc: data.cotizacionAfc || '',
                vacaciones: data.vacaciones ? parseFloat(data.vacaciones) : null,
                fuero: data.fuero || '',
                fechaTerminoRelaLaboral: data.fechaTerminoRelaLaboral ? new Date(data.fechaTerminoRelaLaboral) : null,
                motivoTermino: data.motivoTermino || '',
                tipoDespido: data.tipoDespido || '',
                despidoDisciplinario: data.despidoDisciplinario || '',
                otroDespidoDisciplinario: data.otroDespidoDisciplinario || null,
                anosServicios: data.anosServicios || false,
                mesAviso: data.mesAviso || false,
                finiquito: data.finiquito || false,
                prestacionesAdeudadas: data.prestacionesAdeudadas || ''
                // Si vas a incluir demandados solidarios, agrégalos aquí como relación
                // demandadoSolidario: { create: [...] }
            }
        });

        return NextResponse.json(nuevaDemanda, { status: 201 });
    } catch (error) {
        console.error("Error al crear demanda:", error);
        return NextResponse.json({ error: "Error al crear demanda" }, { status: 500 });
    }
}

// Método para obtener demandas (GET)
export async function GET() {
    try {
        const allDemandas = await prisma.demanda.findMany();
        return NextResponse.json(allDemandas, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Error al obtener las demandas" }, { status: 500 });
    }
}