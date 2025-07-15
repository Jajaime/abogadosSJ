-- CreateTable
CREATE TABLE "DemandaDocumento" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "contenido" BYTEA NOT NULL,
    "demandaId" TEXT NOT NULL,
    "tamaño" INTEGER NOT NULL,

    CONSTRAINT "DemandaDocumento_pkey" PRIMARY KEY ("id")
);
