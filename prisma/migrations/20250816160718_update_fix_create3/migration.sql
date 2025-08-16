/*
  Warnings:

  - Changed the type of `cotizacionSalud` on the `Demanda` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `cotizacionAfp` on the `Demanda` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `cotizacionAfc` on the `Demanda` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "public"."Demanda" DROP COLUMN "cotizacionSalud",
ADD COLUMN     "cotizacionSalud" BOOLEAN NOT NULL,
DROP COLUMN "cotizacionAfp",
ADD COLUMN     "cotizacionAfp" BOOLEAN NOT NULL,
DROP COLUMN "cotizacionAfc",
ADD COLUMN     "cotizacionAfc" BOOLEAN NOT NULL;
