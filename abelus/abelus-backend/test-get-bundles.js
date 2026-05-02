import prisma from './prisma.js';

async function main() {
  try {
    const products = await prisma.product.findMany({
      where: { name: { contains: 'ePaper', mode: 'insensitive' } },
      select: { id: true, name: true, bundleConfigurations: true }
    });
    console.log("Products:", JSON.stringify(products, null, 2));
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
