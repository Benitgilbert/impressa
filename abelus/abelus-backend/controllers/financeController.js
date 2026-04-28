import prisma from "../prisma.js";

/**
 * Helper to update account balances based on transaction entries
 */
const updateBalances = async (entries) => {
    for (const entry of entries) {
        const account = await prisma.account.findUnique({ where: { id: entry.accountId } });
        if (!account) continue;

        // Accounting Rule:
        // Asset/Expense: Debit increases (+), Credit decreases (-)
        // Liability/Equity/Revenue: Credit increases (+), Debit decreases (-)
        const isDebitNormal = ["Asset", "Expense"].includes(account.type);

        let newBalance = account.balance || 0;
        if (isDebitNormal) {
            newBalance += (entry.debit || 0) - (entry.credit || 0);
        } else {
            newBalance += (entry.credit || 0) - (entry.debit || 0);
        }

        await prisma.account.update({
            where: { id: account.id },
            data: { balance: newBalance }
        });
    }
};

/**
 * Record a financial transaction with multiple entries
 * @param {Object} params - { date, description, reference, entries, type, createdBy }
 */
export const recordTransaction = async ({ date, description, reference, entries, type, createdBy }) => {
    // Normalize entries to use accountId if 'account' was passed (for Mongoose compatibility)
    const normalizedEntries = entries.map(e => ({
        accountId: e.accountId || e.account,
        debit: Number(e.debit || 0),
        credit: Number(e.credit || 0)
    }));

    const transaction = await prisma.transaction.create({
        data: {
            date: date || new Date(),
            description,
            reference,
            type: type || "Journal",
            createdById: createdBy || null,
            entries: {
                create: normalizedEntries
            }
        },
        include: { entries: true }
    });

    await updateBalances(transaction.entries);
    return transaction;
};

/**
 * Controller: Create a manual transaction
 */
export const createTransaction = async (req, res) => {
    try {
        const transaction = await recordTransaction({
            ...req.body,
            createdBy: req.user?.id
        });
        res.status(201).json(transaction);
    } catch (err) {
        console.error("Create transaction failed:", err);
        res.status(500).json({ message: err.message || "Failed to create transaction." });
    }
};

/**
 * Controller: Get all accounts
 */
export const getAccounts = async (req, res) => {
    try {
        const accounts = await prisma.account.findMany({
            orderBy: { code: 'asc' }
        });
        res.json(accounts);
    } catch (err) {
        res.status(500).json({ message: "Failed to load accounts." });
    }
};

/**
 * Controller: Create a new account
 */
export const createAccount = async (req, res) => {
    try {
        const account = await prisma.account.create({
            data: req.body
        });
        res.status(201).json(account);
    } catch (err) {
        res.status(500).json({ message: "Failed to create account." });
    }
};

/**
 * Controller: Get ledger for a specific account
 */
export const getLedger = async (req, res) => {
    try {
        const { accountId } = req.params;
        const transactions = await prisma.transaction.findMany({
            where: {
                entries: {
                    some: { accountId }
                }
            },
            include: {
                entries: {
                    include: {
                        account: { select: { name: true, code: true } }
                    }
                }
            },
            orderBy: { date: 'desc' }
        });

        res.json(transactions);
    } catch (err) {
        console.error("Fetch ledger failed:", err);
        res.status(500).json({ message: "Failed to load ledger." });
    }
};

/**
 * Controller: Get financial summary (total assets, liabilities, etc.)
 */
export const getFinancialSummary = async (req, res) => {
    try {
        const accounts = await prisma.account.findMany();

        const summary = {
            assets: 0,
            liabilities: 0,
            equity: 0,
            revenue: 0,
            expenses: 0,
            netIncome: 0
        };

        accounts.forEach(acc => {
            const balance = acc.balance || 0;
            switch (acc.type) {
                case "Asset": summary.assets += balance; break;
                case "Liability": summary.liabilities += balance; break;
                case "Equity": summary.equity += balance; break;
                case "Revenue": summary.revenue += balance; break;
                case "Expense": summary.expenses += balance; break;
            }
        });

        summary.netIncome = summary.revenue - summary.expenses;

        res.json(summary);
    } catch (err) {
        res.status(500).json({ message: "Failed to load financial summary." });
    }
};
