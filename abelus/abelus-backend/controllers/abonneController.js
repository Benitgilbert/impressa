import prisma from "../prisma.js";
import logger from "../config/logger.js";

/**
 * 👥 Get all Client Abonnes
 * @route   GET /api/abonnes
 * @access  Private (Admin/Seller)
 */
export const getAbonnes = async (req, res) => {
    try {
        const abonnes = await prisma.clientAbonne.findMany({
            where: { status: "active" },
            orderBy: { name: 'asc' }
        });
        res.status(200).json({ success: true, data: abonnes });
    } catch (error) {
        logger.error({ err: error }, "Failed to get abonnes");
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

/**
 * 👥 Create new Client Abonne
 * @route   POST /api/abonnes
 * @access  Private (Admin/Seller)
 */
export const createAbonne = async (req, res) => {
    try {
        const { name, phone, email } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: "Name is required" });
        }

        const newAbonne = await prisma.clientAbonne.create({
            data: { name, phone, email }
        });
        res.status(201).json({ success: true, data: newAbonne });
    } catch (error) {
        logger.error({ err: error }, "Failed to create abonne");
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

/**
 * 📄 Get Fiche (Unpaid Transactions) for a Client
 * @route   GET /api/abonnes/:id/fiche
 * @access  Private (Admin/Seller)
 */
export const getAbonneFiche = async (req, res) => {
    try {
        const client = await prisma.clientAbonne.findUnique({
            where: { id: req.params.id }
        });
        if (!client) {
            return res.status(404).json({ success: false, message: "Client not found" });
        }

        const transactions = await prisma.abonneTransaction.findMany({
            where: { 
                clientId: req.params.id,
                status: { in: ["unpaid", "partially_paid"] }
            },
            include: { responsible: { select: { name: true } } },
            orderBy: { date: 'asc' }
        });

        res.status(200).json({ 
            success: true, 
            client,
            transactions 
        });
    } catch (error) {
        logger.error({ err: error }, "Failed to get abonne fiche");
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

/**
 * 💰 Record Debt Payment for a Client
 * @route   POST /api/abonnes/:id/pay
 * @access  Private (Admin/Seller)
 */
export const payAbonneDebt = async (req, res) => {
    try {
        const { amount } = req.body;
        const clientId = req.params.id;

        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, message: "Valid payment amount is required" });
        }

        const client = await prisma.clientAbonne.findUnique({
            where: { id: clientId }
        });
        if (!client) {
            return res.status(404).json({ success: false, message: "Client not found" });
        }

        // Get all unpaid/partially paid transactions sorted by oldest first
        const transactions = await prisma.abonneTransaction.findMany({
            where: { 
                clientId: clientId,
                status: { in: ["unpaid", "partially_paid"] }
            },
            orderBy: { date: 'asc' }
        });

        let remainingPayment = Number(amount);

        // Use transaction to ensure consistency
        const updatedClient = await prisma.$transaction(async (tx) => {
            // Apply payment to oldest transactions first
            for (let t of transactions) {
                if (remainingPayment <= 0) break;

                if (remainingPayment >= t.debtAmount) {
                    // Fully pay this transaction
                    const debtToPay = t.debtAmount;
                    remainingPayment -= debtToPay;
                    
                    await tx.abonneTransaction.update({
                        where: { id: t.id },
                        data: {
                            amountPaid: { increment: debtToPay },
                            debtAmount: 0,
                            status: "paid"
                        }
                    });
                } else {
                    // Partially pay this transaction
                    const applied = remainingPayment;
                    await tx.abonneTransaction.update({
                        where: { id: t.id },
                        data: {
                            amountPaid: { increment: applied },
                            debtAmount: { decrement: applied },
                            status: "partially_paid"
                        }
                    });
                    remainingPayment = 0;
                }
            }

            // Update total debt
            return await tx.clientAbonne.update({
                where: { id: clientId },
                data: { totalDebt: { decrement: Number(amount) } }
            });
        });

        res.status(200).json({ 
            success: true, 
            data: updatedClient, 
            message: "Payment recorded successfully" 
        });
    } catch (error) {
        logger.error({ err: error }, "Failed to record abonne payment");
        res.status(500).json({ success: false, message: "Server Error" });
    }
};
