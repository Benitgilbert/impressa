import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.xnozaxqyesbyiezdumpo:Famillee%40123@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?sslmode=require"
    }
  }
})

async function main() {
  console.log('Testing connection...')
  try {
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('Connection successful:', result)
    
    // Check if tables exist by querying something
    const tables = await prisma.$queryRaw`SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'`
    console.log('Tables in database:', tables)
    
  } catch (e) {
    console.error('Connection failed:', e)
  } finally {
    await prisma.$disconnect()
  }
}

main()
