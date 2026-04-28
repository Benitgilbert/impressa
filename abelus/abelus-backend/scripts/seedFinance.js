import dotenv from "dotenv";
import prisma from "../prisma.js";

dotenv.config();

const systemAccounts = [
    {
        code: "1001",
        name: "Cash / Bank",
        type: "Asset",
        description: "Main operating bank account"
    },
    {
        code: "1100",
        name: "Payment Gateway Receivable",
        type: "Asset",
        description: "Funds held by Stripe/PayPal before payout"
    },
    {
        code: "2001",
        name: "Seller Payable",
        type: "Liability",
        description: "Funds owed to sellers for their sales"
    },
    {
        code: "4001",
        name: "Commission Revenue",
        type: "Revenue",
        description: "Platform commission earnings"
    },
    {
        code: "5001",
        name: "Platform Expenses",
        type: "Expense",
        description: "General platform operating expenses"
    }
];

const seedFinance = async () => {
    try {
        console.log("Seeding System Accounts...");

        for (const account of systemAccounts) {
            const acc = await prisma.account.upsert({
                where: { code: account.code },
                update: {},
                create: account
            });
            console.log(`Ensured account: ${acc.code} - ${acc.name}`);
        }

        console.log("Finance seeding completed.");
        process.exit();
    } catch (error) {
        console.error("Error seeding finance:", error);
        process.exit(1);
    }
};

seedFinance();
