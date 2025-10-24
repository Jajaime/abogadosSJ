import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DAY_MS = 24 * 60 * 60 * 1000;
const REMEMBER_MAX_MS = 30 * DAY_MS;

async function main() {
  const sessions = await prisma.session.findMany({
    select: { id: true, createdAt: true, expiresAt: true },
  });

  let updated = 0;

  for (const session of sessions) {
    const absoluteCap = new Date(session.createdAt.getTime() + REMEMBER_MAX_MS);
    if (session.expiresAt.getTime() > absoluteCap.getTime()) {
      await prisma.session.update({
        where: { id: session.id },
        data: { expiresAt: absoluteCap },
      });
      updated += 1;
    }
  }

  console.log(
    `Session expiry clamp completed. Updated ${updated} of ${sessions.length} sessions.`,
  );
}

main()
  .catch((error) => {
    console.error('[sessions:clamp] Failed to clamp session expiry', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => undefined);
  });
