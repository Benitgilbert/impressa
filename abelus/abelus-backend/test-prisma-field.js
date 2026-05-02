import prisma from './prisma.js';

async function main() {
  try {
    const p = await prisma.product.findFirst({
      select: {
        id: true,
        bundleConfigurations: true
      }
    });
    console.log("Field available:", p);
  } catch (err) {
    console.error("Field NOT available:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
