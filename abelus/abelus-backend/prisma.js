import pkg from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const { PrismaClient } = pkg;

// Use a global variable to prevent multiple instances of Prisma Client in development/serverless
let prisma;
if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
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
