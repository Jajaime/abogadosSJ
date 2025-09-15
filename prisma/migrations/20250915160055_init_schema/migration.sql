/*
  Warnings:

  - You are about to drop the column `representanteLegal` on the `Demanda` table. All the data in the column will be lost.
  - You are about to drop the column `runRepresentanteLegal` on the `Demanda` table. All the data in the column will be lost.
  - Added the required column `representanteLegal` to the `DemandadoSolidario` table without a default value. This is not possible if the table is not empty.
  - Added the required column `runRepresentanteLegal` to the `DemandadoSolidario` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Demanda" DROP COLUMN "representanteLegal",
DROP COLUMN "runRepresentanteLegal";

-- AlterTable
ALTER TABLE "public"."DemandadoSolidario" ADD COLUMN     "representanteLegal" TEXT NOT NULL,
ADD COLUMN     "runRepresentanteLegal" TEXT NOT NULL;
