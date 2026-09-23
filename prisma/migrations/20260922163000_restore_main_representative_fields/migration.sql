-- Fase 2: restaurar los datos del representante legal del demandado principal.
-- Las columnas son nullable para mantener compatibilidad con demandas existentes.
ALTER TABLE "Demanda"
  ADD COLUMN "representanteLegal" TEXT,
  ADD COLUMN "runRepresentanteLegal" TEXT;
