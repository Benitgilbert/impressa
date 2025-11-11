import Category from "../models/Category.js";
import Product from "../models/Product.js";

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
      filter.parent = parent === "null" ? null : parent;
    }

    const categories = await Category.find(filter)
      .populate("parent", "name slug")
      .sort({ order: 1, name: 1 });

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
    const tree = await Category.getCategoryTree();

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
    
    // Check if identifier is a valid ObjectId
    const isObjectId = identifier.match(/^[0-9a-fA-F]{24}$/);
    
    const category = isObjectId
      ? await Category.findById(identifier).populate("parent", "name slug")
      : await Category.findOne({ slug: identifier }).populate("parent", "name slug");

    if (!category) {
      const error = new Error("Category not found");
      error.statusCode = 404;
      return next(error);
    }

    // Get path (breadcrumb)
    const path = await category.getPath();

    // Get direct children
    const children = await Category.find({ parent: category._id, isActive: true })
      .sort({ order: 1, name: 1 });

    res.json({
      success: true,
      data: {
        ...category.toObject(),
        path: path.map(c => ({ _id: c._id, name: c.name, slug: c.slug })),
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
    const category = await Category.create(req.body);

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

    const category = await Category.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!category) {
      const error = new Error("Category not found");
      error.statusCode = 404;
      return next(error);
    }

    res.json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete category
 */
export const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);

    if (!category) {
      const error = new Error("Category not found");
      error.statusCode = 404;
      return next(error);
    }

    // Check if category has children
    const childrenCount = await Category.countDocuments({ parent: id });
    if (childrenCount > 0) {
      const error = new Error(
        "Cannot delete category with subcategories. Delete subcategories first."
      );
      error.statusCode = 400;
      return next(error);
    }

    // Check if category has products
    const productsCount = await Product.countDocuments({ categories: id });
    if (productsCount > 0) {
      const error = new Error(
        `Cannot delete category. It has ${productsCount} product(s) assigned.`
      );
      error.statusCode = 400;
      return next(error);
    }

    await category.deleteOne();

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

    // Find category
    const isObjectId = identifier.match(/^[0-9a-fA-F]{24}$/);
    const category = isObjectId
      ? await Category.findById(identifier)
      : await Category.findOne({ slug: identifier });

    if (!category) {
      const error = new Error("Category not found");
      error.statusCode = 404;
      return next(error);
    }

    let categoryIds = [category._id];

    // Include products from descendant categories
    if (includeDescendants === "true") {
      const descendants = await Category.getDescendants(category._id);
      categoryIds = [...categoryIds, ...descendants.map(d => d._id)];
    }

    const products = await Product.find({
      categories: { $in: categoryIds },
      // Add visibility filter if needed
    })
      .populate("categories", "name slug")
      .sort({ featured: -1, createdAt: -1 });

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

    // Update each category's order
    const updatePromises = categoryOrders.map(({ id, order }) =>
      Category.findByIdAndUpdate(id, { order }, { new: true })
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
