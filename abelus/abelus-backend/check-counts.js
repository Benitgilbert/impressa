import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const counts = {
    orders: await prisma.order.count(),
    products: await prisma.product.count(),
    users: await prisma.user.count(),
    orderItems: await prisma.orderItem.count(),
    sellers: await prisma.user.count({ where: { role: 'seller' } })
  };
  console.log('Counts:', JSON.stringify(counts, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
