// prisma.config.ts (en la raíz)
import { config as dotenv } from 'dotenv';
import path from 'node:path';
import { defineConfig } from 'prisma/config';

// ✅ carga .env desde la raíz del repo (mismo dir de este archivo)
dotenv({ path: path.resolve(__dirname, '.env') });

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  migrations: {
    path: path.join('prisma', 'migrations'),
    seed: 'tsx prisma/seed.ts'
  }
});
