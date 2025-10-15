// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

declare global {
  // Evita redeclaración en recargas de dev
   
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ??
  new PrismaClient({
    // Opcional: logging útil en dev
    // log: ['query', 'error', 'warn'],
  });

// En dev, guarda en global para reutilizar en recargas
if (process.env.NODE_ENV !== 'production') global.prisma = prisma;
