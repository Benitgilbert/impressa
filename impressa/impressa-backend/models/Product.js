import mongoose from "mongoose";
import slugify from "slugify";

const variationSchema = new mongoose.Schema({
  sku: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  attributes: {
    type: Map,
    of: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  stock: {
    type: Number,
    default: 0,
  },
  image: {
    type: String,
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },
    description: String,
    price: {
      type: Number,
      required: true,
    },
    stock: {
      type: Number,
      default: 0,
    },
    sku: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    barcode: {
      type: String,
      sparse: true,
      index: true,
    },
    image: {
      type: String,
      default: null,
    },
    images: {
      type: [String],
      default: [],
    },
    categories: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
      default: [],
      index: true,
    },
    attributes: {
      type: [{
        name: { type: String, required: true },
        values: { type: [String], required: true },
      }],
      default: [],
    },
    variations: {
      type: [variationSchema],
      default: [],
    },
    visibility: {
      type: String,
      enum: ["public", "hidden", "draft"],
      default: "public",
      index: true,
    },
    weight: {
      type: Number,
      default: 0,
    },
    dimensions: {
      length: { type: Number, default: 0 },
      width: { type: Number, default: 0 },
      height: { type: Number, default: 0 },
    },
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    customizable: {
      type: Boolean,
      default: false,
    },
    customizationOptions: {
      type: [String],
      default: [],
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
    // Sales tracking
    salesCount: {
      type: Number,
      default: 0,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for average rating (if reviews implemented)
productSchema.virtual("averageRating", {
  ref: "Review",
  localField: "_id",
  foreignField: "product",
  justOne: false,
});

// Generate slug from name before saving
productSchema.pre("save", async function (next) {
  if (this.isModified("name") && !this.slug) {
    let slug = slugify(this.name, { lower: true, strict: true });
    
    const existingProduct = await mongoose.models.Product.findOne({ 
      slug, 
      _id: { $ne: this._id } 
    });
    
    if (existingProduct) {
      slug = `${slug}-${Date.now()}`;
    }
    
    this.slug = slug;
  }
  next();
});

// Text search index
productSchema.index({ name: "text", description: "text", tags: "text" });

// Compound indexes for common queries
productSchema.index({ visibility: 1, featured: -1, createdAt: -1 });
productSchema.index({ categories: 1, visibility: 1 });
productSchema.index({ price: 1 });

const Product = mongoose.model("Product", productSchema);

export default Product;
