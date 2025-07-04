// Browser-safe version - no actual Prisma client
export const prisma = {
  // Mock Prisma client for browser use
  $connect: () => Promise.resolve(),
  $disconnect: () => Promise.resolve(),
}

// This file should only be used in browser contexts
// The real Prisma client is in src/server/lib/prisma.ts