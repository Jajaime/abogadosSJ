/*
  Warnings:

  - You are about to drop the `Documento` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Documento" DROP CONSTRAINT "Documento_usuarioId_fkey";

-- DropTable
DROP TABLE "public"."Documento";
