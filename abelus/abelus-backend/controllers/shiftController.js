import prisma from "../prisma.js";
import logger from "../config/logger.js";

/**
 * 🕒 Start a new shift
 */
export const startShift = async (req, res) => {
    try {
        const { startingDrawerAmount } = req.body;

        if (startingDrawerAmount === undefined) {
            return res.status(400).json({ success: false, message: "Starting drawer amount is required" });
        }

        // Check if there is already an open shift for this user
        const existingShift = await prisma.shift.findFirst({
            where: { userId: req.user.id, status: "open" }
        });
        if (existingShift) {
            return res.status(400).json({ success: false, message: "You already have an open shift. Please close it first." });
        }

        const newShift = await prisma.shift.create({
            data: {
                userId: req.user.id,
                startingDrawerAmount: Number(startingDrawerAmount),
                expectedEndingDrawerAmount: Number(startingDrawerAmount)
            }
        });

        res.status(201).json({ success: true, data: newShift });
    } catch (error) {
        logger.error({ err: error }, "Failed to start shift");
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

/**
 * 🕒 Get current active shift for user
 */
export const getCurrentShift = async (req, res) => {
    try {
        const shift = await prisma.shift.findFirst({
            where: { userId: req.user.id, status: "open" }
        });
        
        if (!shift) {
            return res.status(200).json({ success: true, data: null });
        }

        res.status(200).json({ success: true, data: shift });
    } catch (error) {
        logger.error({ err: error }, "Failed to get current shift");
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

/**
 * 🕒 Close current active shift
 */
export const closeShift = async (req, res) => {
    try {
        const { actualEndingDrawerAmount, notes } = req.body;

        if (actualEndingDrawerAmount === undefined) {
            return res.status(400).json({ success: false, message: "Actual ending drawer amount is required" });
        }

        const shift = await prisma.shift.findFirst({
            where: { userId: req.user.id, status: "open" }
        });
        if (!shift) {
            return res.status(404).json({ success: false, message: "No open shift found" });
        }

        const updatedShift = await prisma.shift.update({
            where: { id: shift.id },
            data: {
                status: "closed",
                endTime: new Date(),
                actualEndingDrawerAmount: Number(actualEndingDrawerAmount),
                notes: notes || shift.notes
            }
        });

        res.status(200).json({ success: true, data: updatedShift });
    } catch (error) {
        logger.error({ err: error }, "Failed to close shift");
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

/**
 * 🕒 Get shift report by ID
 */
export const getShiftReport = async (req, res) => {
    try {
        const shift = await prisma.shift.findUnique({
            where: { id: req.params.id },
            include: {
                orders: {
                    select: { publicId: true, grandTotal: true, paymentMethod: true, status: true, createdAt: true }
                },
                abonneTransactions: {
                    include: { client: true }
                },
                expenses: {
                    include: { user: { select: { name: true } } }
                },
                user: { select: { id: true, name: true, email: true } }
            }
        });

        if (!shift) {
            return res.status(404).json({ success: false, message: "Shift not found" });
        }

        // Check if user is authorized (Admin or the shift owner)
        if (req.user.role !== "admin" && shift.userId !== req.user.id) {
            return res.status(403).json({ success: false, message: "Not authorized to view this shift" });
        }

        res.status(200).json({ success: true, data: shift });
    } catch (error) {
        logger.error({ err: error }, "Failed to get shift report");
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

/**
 * 🕒 Get active shift stats for dashboard
 */
export const getActiveShiftStats = async (req, res) => {
    try {
        const shift = await prisma.shift.findFirst({
            where: { userId: req.user.id, status: "open" }
        });

        if (!shift) {
            return res.status(200).json({ 
                success: true, 
                data: {
                    isOpen: false,
                    moneyInDrawer: 0,
                    cashSales: 0,
                    momoSales: 0,
                    debtCollected: 0
                } 
            });
        }

        res.status(200).json({
            success: true,
            data: {
                isOpen: true,
                moneyInDrawer: shift.expectedEndingDrawerAmount,
                cashSales: shift.totalCashSales,
                momoSales: shift.totalMomoSales,
                debtCollected: shift.totalDebtCollected
            }
        });
    } catch (error) {
        logger.error({ err: error }, "Failed to get active shift stats");
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

/**
 * 🕒 Get list of shifts for the logged-in user
 */
export const getMyShifts = async (req, res) => {
    try {
        const isAdminAll = req.user.role === 'admin' && req.path === '/all';
        const shifts = await prisma.shift.findMany({
            where: isAdminAll ? {} : { userId: req.user.id },
            orderBy: { startTime: 'desc' },
            include: isAdminAll ? { user: { select: { name: true } } } : undefined,
            take: 100 // Limit to last 100 shifts
        });

        res.status(200).json({ success: true, data: shifts });
    } catch (error) {
        logger.error({ err: error }, "Failed to get shift list");
        res.status(500).json({ success: false, message: "Server Error" });
    }
};
