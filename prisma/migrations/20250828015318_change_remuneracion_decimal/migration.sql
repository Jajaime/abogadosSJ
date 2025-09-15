/*
  Warnings:

  - You are about to alter the column `remuneracion` on the `Demanda` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(12,2)`.

*/
-- DropForeignKey
ALTER TABLE "public"."DemandadoSolidario" DROP CONSTRAINT "DemandadoSolidario_demandaId_fkey";

-- AlterTable
ALTER TABLE "public"."Demanda" ALTER COLUMN "remuneracion" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "tipoDespido" DROP NOT NULL,
ALTER COLUMN "despidoDisciplinario" DROP NOT NULL,
ALTER COLUMN "anosServicios" DROP NOT NULL,
ALTER COLUMN "mesAviso" DROP NOT NULL,
ALTER COLUMN "finiquito" DROP NOT NULL,
ALTER COLUMN "prestacionesAdeudadas" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "materias" SET DEFAULT ARRAY[]::TEXT[];

-- AddForeignKey
ALTER TABLE "public"."DemandadoSolidario" ADD CONSTRAINT "DemandadoSolidario_demandaId_fkey" FOREIGN KEY ("demandaId") REFERENCES "public"."Demanda"("id") ON DELETE CASCADE ON UPDATE CASCADE;
