import pkg from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const { PrismaClient } = pkg;

// Use a global variable to prevent multiple instances of Prisma Client in development/serverless
// Prisma singleton pattern for serverless environments
// This prevents exhausting database connections during hot reloads and lambda warm starts
// Use a global variable to prevent multiple instances of Prisma Client in development/serverless
// This prevents exhausting database connections during hot reloads and lambda warm starts
const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['query', 'error', 'warn'],
});

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
} else if (process.env.VERCEL) {
  // On Vercel, we still want to reuse the instance if the lambda stays warm
  global.prisma = prisma;
}

// Initialize Supabase Admin client for backend verification
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("CRITICAL: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing!");
}

export const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default prisma;
