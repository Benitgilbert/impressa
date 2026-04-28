import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import prisma from "../prisma.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

const seedAdmin = async () => {
    try {
        const adminEmail = "byiringirobenitg@gmail.com";
        const adminPassword = "admin123";
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        const admin = await prisma.user.upsert({
            where: { email: adminEmail },
            update: {
                password: hashedPassword,
                role: "admin"
            },
            create: {
                name: "Admin User",
                email: adminEmail,
                password: hashedPassword,
                role: "admin"
            }
        });

        console.log("✅ Admin user seeded successfully:", admin.email);
        process.exit(0);
    } catch (error) {
        console.error("❌ Error seeding admin:", error);
        process.exit(1);
    }
};

seedAdmin();
