-- DropIndex
DROP INDEX "Demanda_rutRazonSocial_key";

-- AlterTable
ALTER TABLE "Demanda" ALTER COLUMN "fechaInicioRelacionLaboral" DROP NOT NULL,
ALTER COLUMN "fechaTerminoRelaLaboral" DROP NOT NULL,
ALTER COLUMN "fechaTerminoRelaLaboral" SET DATA TYPE TIMESTAMP(3);
