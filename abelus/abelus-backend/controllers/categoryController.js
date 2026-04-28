import prisma from "../prisma.js";

/**
 * Get all categories (flat list)
 */
export const getAllCategories = async (req, res, next) => {
  try {
    const { isActive, parent } = req.query;
    const filter = {};

    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }

    if (parent !== undefined) {
      filter.parentId = parent === "null" ? null : parent;
    }

    const categories = await prisma.category.findMany({
      where: filter,
      include: { parent: { select: { id: true, name: true, slug: true } } },
      orderBy: [{ order: 'asc' }, { name: 'asc' }]
    });

    res.json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get category tree (hierarchical structure)
 */
export const getCategoryTree = async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: [{ order: 'asc' }, { name: 'asc' }]
    });

    const buildTree = (cats, parentId = null) => {
      return cats
        .filter(c => c.parentId === parentId)
        .map(c => ({
          ...c,
          children: buildTree(cats, c.id)
        }));
    };

    const tree = buildTree(categories);

    res.json({
      success: true,
      data: tree,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single category by ID or slug
 */
export const getCategoryByIdOrSlug = async (req, res, next) => {
  try {
    const { identifier } = req.params;

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(identifier);

    const category = await prisma.category.findFirst({
      where: isUUID ? { id: identifier } : { slug: identifier },
      include: { parent: { select: { id: true, name: true, slug: true } } }
    });

    if (!category) {
      const error = new Error("Category not found");
      error.statusCode = 404;
      return next(error);
    }

    // Build breadcrumb path
    const path = [];
    let current = category;
    while (current) {
      path.unshift({ _id: current.id, name: current.name, slug: current.slug });
      if (current.parentId) {
        current = await prisma.category.findUnique({ where: { id: current.parentId } });
      } else {
        current = null;
      }
    }

    // Get direct children
    const children = await prisma.category.findMany({
      where: { parentId: category.id, isActive: true },
      orderBy: [{ order: 'asc' }, { name: 'asc' }]
    });

    res.json({
      success: true,
      data: {
        ...category,
        path,
        children,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new category
 */
export const createCategory = async (req, res, next) => {
  try {
    const category = await prisma.category.create({
      data: req.body
    });

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update category
 */
export const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.update({
      where: { id },
      data: req.body
    });

    res.json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  } catch (error) {
    if (error.code === 'P2025') {
      const err = new Error("Category not found");
      err.statusCode = 404;
      return next(err);
    }
    next(error);
  }
};

/**
 * Delete category
 */
export const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findUnique({ where: { id } });

    if (!category) {
      const error = new Error("Category not found");
      error.statusCode = 404;
      return next(error);
    }

    // Check if category has children
    const childrenCount = await prisma.category.count({ where: { parentId: id } });
    if (childrenCount > 0) {
      const error = new Error(
        "Cannot delete category with subcategories. Delete subcategories first."
      );
      error.statusCode = 400;
      return next(error);
    }

    // Check if category has products
    const productsCount = await prisma.product.count({
      where: { categories: { some: { id } } }
    });
    
    if (productsCount > 0) {
      const error = new Error(
        `Cannot delete category. It has ${productsCount} product(s) assigned.`
      );
      error.statusCode = 400;
      return next(error);
    }

    await prisma.category.delete({ where: { id } });

    res.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get products by category
 */
export const getProductsByCategory = async (req, res, next) => {
  try {
    const { identifier } = req.params;
    const { includeDescendants = "true" } = req.query;

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(identifier);

    const category = await prisma.category.findFirst({
      where: isUUID ? { id: identifier } : { slug: identifier }
    });

    if (!category) {
      const error = new Error("Category not found");
      error.statusCode = 404;
      return next(error);
    }

    let categoryIds = [category.id];

    if (includeDescendants === "true") {
      const allCats = await prisma.category.findMany();
      
      const getDescendants = (cats, parentId) => {
        let descendants = [];
        const children = cats.filter(c => c.parentId === parentId);
        for (const child of children) {
          descendants.push(child.id);
          descendants = descendants.concat(getDescendants(cats, child.id));
        }
        return descendants;
      };

      const descendantIds = getDescendants(allCats, category.id);
      categoryIds = [...categoryIds, ...descendantIds];
    }

    const products = await prisma.product.findMany({
      where: {
        categories: { some: { id: { in: categoryIds } } },
        visibility: "public",
        approvalStatus: "approved"
      },
      include: { categories: { select: { id: true, name: true, slug: true } } },
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }]
    });

    res.json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reorder categories
 */
export const reorderCategories = async (req, res, next) => {
  try {
    const { categoryOrders } = req.body; // Array of { id, order }

    if (!Array.isArray(categoryOrders)) {
      const error = new Error("categoryOrders must be an array");
      error.statusCode = 400;
      return next(error);
    }

    const updatePromises = categoryOrders.map(({ id, order }) =>
      prisma.category.update({
        where: { id },
        data: { order }
      })
    );

    await Promise.all(updatePromises);

    res.json({
      success: true,
      message: "Categories reordered successfully",
    });
  } catch (error) {
    next(error);
  }
};
