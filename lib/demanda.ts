import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export const findDemandaForUser = async (
    demandaId: number,
    userId: string,
    options: { include?: Prisma.DemandaInclude } = {}
) => {
    return prisma.demanda.findFirst({
        where: { id: demandaId, usuarioId: userId },
        include: options.include,
    });
};
