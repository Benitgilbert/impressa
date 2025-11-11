import mongoose from "mongoose";
import slugify from "slugify";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      maxlength: [100, "Category name cannot exceed 100 characters"],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
      index: true,
    },
    image: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    // SEO fields
    metaTitle: {
      type: String,
      maxlength: 60,
    },
    metaDescription: {
      type: String,
      maxlength: 160,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for children categories
categorySchema.virtual("children", {
  ref: "Category",
  localField: "_id",
  foreignField: "parent",
});

// Generate slug from name before saving
categorySchema.pre("save", async function (next) {
  if (this.isModified("name")) {
    let slug = slugify(this.name, { lower: true, strict: true });
    
    // Check for existing slug and add suffix if needed
    const existingCategory = await mongoose.models.Category.findOne({ 
      slug, 
      _id: { $ne: this._id } 
    });
    
    if (existingCategory) {
      slug = `${slug}-${Date.now()}`;
    }
    
    this.slug = slug;
  }
  next();
});

// Prevent circular parent-child relationships
categorySchema.pre("save", async function (next) {
  if (this.parent && this.parent.equals(this._id)) {
    return next(new Error("Category cannot be its own parent"));
  }
  
  // Check if parent exists
  if (this.parent) {
    const parentCategory = await mongoose.models.Category.findById(this.parent);
    if (!parentCategory) {
      return next(new Error("Parent category not found"));
    }
  }
  
  next();
});

// Static method to get category tree
categorySchema.statics.getCategoryTree = async function (parentId = null) {
  const categories = await this.find({ parent: parentId, isActive: true })
    .sort({ order: 1, name: 1 })
    .lean();

  for (let category of categories) {
    category.children = await this.getCategoryTree(category._id);
  }

  return categories;
};

// Static method to get all ancestors of a category
categorySchema.statics.getAncestors = async function (categoryId) {
  const ancestors = [];
  let currentCategory = await this.findById(categoryId);

  while (currentCategory && currentCategory.parent) {
    const parent = await this.findById(currentCategory.parent);
    if (parent) {
      ancestors.unshift(parent);
      currentCategory = parent;
    } else {
      break;
    }
  }

  return ancestors;
};

// Static method to get all descendants of a category
categorySchema.statics.getDescendants = async function (categoryId) {
  const descendants = [];
  const children = await this.find({ parent: categoryId });

  for (let child of children) {
    descendants.push(child);
    const childDescendants = await this.getDescendants(child._id);
    descendants.push(...childDescendants);
  }

  return descendants;
};

// Method to get full path (breadcrumb)
categorySchema.methods.getPath = async function () {
  const ancestors = await this.constructor.getAncestors(this._id);
  return [...ancestors, this];
};

// Indexes for performance
categorySchema.index({ name: "text", description: "text" });
categorySchema.index({ parent: 1, isActive: 1, order: 1 });

const Category = mongoose.model("Category", categorySchema);

export default Category;
