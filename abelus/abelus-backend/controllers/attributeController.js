import prisma from "../prisma.js";
import asyncHandler from "../middleware/asyncHandler.js";

// @desc    Get all attributes
// @route   GET /api/attributes
// @access  Public
const getAttributes = asyncHandler(async (req, res) => {
    const attributes = await prisma.attribute.findMany({ 
        where: { isActive: true },
        include: { values: true }
    });
    res.json(attributes);
});

// @desc    Get attribute by ID
// @route   GET /api/attributes/:id
// @access  Public
const getAttributeById = asyncHandler(async (req, res) => {
    const attribute = await prisma.attribute.findUnique({
        where: { id: req.params.id },
        include: { values: true }
    });

    if (attribute) {
        res.json(attribute);
    } else {
        res.status(404);
        throw new Error("Attribute not found");
    }
});

// @desc    Create a new attribute
// @route   POST /api/attributes
// @access  Private/Admin
const createAttribute = asyncHandler(async (req, res) => {
    const { name, type, values } = req.body;

    const attributeExists = await prisma.attribute.findUnique({ where: { name } });

    if (attributeExists) {
        res.status(400);
        throw new Error("Attribute already exists");
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const attribute = await prisma.attribute.create({
        data: {
            name,
            slug,
            type,
            ...(values && values.length > 0 && {
                values: {
                    create: values.map(v => ({
                        name: v.name,
                        slug: v.slug || v.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                        value: v.value
                    }))
                }
            })
        },
        include: { values: true }
    });

    if (attribute) {
        res.status(201).json(attribute);
    } else {
        res.status(400);
        throw new Error("Invalid attribute data");
    }
});

// @desc    Update attribute
// @route   PUT /api/attributes/:id
// @access  Private/Admin
const updateAttribute = asyncHandler(async (req, res) => {
    const existing = await prisma.attribute.findUnique({ where: { id: req.params.id } });

    if (existing) {
        const { name, type, isActive, values } = req.body;

        const updateData = {};
        if (name) {
            updateData.name = name;
            updateData.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        }
        if (type) updateData.type = type;
        if (isActive !== undefined) updateData.isActive = isActive;

        // If new values are provided, we replace the old ones (delete then create)
        if (values) {
            await prisma.attributeValue.deleteMany({ where: { attributeId: req.params.id } });
            updateData.values = {
                create: values.map(v => ({
                    name: v.name,
                    slug: v.slug || v.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                    value: v.value
                }))
            };
        }

        const updatedAttribute = await prisma.attribute.update({
            where: { id: req.params.id },
            data: updateData,
            include: { values: true }
        });

        res.json(updatedAttribute);
    } else {
        res.status(404);
        throw new Error("Attribute not found");
    }
});

// @desc    Delete attribute
// @route   DELETE /api/attributes/:id
// @access  Private/Admin
const deleteAttribute = asyncHandler(async (req, res) => {
    try {
        await prisma.attribute.delete({ where: { id: req.params.id } });
        res.json({ message: "Attribute removed" });
    } catch (error) {
        if (error.code === 'P2025') {
            res.status(404);
            throw new Error("Attribute not found");
        }
        throw error;
    }
});

export {
    getAttributes,
    getAttributeById,
    createAttribute,
    updateAttribute,
    deleteAttribute,
};
