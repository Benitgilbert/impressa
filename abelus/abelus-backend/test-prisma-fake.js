import prisma from './prisma.js';

async function main() {
  try {
    const p = await prisma.product.findFirst({
      select: {
        id: true,
        fakeField: true
      }
    });
    console.log("Field available:", p);
  } catch (err) {
    console.error("EXPECTED ERROR:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
