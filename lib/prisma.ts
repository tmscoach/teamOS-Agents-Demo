import { PrismaClient } from '@/lib/generated/prisma'

declare global {
  var prisma: PrismaClient | undefined
}

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

export const prisma = global.prisma || prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}