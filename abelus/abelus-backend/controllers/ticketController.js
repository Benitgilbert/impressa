import prisma from "../prisma.js";
import { notifyViolation } from "./notificationController.js";

/**
 * 🎫 Get all tickets (admin)
 */
export const getAllTickets = async (req, res, next) => {
    try {
        const { status, priority, category, page = 1, limit = 20 } = req.query;

        const where = {};
        if (status && status !== 'all') where.status = status;
        if (priority) where.priority = priority;
        if (category) where.category = category;

        const tickets = await prisma.ticket.findMany({
            where,
            include: {
                createdBy: { select: { id: true, name: true, email: true } },
                assignedTo: { select: { id: true, name: true } }
            },
            orderBy: { createdAt: 'desc' },
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit)
        });

        const total = await prisma.ticket.count({ where });

        // Stats
        const stats = {
            total: await prisma.ticket.count(),
            open: await prisma.ticket.count({ where: { status: 'open' } }),
            inProgress: await prisma.ticket.count({ where: { status: 'in_progress' } }),
            waiting: await prisma.ticket.count({ where: { status: 'waiting' } }),
            resolved: await prisma.ticket.count({ where: { status: { in: ['resolved', 'closed'] } } })
        };

        res.json({
            success: true,
            data: tickets,
            stats,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * 🎫 Get single ticket details
 */
export const getTicketDetails = async (req, res, next) => {
    try {
        const { id } = req.params;

        const ticket = await prisma.ticket.findUnique({
            where: { id },
            include: {
                createdBy: { select: { name: true, email: true } },
                assignedTo: { select: { name: true, email: true } },
                relatedOrder: { select: { publicId: true, grandTotal: true, status: true } },
                relatedProduct: { select: { name: true, image: true } },
                resolvedBy: { select: { name: true } }
            }
        });

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: "Ticket not found"
            });
        }

        res.json({
            success: true,
            data: ticket
        });
    } catch (error) {
        next(error);
    }
};

/**
 * 🎫 Create ticket (customer/seller)
 */
export const createTicket = async (req, res, next) => {
    try {
        const { subject, description, category, priority, relatedOrderId, relatedProductId } = req.body;

        const ticketId = `TCK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const ticket = await prisma.ticket.create({
            data: {
                ticketId,
                subject,
                description,
                category: category || 'other',
                priority: priority || 'medium',
                createdById: req.user.id,
                createdByRole: req.user.role === 'seller' ? 'seller' : 'customer',
                relatedOrderId,
                relatedProductId,
                messages: [{
                    sender: req.user.id,
                    senderName: req.user.name,
                    senderRole: req.user.role === 'seller' ? 'seller' : 'customer',
                    message: description,
                    createdAt: new Date()
                }]
            }
        });

        // 🔔 Notify Admin if Violation
        try {
            if (['violation', 'report', 'abuse'].includes(category)) {
                notifyViolation('manual_report', req.user.name || "User");
            }
        } catch (e) { }

        res.status(201).json({
            success: true,
            message: "Ticket created successfully",
            data: ticket
        });
    } catch (error) {
        next(error);
    }
};

/**
 * 🎫 Add message to ticket
 */
export const addMessage = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { message } = req.body;

        const ticket = await prisma.ticket.findUnique({ where: { id } });

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: "Ticket not found"
            });
        }

        // Determine sender role
        let senderRole = 'customer';
        if (req.user.role === 'admin') senderRole = 'admin';
        else if (req.user.role === 'seller') senderRole = 'seller';

        const newMessage = {
            sender: req.user.id,
            senderName: req.user.name,
            senderRole,
            message,
            createdAt: new Date()
        };

        const currentMessages = Array.isArray(ticket.messages) ? ticket.messages : [];
        
        let newStatus = ticket.status;
        if (req.user.role === 'admin') {
            newStatus = 'waiting'; // Waiting for customer response
        } else if (ticket.status === 'waiting') {
            newStatus = 'in_progress'; // Customer responded
        }

        const updatedTicket = await prisma.ticket.update({
            where: { id },
            data: {
                messages: [...currentMessages, newMessage],
                status: newStatus
            }
        });

        res.json({
            success: true,
            message: "Message added",
            data: updatedTicket
        });
    } catch (error) {
        next(error);
    }
};

/**
 * 🎫 Update ticket status (admin)
 */
export const updateTicketStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, assignedToId, resolutionNote } = req.body;

        const data = {};
        if (status) data.status = status;
        if (assignedToId) data.assignedToId = assignedToId;
        if (resolutionNote) data.resolutionNote = resolutionNote;

        if (status === 'resolved' || status === 'closed') {
            data.resolvedAt = new Date();
            data.resolvedById = req.user.id;
        }

        const updatedTicket = await prisma.ticket.update({
            where: { id },
            data,
            include: { assignedTo: { select: { name: true } } }
        });

        res.json({
            success: true,
            message: `Ticket ${status ? `marked as ${status}` : 'updated'}`,
            data: updatedTicket
        });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ success: false, message: "Ticket not found" });
        }
        next(error);
    }
};

/**
 * 🎫 Get my tickets (customer/seller)
 */
export const getMyTickets = async (req, res, next) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;

        const where = { createdById: req.user.id };
        if (status && status !== 'all') where.status = status;

        const tickets = await prisma.ticket.findMany({
            where,
            select: { ticketId: true, subject: true, category: true, priority: true, status: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit)
        });

        const total = await prisma.ticket.count({ where });

        res.json({
            success: true,
            data: tickets,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * 🎫 Delete ticket (admin)
 */
export const deleteTicket = async (req, res, next) => {
    try {
        const { id } = req.params;

        await prisma.ticket.delete({
            where: { id }
        });

        res.json({
            success: true,
            message: "Ticket deleted"
        });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ success: false, message: "Ticket not found" });
        }
        next(error);
    }
};
