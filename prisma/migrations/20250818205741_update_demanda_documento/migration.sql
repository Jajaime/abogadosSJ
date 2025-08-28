/*
  Warnings:

  - Changed the type of `demandaId` on the `DemandaDocumento` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "public"."DemandaDocumento" DROP COLUMN "demandaId",
ADD COLUMN     "demandaId" INTEGER NOT NULL;
