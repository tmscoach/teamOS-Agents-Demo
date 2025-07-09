// Re-export the working prisma client
export { default as prisma } from './db';
export { default } from './db';

// Also export types from the generated client
export * from './generated/prisma';