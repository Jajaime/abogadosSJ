/*
  Warnings:

  - Added the required column `domicilioParticular` to the `Demanda` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Demanda" ADD COLUMN     "domicilioParticular" TEXT NOT NULL;
