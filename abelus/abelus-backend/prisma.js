import pkg from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

// Initialize Supabase Admin client for backend verification
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default prisma;
