/*
  Warnings:

  - Added the required column `usuarioId` to the `DemandaDocumento` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Demanda" ADD COLUMN     "usuarioId" TEXT;

-- AlterTable
ALTER TABLE "public"."DemandaDocumento" ADD COLUMN     "usuarioId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."Usuario" ADD COLUMN     "passwordHash" TEXT;

-- AddForeignKey
ALTER TABLE "public"."Demanda" ADD CONSTRAINT "Demanda_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Documento" ADD CONSTRAINT "Documento_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DemandaDocumento" ADD CONSTRAINT "DemandaDocumento_demandaId_fkey" FOREIGN KEY ("demandaId") REFERENCES "public"."Demanda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DemandaDocumento" ADD CONSTRAINT "DemandaDocumento_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
