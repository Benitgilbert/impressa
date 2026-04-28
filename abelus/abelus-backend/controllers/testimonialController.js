import prisma from "../prisma.js";

/**
 * ✍️ Get all testimonials (admin)
 */
export const getAllTestimonials = async (req, res, next) => {
    try {
        const testimonials = await prisma.testimonial.findMany({
            orderBy: [
                { order: 'asc' },
                { createdAt: 'desc' }
            ]
        });

        res.json({
            success: true,
            count: testimonials.length,
            data: testimonials
        });
    } catch (error) {
        next(error);
    }
};

/**
 * ✍️ Get active testimonials for public display
 */
export const getActiveTestimonials = async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        
        const testimonials = await prisma.testimonial.findMany({
            where: { isActive: true },
            orderBy: { order: 'asc' },
            take: limit
        });

        res.json({
            success: true,
            count: testimonials.length,
            data: testimonials
        });
    } catch (error) {
        next(error);
    }
};

/**
 * ✍️ Get single testimonial
 */
export const getTestimonialById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const testimonial = await prisma.testimonial.findUnique({
            where: { id }
        });

        if (!testimonial) {
            const error = new Error("Testimonial not found");
            error.statusCode = 404;
            return next(error);
        }

        res.json({
            success: true,
            data: testimonial
        });
    } catch (error) {
        next(error);
    }
};

/**
 * ✍️ Create testimonial
 */
export const createTestimonial = async (req, res, next) => {
    try {
        const { name, role, content, avatar, rating, isActive, order, featured } = req.body;

        const testimonial = await prisma.testimonial.create({
            data: {
                name,
                role,
                content,
                avatar,
                rating: rating ? Number(rating) : 5,
                isActive: isActive !== false,
                order: order ? Number(order) : 0,
                featured: featured || false
            }
        });

        res.status(201).json({
            success: true,
            message: "Testimonial created successfully",
            data: testimonial
        });
    } catch (error) {
        next(error);
    }
};

/**
 * ✍️ Update testimonial
 */
export const updateTestimonial = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const testimonial = await prisma.testimonial.update({
            where: { id },
            data: updates
        });

        res.json({
            success: true,
            message: "Testimonial updated successfully",
            data: testimonial
        });
    } catch (error) {
        if (error.code === 'P2025') {
            const err = new Error("Testimonial not found");
            err.statusCode = 404;
            return next(err);
        }
        next(error);
    }
};

/**
 * ✍️ Delete testimonial
 */
export const deleteTestimonial = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        await prisma.testimonial.delete({
            where: { id }
        });

        res.json({
            success: true,
            message: "Testimonial deleted successfully"
        });
    } catch (error) {
        if (error.code === 'P2025') {
            const err = new Error("Testimonial not found");
            err.statusCode = 404;
            return next(err);
        }
        next(error);
    }
};

/**
 * ✍️ Toggle testimonial active status
 */
export const toggleTestimonialStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const testimonial = await prisma.testimonial.findUnique({ where: { id } });

        if (!testimonial) {
            const error = new Error("Testimonial not found");
            error.statusCode = 404;
            return next(error);
        }

        const updatedTestimonial = await prisma.testimonial.update({
            where: { id },
            data: { isActive: !testimonial.isActive }
        });

        res.json({
            success: true,
            message: `Testimonial ${updatedTestimonial.isActive ? "activated" : "deactivated"} successfully`,
            data: updatedTestimonial
        });
    } catch (error) {
        next(error);
    }
};
