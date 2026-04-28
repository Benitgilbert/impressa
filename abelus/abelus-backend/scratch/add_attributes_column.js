
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fix() {
  try {
    console.log("Adding 'attributes' column to 'Product' table...");
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "attributes" JSONB DEFAULT '[]'::jsonb;
    `);
    console.log("Column 'attributes' added successfully.");
  } catch (err) {
    console.error("Migration Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

fix();
