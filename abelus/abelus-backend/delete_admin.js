import prisma from './prisma.js';

async function deleteAdmin() {
  try {
    const deleted = await prisma.user.deleteMany({
      where: { email: 'admin@abelus.com' }
    });
    console.log(`Deleted ${deleted.count} user(s) with email admin@abelus.com`);
  } catch (err) {
    console.error('Error deleting user:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAdmin();
