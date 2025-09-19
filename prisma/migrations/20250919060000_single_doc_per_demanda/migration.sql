-- Ensure only one document per demanda/usuario
CREATE UNIQUE INDEX IF NOT EXISTS "DemandaDocumento_demandaId_usuarioId_key"
  ON "DemandaDocumento" ("demandaId", "usuarioId");
