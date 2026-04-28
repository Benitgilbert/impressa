import prisma from "../prisma.js";
import { catchAsync } from "../middleware/errorHandler.js";

/**
 * 📰 Get all blog posts
 */
export const getAllBlogs = catchAsync(async (req, res) => {
    const blogs = await prisma.blog.findMany({
        orderBy: { createdAt: 'desc' }
    });
    res.json(blogs);
});

/**
 * 📰 Get blog by ID
 */
export const getBlogById = catchAsync(async (req, res) => {
    const blog = await prisma.blog.findUnique({
        where: { id: req.params.id }
    });
    if (!blog) {
        res.status(404);
        throw new Error("Blog not found");
    }
    res.json(blog);
});

/**
 * 📰 Create blog post
 */
export const createBlog = catchAsync(async (req, res) => {
    const blog = await prisma.blog.create({
        data: req.body
    });
    res.status(201).json(blog);
});

/**
 * 📰 Update blog post
 */
export const updateBlog = catchAsync(async (req, res) => {
    try {
        const blog = await prisma.blog.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(blog);
    } catch (err) {
        res.status(404);
        throw new Error("Blog not found");
    }
});

/**
 * 📰 Delete blog post
 */
export const deleteBlog = catchAsync(async (req, res) => {
    try {
        await prisma.blog.delete({
            where: { id: req.params.id }
        });
        res.json({ message: "Blog deleted" });
    } catch (err) {
        res.status(404);
        throw new Error("Blog not found");
    }
});
