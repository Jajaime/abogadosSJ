/*
  Warnings:

  - The `cotizacionSalud` column on the `Demanda` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `cotizacionAfp` column on the `Demanda` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `cotizacionAfc` column on the `Demanda` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Demanda" DROP COLUMN "cotizacionSalud",
ADD COLUMN     "cotizacionSalud" TEXT[],
DROP COLUMN "cotizacionAfp",
ADD COLUMN     "cotizacionAfp" TEXT[],
DROP COLUMN "cotizacionAfc",
ADD COLUMN     "cotizacionAfc" TEXT[];
