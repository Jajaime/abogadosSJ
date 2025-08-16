/*
  Warnings:

  - The `prestacionesAdeudadas` column on the `Demanda` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `tamaño` on the `DemandaDocumento` table. All the data in the column will be lost.
  - You are about to drop the column `tamaño` on the `Documento` table. All the data in the column will be lost.
  - Changed the type of `registroAsistencia` on the `Demanda` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `liquidacionSueldo` on the `Demanda` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `tamano` to the `DemandaDocumento` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tamano` to the `Documento` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Demanda" DROP COLUMN "registroAsistencia",
ADD COLUMN     "registroAsistencia" BOOLEAN NOT NULL,
DROP COLUMN "liquidacionSueldo",
ADD COLUMN     "liquidacionSueldo" BOOLEAN NOT NULL,
DROP COLUMN "prestacionesAdeudadas",
ADD COLUMN     "prestacionesAdeudadas" TEXT[];

-- AlterTable
ALTER TABLE "public"."DemandaDocumento" DROP COLUMN "tamaño",
ADD COLUMN     "tamano" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "public"."Documento" DROP COLUMN "tamaño",
ADD COLUMN     "tamano" INTEGER NOT NULL;
