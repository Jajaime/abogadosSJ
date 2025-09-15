// prisma.config.ts (en la raíz del repo)
import path from "node:path";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    path: path.join("prisma", "migrations"),
    seed: "tsx prisma/seed.ts"     // 👈 aquí, no en la raíz
  }
});
