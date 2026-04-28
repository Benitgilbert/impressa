import prisma from "../prisma.js";
import logger from "../config/logger.js";

const generateCode = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
};

/**
 * ✅ Check Gift Card Balance (Public)
 */
export const checkBalance = async (req, res, next) => {
    try {
        const { code } = req.params;
        if (!code) return res.status(400).json({ success: false, message: "Code is required" });

        const giftCard = await prisma.giftCard.findUnique({ where: { code: code.toUpperCase() } });
        if (!giftCard) return res.status(404).json({ success: false, message: "Invalid Gift Card code" });

        if (giftCard.status !== "Active") {
            return res.status(400).json({ success: false, message: `This gift card is ${giftCard.status.toLowerCase()}` });
        }

        if (new Date() > giftCard.expiryDate) {
            await prisma.giftCard.update({ where: { id: giftCard.id }, data: { status: "Expired" } });
            return res.status(400).json({ success: false, message: "This gift card has expired" });
        }

        res.json({ success: true, data: { balance: giftCard.currentBalance, expiryDate: giftCard.expiryDate } });
    } catch (error) {
        next(error);
    }
};

/**
 * ✅ Validate and get balance (Internal/Redemption)
 */
export const validateGiftCard = async (req, res, next) => {
    try {
        const { code } = req.body;
        const giftCard = await prisma.giftCard.findUnique({ where: { code: code.toUpperCase() } });

        if (!giftCard || giftCard.status !== "Active") {
            return res.status(404).json({ success: false, message: "Valid active Gift Card not found" });
        }

        if (new Date() > giftCard.expiryDate) {
            await prisma.giftCard.update({ where: { id: giftCard.id }, data: { status: "Expired" } });
            return res.status(400).json({ success: false, message: "Gift Card has expired" });
        }

        res.json({ success: true, data: giftCard });
    } catch (error) {
        next(error);
    }
};

/**
 * ✅ Create/Purchase Gift Card (Protected)
 */
export const createGiftCard = async (req, res, next) => {
    try {
        const { initialAmount, recipientEmail, message } = req.body;
        const senderId = req.user.id;

        const code = generateCode();
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);

        const giftCard = await prisma.giftCard.create({
            data: {
                code,
                initialAmount,
                currentBalance: initialAmount,
                senderId,
                recipientEmail,
                message,
                status: "Active",
                expiryDate
            }
        });

        logger.info({ code, amount: initialAmount, recipient: recipientEmail }, "Gift Card Created");
        res.status(201).json({ success: true, message: "Gift Card created successfully", data: giftCard });
    } catch (error) {
        next(error);
    }
};

/**
 * ✅ Redeem Gift Card (Internal use by checkout)
 */
export const redeemGiftCard = async (req, res, next) => {
    try {
        const { code, amount } = req.body;
        const giftCard = await prisma.giftCard.findUnique({ where: { code: code.toUpperCase() } });

        if (!giftCard || giftCard.status !== "Active" || giftCard.currentBalance < amount) {
            return res.status(400).json({ success: false, message: "Insufficient Gift Card balance or invalid code" });
        }

        const newBalance = giftCard.currentBalance - amount;
        const updated = await prisma.giftCard.update({
            where: { id: giftCard.id },
            data: {
                currentBalance: newBalance,
                status: newBalance === 0 ? "Redeemed" : "Active"
            }
        });

        logger.info({ code, redeemed: amount, remaining: newBalance }, "Gift Card Redeemed");
        res.json({ success: true, message: "Gift card applied successfully", data: { redeemedAmount: amount, remainingBalance: newBalance } });
    } catch (error) {
        next(error);
    }
};

/**
 * ✅ Get all Gift Cards (Admin)
 */
export const getAllGiftCards = async (req, res, next) => {
    try {
        const { search, status, page = 1, limit = 10 } = req.query;
        const where = {};

        if (status && status !== "all") where.status = status;
        if (search) {
            where.OR = [
                { code: { contains: search, mode: 'insensitive' } },
                { recipientEmail: { contains: search, mode: 'insensitive' } }
            ];
        }

        const [giftCards, total] = await Promise.all([
            prisma.giftCard.findMany({
                where,
                include: { sender: { select: { name: true, email: true } } },
                orderBy: { createdAt: 'desc' },
                skip: (parseInt(page) - 1) * parseInt(limit),
                take: parseInt(limit)
            }),
            prisma.giftCard.count({ where })
        ]);

        res.json({
            success: true,
            data: giftCards,
            total,
            pages: Math.ceil(total / parseInt(limit)),
            currentPage: parseInt(page)
        });
    } catch (error) {
        next(error);
    }
};

/**
 * ✅ Update Gift Card (Admin)
 */
export const updateGiftCardStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, expiryDate, currentBalance, recipientEmail, message } = req.body;

        const giftCard = await prisma.giftCard.update({
            where: { id },
            data: {
                status: currentBalance === 0 ? "Redeemed" : status,
                expiryDate: expiryDate ? new Date(expiryDate) : undefined,
                currentBalance,
                recipientEmail,
                message
            }
        });

        logger.info({ id, changes: req.body }, "Gift Card Updated by Admin");
        res.json({ success: true, message: "Gift Card updated successfully", data: giftCard });
    } catch (error) {
        next(error);
    }
};

/**
 * ✅ Delete Gift Card (Admin)
 */
export const deleteGiftCard = async (req, res, next) => {
    try {
        const { id } = req.params;
        await prisma.giftCard.delete({ where: { id } });
        logger.info({ id }, "Gift Card Deleted by Admin");
        res.json({ success: true, message: "Gift Card deleted successfully" });
    } catch (error) {
        next(error);
    }
};
