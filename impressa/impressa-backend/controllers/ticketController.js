import Ticket from "../models/Ticket.js";
import { notifyViolation } from "./notificationController.js"; // abusing this for tickets too if category is violation

/**
 * Get all tickets (admin)
 */
export const getAllTickets = async (req, res, next) => {
    try {
        const { status, priority, category, page = 1, limit = 20 } = req.query;

        const filter = {};
        if (status && status !== 'all') filter.status = status;
        if (priority) filter.priority = priority;
        if (category) filter.category = category;

        const tickets = await Ticket.find(filter)
            .populate('createdBy', 'name email')
            .populate('assignedTo', 'name')
            .select('ticketId subject category priority status createdBy createdByRole createdAt')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Ticket.countDocuments(filter);

        // Stats
        const stats = {
            total: await Ticket.countDocuments(),
            open: await Ticket.countDocuments({ status: 'open' }),
            inProgress: await Ticket.countDocuments({ status: 'in_progress' }),
            waiting: await Ticket.countDocuments({ status: 'waiting' }),
            resolved: await Ticket.countDocuments({ status: { $in: ['resolved', 'closed'] } })
        };

        res.json({
            success: true,
            data: tickets,
            stats,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get single ticket details
 */
export const getTicketDetails = async (req, res, next) => {
    try {
        const { id } = req.params;

        const ticket = await Ticket.findById(id)
            .populate('createdBy', 'name email')
            .populate('assignedTo', 'name email')
            .populate('relatedOrder', 'publicId totals status')
            .populate('relatedProduct', 'name image')
            .populate('messages.sender', 'name email')
            .populate('resolvedBy', 'name');

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
 * Create ticket (customer/seller)
 */
export const createTicket = async (req, res, next) => {
    try {
        const { subject, description, category, priority, relatedOrder, relatedProduct } = req.body;

        const ticket = await Ticket.create({
            subject,
            description,
            category: category || 'other',
            priority: priority || 'medium',
            createdBy: req.user._id,
            createdByRole: req.user.role === 'seller' ? 'seller' : 'customer',
            relatedOrder,
            relatedProduct,
            messages: [{
                sender: req.user._id,
                senderRole: req.user.role === 'seller' ? 'seller' : 'customer',
                message: description
            }]
        });

        // 🔔 Notify Admin if Violation
        try {
            if (category === 'violation' || category === 'report' || category === 'abuse') {
                notifyViolation('manual_report', req.user.name);
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
 * Add message to ticket
 */
export const addMessage = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { message } = req.body;

        const ticket = await Ticket.findById(id);

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

        ticket.messages.push({
            sender: req.user._id,
            senderRole,
            message
        });

        // Update status based on who replied
        if (req.user.role === 'admin') {
            ticket.status = 'waiting'; // Waiting for customer response
        } else if (ticket.status === 'waiting') {
            ticket.status = 'in_progress'; // Customer responded
        }

        await ticket.save();

        res.json({
            success: true,
            message: "Message added",
            data: ticket
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update ticket status (admin)
 */
export const updateTicketStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, assignedTo, resolutionNote } = req.body;

        const update = {};
        if (status) update.status = status;
        if (assignedTo) update.assignedTo = assignedTo;
        if (resolutionNote) update.resolutionNote = resolutionNote;

        if (status === 'resolved' || status === 'closed') {
            update.resolvedAt = new Date();
            update.resolvedBy = req.user._id;
        }

        const ticket = await Ticket.findByIdAndUpdate(id, update, { new: true })
            .populate('assignedTo', 'name');

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: "Ticket not found"
            });
        }

        res.json({
            success: true,
            message: `Ticket ${status ? `marked as ${status}` : 'updated'}`,
            data: ticket
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get my tickets (customer/seller)
 */
export const getMyTickets = async (req, res, next) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;

        const filter = { createdBy: req.user._id };
        if (status && status !== 'all') filter.status = status;

        const tickets = await Ticket.find(filter)
            .select('ticketId subject category priority status createdAt')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Ticket.countDocuments(filter);

        res.json({
            success: true,
            data: tickets,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete ticket (admin)
 */
export const deleteTicket = async (req, res, next) => {
    try {
        const { id } = req.params;

        const ticket = await Ticket.findByIdAndDelete(id);

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: "Ticket not found"
            });
        }

        res.json({
            success: true,
            message: "Ticket deleted"
        });
    } catch (error) {
        next(error);
    }
};
