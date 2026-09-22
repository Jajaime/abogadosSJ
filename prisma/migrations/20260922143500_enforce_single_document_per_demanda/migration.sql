-- Fase 1: una demanda puede tener un único documento vigente.
--
-- Si existen duplicados históricos para una misma demanda, la migración
-- se detiene en vez de eliminar documentos silenciosamente.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "DemandaDocumento"
    GROUP BY "demandaId"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Existen múltiples documentos para una misma demanda. Resolver duplicados antes de aplicar la restricción única por demandaId.';
  END IF;
END
$$;

DROP INDEX IF EXISTS "DemandaDocumento_demandaId_usuarioId_key";

CREATE UNIQUE INDEX "DemandaDocumento_demandaId_key"
  ON "DemandaDocumento" ("demandaId");
