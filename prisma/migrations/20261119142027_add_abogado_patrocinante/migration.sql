-- AlterTable
ALTER TABLE "Demanda" ADD COLUMN     "abogadoPatrocinanteId" TEXT;

-- CreateTable
CREATE TABLE "Abogado" (
    "id" TEXT NOT NULL,
    "nombreCompleto" TEXT NOT NULL,
    "run" TEXT NOT NULL,
    "domicilioProfesional" TEXT NOT NULL,
    "correoElectronico" TEXT,
    "telefono" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Abogado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Abogado_run_key" ON "Abogado"("run");

-- CreateIndex
CREATE INDEX "Demanda_abogadoPatrocinanteId_idx" ON "Demanda"("abogadoPatrocinanteId");

-- AddForeignKey
ALTER TABLE "Demanda" ADD CONSTRAINT "Demanda_abogadoPatrocinanteId_fkey" FOREIGN KEY ("abogadoPatrocinanteId") REFERENCES "Abogado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
