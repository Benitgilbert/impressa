import prisma from "../prisma.js";

/**
 * 🚨 Get violations with filtering
 */
export const getViolations = async (req, res) => {
    try {
        const { status, type, page = 1, limit = 10 } = req.query;
        const where = {};

        if (status && status !== 'all') where.status = status;
        if (type && type !== 'all') where.type = type;

        const violations = await prisma.violation.findMany({
            where,
            include: { seller: { select: { id: true, name: true, email: true, storeName: true } } },
            orderBy: { createdAt: 'desc' },
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit)
        });

        const count = await prisma.violation.count({ where });

        // Stats
        const stats = {
            total: await prisma.violation.count(),
            active: await prisma.violation.count({ where: { status: 'active' } }),
            warning: await prisma.violation.count({ where: { status: 'warning' } }),
            suspension: await prisma.violation.count({ where: { status: 'suspension' } })
        };

        res.json({
            violations,
            totalPages: Math.ceil(count / Number(limit)),
            currentPage: Number(page),
            stats
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/**
 * 🚨 Update violation status (Dismiss, Escalate)
 */
export const updateViolationStatus = async (req, res) => {
    try {
        const { status, adminNotes } = req.body;
        const id = req.params.id;

        const updateData = { status };
        if (adminNotes) updateData.adminNotes = adminNotes;

        if (status === 'dismissed') {
            updateData.resolvedAt = new Date();
        }

        const violation = await prisma.violation.update({
            where: { id },
            data: updateData
        });

        res.json(violation);
    } catch (err) {
        if (err.code === 'P2025') {
            return res.status(404).json({ message: 'Violation not found' });
        }
        res.status(500).json({ message: err.message });
    }
};

/**
 * 🚨 Generate Sample Violations (For Demo Purpose)
 */
export const generateSampleViolations = async (req, res) => {
    try {
        const sellers = await prisma.user.findMany({
            where: { role: 'seller' },
            take: 1
        });
        
        if (sellers.length === 0) return res.status(400).json({ message: 'No sellers found to violate' });

        const violation = await prisma.violation.create({
            data: {
                sellerId: sellers[0].id,
                type: 'high_cancellation_rate',
                severity: 'high',
                status: 'active',
                penaltyPoints: 5,
                description: 'Cancellation rate (25%) exceeds threshold (20%)',
                metrics: { currentValue: 25, threshold: 20 }
            }
        });

        res.status(201).json({ message: 'Sample violation generated', violation });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
