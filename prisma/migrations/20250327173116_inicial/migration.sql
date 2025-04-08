-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Demanda" (
    "id" SERIAL NOT NULL,
    "nombres" TEXT NOT NULL,
    "apPaterno" TEXT NOT NULL,
    "apMaterno" TEXT NOT NULL,
    "run" TEXT NOT NULL,
    "nacionalidad" TEXT NOT NULL,
    "estadoCivil" TEXT NOT NULL,
    "fechaNacimiento" TIMESTAMP(3) NOT NULL,
    "correoElectronico" TEXT NOT NULL,
    "nombreRazonSocial" TEXT NOT NULL,
    "rutRazonSocial" TEXT NOT NULL,
    "domicilioRazonSocial" TEXT NOT NULL,
    "representanteLegal" TEXT NOT NULL,
    "runRepresentanteLegal" TEXT NOT NULL,
    "fechaInicioRelacionLaboral" TIMESTAMP(3) NOT NULL,
    "naturalezaContrato" TEXT NOT NULL,
    "funciones" TEXT NOT NULL,
    "lugar" TEXT NOT NULL,
    "jornada" TEXT NOT NULL,
    "otraJornada" TEXT,
    "registroAsistencia" TEXT NOT NULL,
    "remuneracion" DOUBLE PRECISION,
    "formaPago" TEXT NOT NULL,
    "liquidacionSueldo" TEXT NOT NULL,
    "cotizacionSalud" TEXT NOT NULL,
    "cotizacionAfp" TEXT NOT NULL,
    "cotizacionAfc" TEXT NOT NULL,
    "vacaciones" DOUBLE PRECISION,
    "fuero" TEXT NOT NULL,
    "fechaTerminoRelaLaboral" DATE NOT NULL,
    "motivoTermino" TEXT NOT NULL,
    "tipoDespido" TEXT NOT NULL,
    "despidoDisciplinario" TEXT NOT NULL,
    "otroDespidoDisciplinario" TEXT,
    "anosServicios" BOOLEAN NOT NULL,
    "mesAviso" BOOLEAN NOT NULL,
    "finiquito" BOOLEAN NOT NULL,
    "prestacionesAdeudadas" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Demanda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemandadoSolidario" (
    "id" SERIAL NOT NULL,
    "nombreRazonSocial" TEXT NOT NULL,
    "rut" TEXT NOT NULL,
    "domicilio" TEXT NOT NULL,
    "demandaId" INTEGER NOT NULL,

    CONSTRAINT "DemandadoSolidario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Demanda_run_key" ON "Demanda"("run");

-- CreateIndex
CREATE UNIQUE INDEX "Demanda_correoElectronico_key" ON "Demanda"("correoElectronico");

-- CreateIndex
CREATE UNIQUE INDEX "Demanda_rutRazonSocial_key" ON "Demanda"("rutRazonSocial");

-- CreateIndex
CREATE UNIQUE INDEX "DemandadoSolidario_rut_key" ON "DemandadoSolidario"("rut");

-- AddForeignKey
ALTER TABLE "DemandadoSolidario" ADD CONSTRAINT "DemandadoSolidario_demandaId_fkey" FOREIGN KEY ("demandaId") REFERENCES "Demanda"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
