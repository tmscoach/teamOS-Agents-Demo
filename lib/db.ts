import { PrismaClient } from "./generated/prisma";

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: [
      {
        emit: 'event',
        level: 'error',
      },
      {
        emit: 'stdout',
        level: 'warn',
      },
    ],
  });
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

// Log Prisma errors for debugging connection issues
if (prisma instanceof PrismaClient) {
  prisma.$on('error', (e) => {
    console.error('[Prisma Error]', {
      message: e.message,
      target: e.target,
      timestamp: e.timestamp,
    });
  });
}

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;